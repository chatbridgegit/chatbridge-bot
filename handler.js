import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import fs from 'fs'
import chalk from 'chalk'
import { messageQueue, commandQueue, mediaQueue } from './lib/queue.js'
import {
  findParticipantByIdentity,
  getGroupAuthorization,
  getAuthorization,
  getIdentityResolver,
  identityMatchesJid,
  participantIdentity,
  recordParticipantMappings
} from './lib/whatsapp-identity.js'
import { pluginRolesAllowed } from './lib/plugin-registry.js'
import { ensureGroupState, identityKey, markDatabaseDirty } from './lib/group-state.js'
import { recordUnityActivity } from './lib/uc-engine.js'
import { allowsUnverifiedGroupUser, isCompleteGroupMetadata, requiresVerifiedGroupAuthorization } from './lib/group-authorization.js'
import { pluginUi } from './lib/plugin-font.js'

const isNumber = x => typeof x === 'number' && !isNaN(x)
const safeArray = x => Array.isArray(x) ? x : []
const delay = ms => isNumber(ms) && ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : null
let permissionPreviewThumbnail
let permissionPreviewLoaded = false

function loadPermissionPreview() {
  if (!permissionPreviewLoaded) {
    permissionPreviewLoaded = true
    try {
      permissionPreviewThumbnail = fs.readFileSync(join(process.cwd(), 'media', 'principale.jpeg'))
    } catch {}
  }
  return permissionPreviewThumbnail
}

async function getPromotionQuote(conn, chatId, actor, target, action) {
  const participant = actor || target || null
  const timestampPart = Date.now().toString(36).toUpperCase().slice(-8).padStart(8, '0')
  const quotedId = `3EB0${timestampPart}${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  const isPromote = action === 'promote'
  const quotedText = isPromote
    ? '🔔 Notifica promozione amministratore'
    : '🔔 Notifica retrocessione amministratore'
  loadPermissionPreview()

  if (permissionPreviewThumbnail && typeof conn?.waUploadToServer === 'function') {
    try {
      const { generateWAMessage } = await import('@chatest/baileys')
      const quoted = await generateWAMessage(chatId, {
        image: permissionPreviewThumbnail,
        caption: quotedText
      }, {
        userJid: conn.user?.jid || conn.user?.id || chatId,
        upload: conn.waUploadToServer.bind(conn)
      })

      quoted.key = {
        ...quoted.key,
        remoteJid: chatId,
        fromMe: false,
        ...(participant ? { participant } : {})
      }
      if (participant) quoted.participant = participant
      return quoted
    } catch (error) {
      console.error('Errore creazione quoted immagine evento', error)
    }
  }

  return {
    key: {
      remoteJid: chatId,
      fromMe: false,
      id: quotedId,
      ...(participant ? { participant } : {})
    },
    message: {
      ...(permissionPreviewThumbnail
        ? {
            imageMessage: {
              mimetype: 'image/jpeg',
              jpegThumbnail: permissionPreviewThumbnail,
              fileLength: permissionPreviewThumbnail.length,
              caption: quotedText
            }
          }
        : {
            extendedTextMessage: {
              text: quotedText
            }
          })
    },
    ...(participant ? { participant } : {}),
    messageTimestamp: Math.floor(Date.now() / 1000)
  }
}

function pluginRoles(plugin) {
  const roles = Array.isArray(plugin?.roles)
    ? plugin.roles
    : Array.isArray(plugin?.permissions?.roles)
      ? plugin.permissions.roles
      : []
  return roles.map(role => String(role).toLowerCase())
}

function explicitRoleNotice(plugin) {
  const roles = pluginRoles(plugin)
  if (plugin?.admin === true) return 'admin'
  if (plugin?.moderator === true) return 'moderator'
  if (!roles.includes('user') && (roles.includes('moderator') || roles.includes('mod'))) return 'moderator'
  if (!roles.includes('user') && roles.includes('admin')) return 'admin'
  return null
}

async function simulateHumanTyping(conn, chatId) {
  if (!conn || !chatId) return
  try {
    await conn.sendPresenceUpdate('composing', chatId)
    const typingDelay = 500 + Math.random() * 1000
    await new Promise(resolve => setTimeout(resolve, typingDelay))
  } catch (error) {
    console.error('[TYPING] Errore:', error)
  }
}

async function stopTyping(conn, chatId) {
  if (!conn || !chatId) return
  try {
    await conn.sendPresenceUpdate('paused', chatId)
  } catch (error) {
    console.error('[TYPING] Errore stop:', error)
  }
}

global.processedMessages = global.processedMessages || new Set()
global.groupMetaCache = global.groupMetaCache || new Map()
global.kickReasons = global.kickReasons || new Map()

const DUPLICATEWINDOW = 3000
const GROUPMETACACHETTL = 300000
const dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')

function getRuntimeSystems() {
  if (global.runtimeSystems?.initialized) return global.runtimeSystems

  const manager = global.connectionManager

  const rawRateLimiter = manager?.subsystems?.rateLimiter
  const antiBan = rawRateLimiter
    ? {
        reportError() { rawRateLimiter.reportError() },
        reportSuccess() { rawRateLimiter.reportSuccess() },
        getAdaptiveDelay() { return 0 },
        getStats() { return rawRateLimiter.status || {} }
      }
    : {
        reportError() {},
        reportSuccess() {},
        getAdaptiveDelay() { return 0 },
        getStats() { return {} }
      }

  const rawMetrics = manager?.subsystems?.metrics
  const metricsTimers = new Map()
  const metrics = rawMetrics
    ? {
        startTimer(name) {
          const id = Symbol(name || 'timer')
          metricsTimers.set(id, rawMetrics.startTimer(name || 'unnamed'))
          return id
        },
        endTimer(id) {
          const stopFn = metricsTimers.get(id)
          if (stopFn) { stopFn(); metricsTimers.delete(id) }
        },
        recordMessageSent() { rawMetrics.increment('messages.sent') },
        recordError() { rawMetrics.increment('errors') },
        getReport() { return rawMetrics.snapshot() }
      }
    : {
        startTimer() { return Date.now() },
        endTimer() {},
        recordMessageSent() {},
        recordError() {},
        getReport() { return {} }
      }

  global.runtimeSystems = {
    initialized: true,
    antiBan,
    metrics
  }

  return global.runtimeSystems
}

function selectQueue(m) {
  if (m.isCommand || (typeof m.text === 'string' && (m.text.startsWith('.') || m.text.startsWith('#')))) return commandQueue
  if (m.mtype?.includes('image') || m.mtype?.includes('video')) return messageQueue
  if (m.mtype?.includes('audio') || m.mtype?.includes('document') || m.mtype?.includes('sticker')) return mediaQueue
  return messageQueue
}

function getJidUser(jid) {
  return typeof jid === 'string' ? jid.split('@')[0].split(':')[0] : ''
}

function toReasonString(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function normalizeKickReasonInput(input) {
  if (typeof input === 'string') {
    return {
      type: 'manual',
      reason: input.trim() || 'motivo non specificato',
      details: '',
      source: 'unknown',
      messageId: null,
      rawText: '',
      extra: null
    }
  }

  if (!input || typeof input !== 'object') {
    return {
      type: 'manual',
      reason: 'motivo non specificato',
      details: '',
      source: 'unknown',
      messageId: null,
      rawText: '',
      extra: null
    }
  }

  return {
    type: toReasonString(input.type || 'manual') || 'manual',
    reason: toReasonString(input.reason) || 'motivo non specificato',
    details: toReasonString(input.details),
    source: toReasonString(input.source || 'unknown') || 'unknown',
    messageId: input.messageId || null,
    rawText: toReasonString(input.rawText),
    extra: input.extra ?? null
  }
}

function setKickReason(chatId, userId, input, by = null) {
  if (!chatId || !userId) return false
  const key = `${chatId}:${userId}`
  const normalized = normalizeKickReasonInput(input)

  global.kickReasons.set(key, {
    ...normalized,
    by: by || null,
    at: Date.now()
  })

  setTimeout(() => global.kickReasons.delete(key), 5 * 60 * 1000)
  return true
}

function getKickReason(chatId, userId) {
  if (!chatId || !userId) return null
  return global.kickReasons.get(`${chatId}:${userId}`) || null
}

function deleteKickReason(chatId, userId) {
  if (!chatId || !userId) return false
  return global.kickReasons.delete(`${chatId}:${userId}`)
}

function invalidateGroupMetaCache(chatId, conn = null) {
  if (!chatId) return
  global.groupMetaCache.delete(chatId)
  const decoded = conn?.decodeJid?.(chatId) || chatId
  global.groupCache?.del?.(chatId)
  if (decoded !== chatId) global.groupCache?.del?.(decoded)
}

function hasUsableGroupMetadata(metadata, conn = null, chatId = null) {
  if (!isCompleteGroupMetadata(metadata)) return false
  if (!chatId || typeof metadata.id !== 'string') return false
  const expected = conn?.decodeJid?.(chatId) || chatId
  const actual = conn?.decodeJid?.(metadata.id) || metadata.id
  return actual === expected
}

async function getGroupMetadataCached(conn, chatId, force = false) {
  const cached = global.groupMetaCache.get(chatId)
  if (!force && cached && Date.now() - cached.timestamp < GROUPMETACACHETTL) {
    recordParticipantMappings(getIdentityResolver(conn), cached.data?.participants, 'group-metadata-cache')
    return cached.data
  }
  if (force) invalidateGroupMetaCache(chatId, conn)
  const metadata = await conn.groupMetadata(chatId).catch(() => null)
  if (hasUsableGroupMetadata(metadata, conn, chatId)) {
    recordParticipantMappings(getIdentityResolver(conn), metadata.participants, 'group-metadata')
    global.groupMetaCache.set(chatId, { data: metadata, timestamp: Date.now() })
    return metadata
  }
  return force ? null : cached?.data || null
}

function hasAdminRole(participant) {
  const role = typeof participant?.admin === 'string'
    ? participant.admin.toLowerCase()
    : participant?.admin === true
      ? 'admin'
      : ''
  return role === 'admin' || role === 'superadmin' || role === 'owner'
}

function findParticipantByJid(conn, jid, participants, identity = null) {
  const target = identity || participantIdentity({ id: jid })
  return findParticipantByIdentity(target, safeArray(participants), getIdentityResolver(conn))
}

function normalizeGroupParticipants(conn, participants) {
  return safeArray(participants).map(participant => {
    const source = typeof participant === 'string' ? { id: participant } : (participant || {})
    const rawId = source.id || source.jid || source.phoneNumber || source.pn || source.lid || ''
    const normalizedId = typeof rawId === 'string' && conn.decodeJid ? conn.decodeJid(rawId) : rawId
    return {
      ...source,
      id: normalizedId || rawId,
      jid: source.jid || normalizedId || rawId
    }
  })
}

function getGroupRoleState(conn, message, metadata, resolver, groupState) {
  const participants = safeArray(metadata?.participants)
  const normalizedParticipants = normalizeGroupParticipants(conn, participants)
  const metadataTimestamp = global.groupMetaCache.get(message.chat)?.timestamp
  const metadataAge = Number.isFinite(metadataTimestamp) ? Date.now() - metadataTimestamp : Infinity
  const senderAuthorization = getGroupAuthorization(
    message.identity,
    normalizedParticipants,
    resolver,
    {
      metadataAvailable: hasUsableGroupMetadata(metadata, conn, message.chat),
      metadataAge
    }
  )
  const participantUser = senderAuthorization.present
    ? findParticipantByJid(conn, message.sender, normalizedParticipants, message.identity)
    : null
  const bot = findParticipantByJid(conn, conn.user?.jid, normalizedParticipants)
  const configuredModerators = safeArray(groupState?.moderators)
  const isConfiguredModerator = senderAuthorization.present && configuredModerators.some(jid => identityMatchesJid(message.identity, jid, resolver))

  return {
    participants,
    normalizedParticipants,
    participantUser,
    bot,
    senderAuthorization,
    isRAdmin: senderAuthorization.isGroupOwner,
    isAdmin: senderAuthorization.isAdmin,
    isBotAdmin: senderAuthorization.verified && hasAdminRole(bot),
    isConfiguredModerator
  }
}

function getParticipantPhoneJid(conn, participant) {
  const candidates = [participant?.phoneNumber, participant?.pn, participant?.participantPn, participant?.jid, participant?.id]
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate) continue
    const normalized = candidate.includes('@') ? candidate : `${candidate.replace(/\D/g, '')}@s.whatsapp.net`
    if (!normalized.endsWith('@s.whatsapp.net')) continue
    return conn.decodeJid ? conn.decodeJid(normalized) : normalized
  }
  return participant?.id ? (conn.decodeJid ? conn.decodeJid(participant.id) : participant.id) : null
}

async function resolveMentionJid(conn, jid, participants) {
  if (!jid || typeof jid !== 'string') return jid
  const normalized = conn.decodeJid ? conn.decodeJid(jid) : jid
  const list = safeArray(participants)

  const match = findParticipantByIdentity(
    participantIdentity({ id: normalized }),
    list,
    getIdentityResolver(conn)
  )

  if (match) return getParticipantPhoneJid(conn, match) || (conn.decodeJid ? conn.decodeJid(match.id) : match.id) || normalized
  return normalized
}

function isSuspiciousText(text) {
  if (typeof text !== 'string') return false
  if (text.length > 12000) return true
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text)) return true
  if (/(.)\1{150,}/s.test(text)) return true
  return false
}

function sanitizeText(text) {
  if (typeof text !== 'string') return ''
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').slice(0, 4096)
}

async function safeReply(conn, m, text) {
  if (!text) return
  const systems = getRuntimeSystems()
  const adaptiveDelay = Number(systems.antiBan.getAdaptiveDelay?.() || 0)
  if (adaptiveDelay > 0) await delay(adaptiveDelay)

  await simulateHumanTyping(conn, m.chat)

  try {
    const result = await conn.sendMessage(m.chat, { text }, { quoted: m })
    systems.antiBan.reportSuccess?.()
    systems.metrics.recordMessageSent?.()
    return result
  } catch (error) {
    systems.antiBan.reportError?.(error, { context: 'safeReply' })
    systems.metrics.recordError?.(error?.message || 'safeReplyError')
    throw error
  } finally {
    await stopTyping(conn, m.chat)
  }
}

export async function handler(chatUpdate) {
  const systems = getRuntimeSystems()
    if (!global.db.data.stats) global.db.data.stats = {}
    const stats = global.db.data.stats
    if (!stats.commands || typeof stats.commands !== 'object' || Array.isArray(stats.commands)) stats.commands = {}
  const activePlugins = Object.entries(global.plugins).filter(([, plugin]) => plugin && !plugin.disabled)

  this.msgqueque = this.msgqueque || []
  if (!chatUpdate?.messages?.length) return
  if (chatUpdate.type && chatUpdate.type !== 'notify') return

  try {
    this.pushMessage(chatUpdate.messages).catch(console.error)

    for (let rawMessage of safeArray(chatUpdate.messages)) {
      if (!rawMessage?.key?.id) continue

      const msgId = rawMessage.key.id
      if (global.processedMessages.has(msgId)) continue
      global.processedMessages.add(msgId)
      setTimeout(() => global.processedMessages.delete(msgId), DUPLICATEWINDOW)

      if (global.db.data == null) await global.loadDatabase()

      let m = smsg(this, rawMessage, rawMessage)
      if (!m) continue

      if (typeof m.text !== 'string') m.text = ''
      m.text = sanitizeText(m.text)

      if (m.isAuthenticatedSelf === true || opts['self']) continue
      if (isSuspiciousText(m.text)) continue

      if (m.isGroup) {
        const sourceMentions = safeArray(m.msg?.contextInfo?.mentionedJid || m.mentionedJid)
        if (sourceMentions.length) {
          try {
            const metaData = await getGroupMetadataCached(this, m.chat)
            const parts = safeArray(metaData?.participants)
            const resolved = await Promise.all(sourceMentions.map(jid => resolveMentionJid(this, jid, parts)))
            m.mentionedJid = safeArray(resolved.filter(Boolean))
            if (typeof m.text === 'string') {
              const resolvedUsers = safeArray(resolved)
                .map(jid => {
                  const decoded = this.decodeJid ? this.decodeJid(jid) : jid
                  return getJidUser(decoded)
                })
                .filter(Boolean)
              let mentionIndex = 0
              m.text = m.text.replace(/@(\d{5,20})/g, full => {
                const nextUser = resolvedUsers[mentionIndex++]
                return nextUser ? `@${nextUser}` : full
              })
            }
          } catch {}
        }
      }

      for (const [name, plugin] of activePlugins) {
        const filename = join(dirname, name)
        if (typeof plugin?.all === 'function') {
          try {
            await plugin.all.call(this, m, chatUpdate, { dirname, filename })
          } catch (e) {
            console.error('Errore in plugin.all', name, e)
            systems.metrics.recordError?.(`pluginAll:${name}`)
          }
        }
      }

      if (m.commandBlocked) continue

      const queue = selectQueue(m)

      await queue.add(async () => {
        const timerId = systems.metrics.startTimer?.('processMessage')
        try {
          const adaptiveDelay = Number(systems.antiBan.getAdaptiveDelay?.() || 0)
          if (adaptiveDelay > 0) await delay(adaptiveDelay)

          await processMessage.call(this, m, chatUpdate, stats, activePlugins, systems)
          systems.antiBan.reportSuccess?.()
        } catch (error) {
          systems.antiBan.reportError?.(error, { context: 'messageProcess', messageId: msgId, chat: m.chat })
          systems.metrics.recordError?.(error?.message || 'processError')
          if (error?.message !== 'timeout') console.error('Errore processamento messaggio', msgId, error.message)
        } finally {
          systems.metrics.endTimer?.(timerId)
        }
      }).catch(async err => {
        systems.antiBan.reportError?.(err, { context: 'queueAdd' })
        systems.metrics.recordError?.(err?.message || 'queueError')
        if (err.message !== 'timeout') console.error('Errore coda', err)
      }, { timeout: 120000 })
    }
  } catch (error) {
    systems.antiBan.reportError?.(error, { context: 'handlerRoot' })
    systems.metrics.recordError?.(error?.message || 'handlerRootError')
    console.error(error)
  }
}

async function processMessage(m, chatUpdate, stats, activePlugins, systems) {
  try {
    m.exp = 0

    try {
      let user = global.db.data.users[m.sender]
      if (typeof user !== 'object') global.db.data.users[m.sender] = user = {}
      if (user) {
        if (!isNumber(user.messaggi)) user.messaggi = 0
        if (!isNumber(user.blasphemy)) user.blasphemy = 0
        if (!isNumber(user.exp)) user.exp = 0
        if (!isNumber(user.warn)) user.warn = 0
        if (!isNumber(user.comandi)) user.comandi = 0
        if (!isNumber(user.joincount)) user.joincount = 2
        if (!('premium' in user)) user.premium = false
        if (!isNumber(user.premiumDate)) user.premiumDate = -1
        if (!('name' in user)) user.name = m.name
        if (!('muto' in user)) user.muto = false
        if (!isNumber(user.level)) user.level = 0
        if (!isNumber(user.premiumTime)) user.premiumTime = 0
      } else global.db.data.users[m.sender] = {
        messaggi: 0,
        blasphemy: 0,
        exp: 0,
        warn: 0,
        comandi: 0,
        joincount: 2,
        premium: false,
        premiumDate: -1,
        premiumTime: 0,
        level: 0,
        name: m.name,
        muto: false
      }

      let chat = global.db.data.chats[m.chat]
      if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
      chat = global.db.data.chats[m.chat]

      if (!('isBanned' in chat)) chat.isBanned = false
      if (!('detect' in chat)) chat.detect = true
      if (!('delete' in chat)) chat.delete = false
      if (!('antiLink' in chat)) chat.antiLink = true
      if (!('antiTraba' in chat)) chat.antiTraba = true
      if (!('antispia' in chat)) chat.antispia = true
      if (!('antioneview' in chat)) chat.antioneview = true
      if (!('modlog' in chat)) chat.modlog = true
      if (!('modlogSpam' in chat)) chat.modlogSpam = true
      if (!('modlogAntilink' in chat)) chat.modlogAntilink = true
      if (!('modlogAntitraba' in chat)) chat.modlogAntitraba = true
      if (!('modlogKick' in chat)) chat.modlogKick = true
      if (!('modlogBan' in chat)) chat.modlogBan = true
      if (!('modlogManual' in chat)) chat.modlogManual = true
      if (!('modlogUnknown' in chat)) chat.modlogUnknown = true
      if (!isNumber(chat.expired)) chat.expired = 0
      if (!isNumber(chat.messaggi)) chat.messaggi = 0
       if (!('name' in chat) || !chat.name || typeof chat.name === 'object') {
         chat.name = await Promise.resolve(this.getName(m.chat)).catch(() => m.chat)
       }
      if (!('antispamcomandi' in chat)) chat.antispamcomandi = true
      if (!('welcome' in chat)) chat.welcome = true
      if (!('bye' in chat)) chat.bye = 'welcome' in chat ? !!chat.welcome : true
       if (m.isGroup) ensureGroupState(chat)

      let settings = global.db.data.settings[this.user.jid]
      if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = settings = {}
      if (settings) {
        if (!('self' in settings)) settings.self = false
        if (!('autoread' in settings)) settings.autoread = false
        if (!('restrict' in settings)) settings.restrict = true
        if (!('antiCall' in settings)) settings.antiCall = false
        if (!('sologruppo' in settings)) settings.sologruppo = false
      } else global.db.data.settings[this.user.jid] = {
        self: false,
        autoread: false,
        restrict: true,
        antiCall: false,
        sologruppo: false
      }
    } catch (e) {
      console.error(e)
      systems.metrics.recordError?.(e?.message || 'dbInitError')
    }

    if (opts['nyimak']) return
    if (m.isAuthenticatedSelf === true || opts['self']) return
    if (opts['pconly'] && m.chat.endsWith('g.us')) return
    if (opts['gconly'] && !m.chat.endsWith('g.us')) return
    if (global.db.data.settings?.[this.user.jid]?.sologruppo && !m.isGroup) return

        if (typeof m.text !== 'string') m.text = ''
    m.text = sanitizeText(m.text)

    const authorization = getAuthorization(m.identity, this, m.isAuthenticatedSelf)
    const { resolver, isROwner, isOwner: isOwner2, isMods } = authorization
    const isPrems = isROwner || isOwner2 || isMods || (global.db.data.users[m.sender]?.premiumTime > 0)

    if (opts['queque'] && m.text && !isMods && !isPrems) {
      let queque = this.msgqueque
      let time = 5000
      const previousID = queque[queque.length - 1]
      queque.push(m.id || m.key.id)
      const interval = setInterval(async function () {
        if (queque.indexOf(previousID) === -1) {
          clearInterval(interval)
          await delay(time)
        }
      }, time)
    }

    if (m.isGroup) {
      const groupState = ensureGroupState(global.db.data.chats[m.chat])
      const activityKey = identityKey(m.senderPn || m.identity?.pn || m.sender)
      if (activityKey) groupState.memberActivity[activityKey] = Date.now()
      markDatabaseDirty()
    }

    m.exp += Math.ceil(Math.random() * 10)
    let usedPrefix

    let user = global.db.data?.users?.[m.sender]
    let groupMetadata
    const isGroupChat = m.isGroup || String(m.chat || '').endsWith('@g.us')
    if (isGroupChat) groupMetadata = await getGroupMetadataCached(this, m.chat)

    const groupState = m.isGroup ? ensureGroupState(global.db.data.chats[m.chat]) : null
    let participants = isGroupChat ? safeArray(groupMetadata?.participants) : []
    let normalizedParticipants = isGroupChat ? normalizeGroupParticipants(this, participants) : []
    let participantUser = isGroupChat ? findParticipantByJid(this, m.sender, normalizedParticipants, m.identity) : {}
    let bot = isGroupChat ? findParticipantByJid(this, this.user.jid, normalizedParticipants) : {}
    const initialMetadataTimestamp = global.groupMetaCache.get(m.chat)?.timestamp
    let senderAuthorization = isGroupChat
      ? getGroupAuthorization(m.identity, normalizedParticipants, resolver, {
        metadataAvailable: hasUsableGroupMetadata(groupMetadata, this, m.chat),
        metadataAge: Number.isFinite(initialMetadataTimestamp) ? Date.now() - initialMetadataTimestamp : Infinity
      })
      : null
    let isRAdmin = senderAuthorization?.isGroupOwner || false
    let isAdmin = senderAuthorization?.isAdmin || false
    let isBotAdmin = isGroupChat && senderAuthorization?.verified && hasAdminRole(bot)
    let isConfiguredModerator = isGroupChat && senderAuthorization?.present && safeArray(groupState?.moderators).some(jid => identityMatchesJid(m.identity, jid, resolver))
    let isModerator = isGroupChat
      ? isAdmin || isOwner2 || isMods || isConfiguredModerator
      : false

    if (isGroupChat && (
      !participantUser || !Object.keys(participantUser).length ||
      !bot || !Object.keys(bot).length ||
      !senderAuthorization?.verified || !senderAuthorization?.present
    )) {
      const freshMetadata = await getGroupMetadataCached(this, m.chat, true)
      const freshParticipants = safeArray(freshMetadata?.participants)
      if (hasUsableGroupMetadata(freshMetadata, this, m.chat)) {
        groupMetadata = freshMetadata
        participants = freshParticipants
        normalizedParticipants = normalizeGroupParticipants(this, freshParticipants)
        participantUser = findParticipantByJid(this, m.sender, normalizedParticipants, m.identity)
        bot = findParticipantByJid(this, this.user.jid, normalizedParticipants)
        senderAuthorization = getGroupAuthorization(m.identity, normalizedParticipants, resolver, {
          metadataAvailable: true,
          metadataAge: 0
        })
        isRAdmin = senderAuthorization.isGroupOwner
        isAdmin = senderAuthorization.isAdmin
        isBotAdmin = senderAuthorization.verified && hasAdminRole(bot)
        isConfiguredModerator = senderAuthorization.present && safeArray(groupState?.moderators).some(jid => identityMatchesJid(m.identity, jid, resolver))
        isModerator = isAdmin || isOwner2 || isMods || isConfiguredModerator
      }
    }

    const privilegedSender = isROwner || isOwner2 || isMods || isAdmin || isConfiguredModerator
    const senderKey = identityKey(m.senderPn || m.identity?.pn || m.sender)

    const legacyMuted = global.db.data.users[m.sender]?.muto === true ||
      (typeof global.db.data.users[m.sender]?.muto === 'object' && global.db.data.users[m.sender].muto?.[m.chat])
    const mutedSender = !!(groupState?.mutedUsers?.[senderKey] || legacyMuted)

    if (m.isGroup && mutedSender && !privilegedSender) return

    if (m.isGroup && !privilegedSender) {
      const normalizedText = String(m.text || '').toLocaleLowerCase('it-IT')
      const bannedWord = safeArray(groupState?.bannedWords).find(word => {
        const normalizedWord = String(word || '').trim().toLocaleLowerCase('it-IT')
        return normalizedWord && normalizedText.includes(normalizedWord)
      })

      if (bannedWord) {
        if (isBotAdmin) {
          await this.sendMessage(m.chat, {
            delete: {
              remoteJid: m.chat,
              fromMe: !!m.key.fromMe,
              id: m.key.id,
              participant: m.key.participant || m.sender
            }
          }).catch(() => {})
        }
        return
      }
    }

    if (m.commandBlocked) return

    for (const [name, plugin] of activePlugins) {
      const filename = join(dirname, name)
      if (!opts['restrict'] && plugin?.tags?.includes('admin')) continue
      if (typeof plugin?.before === 'function') {
        try {
          const shouldContinue = await plugin.before.call(this, m, {
            conn: this,
            participants: normalizedParticipants,
            groupMetadata,
            user: participantUser,
            bot,
            isROwner,
            isOwner: isOwner2,
            isRAdmin,
            isGroupOwner: senderAuthorization?.isGroupOwner || false,
            isAdmin,
            isBotAdmin,
            isModerator,
            isPrems,
            chatUpdate,
            dirname,
            filename,
            setKickReason
          })
          if (shouldContinue) {
            if (m.commandBlocked) break
            continue
          }
        } catch (e) {
          console.error('Errore in plugin.before', name, e)
          systems.metrics.recordError?.(`pluginBefore:${name}`)
        }
      }
    }

    if (m.commandBlocked) return
    if (m.isBaileys) return

    for (const [name, plugin] of activePlugins) {
      const filename = join(dirname, name)
      if (!opts['restrict'] && plugin?.tags?.includes('admin')) continue

      const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
      let prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : global.prefix
      let match = prefix instanceof RegExp
        ? prefix.exec(m.text)
        : Array.isArray(prefix)
          ? prefix.map(p => {
              let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
              return [re.exec(m.text), re]
            }).find(p => p[0])
          : typeof prefix === 'string'
            ? [new RegExp(str2Regex(prefix)).exec(m.text), new RegExp(str2Regex(prefix))]
            : [new RegExp().exec(m.text), new RegExp()]

      if (Array.isArray(match)) {
        if (!match[0]) continue
        match = match[0]
      }

      if (typeof plugin !== 'function') continue
      if (!match) continue

      usedPrefix = match[0]
      let noPrefix = m.text.replace(usedPrefix, '')
      let [command, ...args] = noPrefix.trim().split(/\s+/).filter(v => v)
      args = noPrefix.trim().split(/\s+/).slice(1)
      let text = sanitizeText(args.join(' '))
      command = (command || '').toLowerCase()

      let fail = plugin.fail || global.dfail

      let isAccept = plugin.command instanceof RegExp
        ? plugin.command.test(command)
        : Array.isArray(plugin.command)
          ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command)
          : typeof plugin.command === 'string'
            ? plugin.command === command
            : false

      if (!isAccept) continue

      const requiresGroupAuthorization = isGroupChat && requiresVerifiedGroupAuthorization(plugin)
      if (requiresGroupAuthorization) {
        const freshMetadata = await getGroupMetadataCached(this, m.chat, true)
        const roleState = getGroupRoleState(this, m, freshMetadata, resolver, groupState)
        groupMetadata = freshMetadata
        participants = roleState.participants
        normalizedParticipants = roleState.normalizedParticipants
        participantUser = roleState.participantUser
        bot = roleState.bot
        senderAuthorization = roleState.senderAuthorization
        isRAdmin = roleState.isRAdmin
        isAdmin = roleState.isAdmin
        isBotAdmin = roleState.isBotAdmin
        isConfiguredModerator = roleState.isConfiguredModerator
        isModerator = isAdmin || isOwner2 || isMods || isConfiguredModerator
      }

      if (requiresGroupAuthorization && !allowsUnverifiedGroupUser(plugin) && (!senderAuthorization?.verified || !senderAuthorization.present)) {
        await (plugin.fail || global.dfail)(explicitRoleNotice(plugin) || 'moderator', m, this)
        continue
      }

      m.plugin = name

      if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
        let chat = global.db.data.chats[m.chat]
        let userDb = global.db.data.users[m.sender]
        const isChatUnban = command === 'unbanchat' || name === 'owner/unbanchat.js' || plugin?.name === 'owner-unbanchat'
        if (chat?.isBanned && !isChatUnban) return
        if (!['owner-unbanuser.js', 'owner/unbanuser.js'].includes(name) && userDb?.banned) return
      }

      let chatDb = global.db.data.chats[m.chat]
      const adminMode = [true, 1, '1', 'true', 'on'].includes(chatDb?.soloadmin)
      let mystica = plugin.botAdmin || plugin.admin || plugin.group || plugin.command

      const hasSoloAdminAccess = isOwner2 || isROwner || isMods || isConfiguredModerator || isAdmin
      if (adminMode && isGroupChat && !hasSoloAdminAccess && mystica) {
        const roleNotice = explicitRoleNotice(plugin)
        if (roleNotice) await fail(roleNotice, m, this)
        continue
      }

      if (plugin.rowner && plugin.owner && !isROwner && !isOwner2) {
        await fail('owner', m, this)
        continue
      }
      if (plugin.rowner && !isROwner) {
        await fail('rowner', m, this)
        continue
      }
      if (plugin.owner && !isOwner2) {
        await fail('owner', m, this)
        continue
      }
      if (plugin.mods && !isMods) {
        await fail('mods', m, this)
        continue
      }
      if (plugin.premium && !isPrems) {
        await fail('premium', m, this)
        continue
      }
      if (plugin.group && !m.isGroup) {
        await fail('group', m, this)
        continue
      }
      if (plugin.botAdmin && !isBotAdmin) {
        await fail('botAdmin', m, this)
        continue
      }
      if (plugin.private && m.isGroup) {
        await fail('private', m, this)
        continue
      }
      if (plugin.register === true && user?.registered === false) {
        await fail('unreg', m, this)
        continue
      }

      const hasCustomModeratorRole = m.isGroup
        ? isOwner2 || isROwner || isMods || isConfiguredModerator
        : false

      const canUseModeratorCommand = m.isGroup
        ? isAdmin || hasCustomModeratorRole || isConfiguredModerator || isMods || isOwner2 || isROwner
        : true

      if (plugin.admin || plugin.moderator) {
        if (!canUseModeratorCommand) {
          await fail('moderator', m, this)
          continue
        }
      }

      const declaredRoles = Array.isArray(plugin.roles)
        ? plugin.roles
        : Array.isArray(plugin.permissions?.roles)
          ? plugin.permissions.roles
          : []

      if (declaredRoles.length && !pluginRolesAllowed(declaredRoles, {
        isROwner,
        isOwner: isOwner2,
        isMods,
        isAdmin,
        isModerator
      })) {
        const denialType = declaredRoles.length === 1 && declaredRoles.includes('owner')
          ? 'owner'
          : 'moderator'
        await fail(denialType, m, this)
        continue
      }

      m.isCommand = true
      user.comandi = (isNumber(user.comandi) ? user.comandi : 0) + 1
      stats.commands[command] = (isNumber(stats.commands[command]) ? stats.commands[command] : 0) + 1
      let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17
      if (xp > 2000) {
        await safeReply(this, m, 'Exp limit')
        continue
      }
      m.exp += xp
      if ((plugin.level || 0) > (user?.level || 0)) {
        await safeReply(this, m, 'livello troppo basso')
        continue
      }

      let extra = {
        match,
        usedPrefix,
        noPrefix,
        args,
        command,
        text,
        conn: this,
        normalizedParticipants,
        participants,
        groupMetadata,
        user: participantUser,
        bot,
        isROwner,
        isOwner: isOwner2,
         isRAdmin,
          isGroupOwner: senderAuthorization?.isGroupOwner || false,
         isAdmin,
         isBotAdmin,
         isModerator,
         isGroupModerator: isConfiguredModerator,
         isConfiguredModerator,
         isPrems,
         chatUpdate,
         groupState,
        dirname,
        filename,
        mentionedJid: safeArray(m.mentionedJid),
        setKickReason
      }

      try {
        await simulateHumanTyping(this, m.chat)

        const pluginTimer = systems.metrics.startTimer?.(`plugin:${name}`)
        await plugin.call(this, m, extra)
        systems.metrics.endTimer?.(pluginTimer)

        systems.antiBan.reportSuccess?.()
      } catch (e) {
        m.error = e
        systems.antiBan.reportError?.(e, { context: 'pluginCall', plugin: name, command })
        systems.metrics.recordError?.(e?.message || `pluginCall:${name}`)
        console.error(e)
        if (e) {
          let textErr = plugin?.target === 'group'
            ? '⚠️ Operazione gruppo non riuscita. Verifica i permessi del bot e riprova.'
            : format(e)
          if (plugin?.target !== 'group') {
            for (let key of Object.values(global.APIKeys || {})) {
              textErr = textErr.replace(new RegExp(key, 'g'), 'HIDDEN')
            }
          }
          textErr = sanitizeText(textErr.slice(0, 3000))
          await safeReply(this, m, textErr).catch(() => {})
        }
      } finally {
        await stopTyping(this, m.chat)

        if (typeof plugin.after === 'function') {
          try {
            await plugin.after.call(this, m, extra)
          } catch (e) {
            console.error('Errore in plugin.after', name, e)
            systems.metrics.recordError?.(`pluginAfter:${name}`)
          }
        }
      }
      break
    }
  } catch (e) {
    console.error(e)
    systems.antiBan.reportError?.(e, { context: 'processMessageRoot' })
    systems.metrics.recordError?.(e?.message || 'processMessageRoot')
  } finally {
    if (opts['queque'] && m.text) {
      const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
      if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
    }

    if (m?.sender) {
      let user = global.db.data.users[m.sender]
      let chat = global.db.data.chats[m.chat]

       const senderKey = identityKey(m.senderPn || m.identity?.pn || m.sender)
       const isMutedHere = (user &&
        (user.muto === true || (typeof user.muto === 'object' && user.muto?.[m.chat]))) ||
        !!chat?.mutedUsers?.[senderKey]

      if (isMutedHere) {
        await this.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            fromMe: false,
            id: m.key.id,
             participant: m.key.participant || m.sender
          }
        }).catch(console.error)
      }

      if (user) {
        recordUnityActivity(m.sender)
        user.exp += m.exp || 0
        user.messaggi += 1
      }
      if (chat) chat.messaggi += 1
    }

    if (m?.plugin) {
      let now = new Date()
      if (!stats[m.plugin]) stats[m.plugin] = { total: 0, success: 0, last: 0, lastSuccess: 0 }
      const stat = stats[m.plugin]
      stat.total += 1
      stat.last = now
      if (!m.error) {
        stat.success += 1
        stat.lastSuccess = now
      }
    }

    const sysStats = systems.antiBan.getStats?.() || {}
    global.db.data.system = global.db.data.system || {}
    global.db.data.system.metrics = systems.metrics.getReport?.()
    global.db.data.system.antiBan = sysStats

    if (typeof global.markDbDirty === 'function') global.markDbDirty()

    try {
      if (!opts['noprint']) {
        const print = (await import('./lib/print.js')).default
        if (typeof print === 'function') print(m, this)
      }
    } catch (e) {
      console.log(m, m.quoted, e)
    }

    if (opts['autoread']) await this.readMessages([m.key]).catch(() => {})
  }
}

function getEventActor(update, fallback = null) {
  const candidates = [
    update?.author,
    update?.authorPn,
    update?.participant,
    update?.actor,
    update?.sender,
    fallback
  ]

  for (const candidate of candidates) {
    const value = typeof candidate === 'string'
      ? candidate
      : candidate?.phoneNumber || candidate?.pn || candidate?.participantPn || candidate?.jid || candidate?.id || candidate?.lid
    if (typeof value === 'string' && value.length) return value
  }
  return null
}

function normalizeMentionJid(conn, jid) {
  if (!jid || typeof jid !== 'string') return null

  const candidates = [jid.trim()]
  const decoded = conn.decodeJid ? conn.decodeJid(jid) : jid
  if (decoded && decoded !== jid) candidates.push(decoded)

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue

    const value = candidate.trim()
    if (value.endsWith('@s.whatsapp.net')) return value

    if (value.endsWith('@lid')) {
      const mapped = getIdentityResolver(conn)?.resolve(value)
      if (typeof mapped === 'string' && mapped.endsWith('@s.whatsapp.net')) {
        const normalizedMapped = normalizeMentionJid(conn, mapped)
        if (normalizedMapped) return normalizedMapped
      }
      continue
    }

    const number = value.split('@')[0].split(':')[0].replace(/\D/g, '')
    if (/^\d+$/.test(number)) return `${number}@s.whatsapp.net`
  }

  return null
}

async function resolvePhoneMentionJid(conn, jid, participants = []) {
  if (!jid) return null

  const original = String(jid)
  const decoded = conn.decodeJid ? conn.decodeJid(original) : original
  const participant = findParticipantByIdentity(
    participantIdentity({ id: decoded }),
    participants,
    getIdentityResolver(conn)
  )

  const candidates = [
    participant?.phoneNumber,
    participant?.pn,
    participant?.participantPn,
    participant?.id,
    participant?.jid,
    participant?.lid,
    original
  ]

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue

    let value = candidate

    try {
      if (value.endsWith('@lid') && typeof conn.getPNForLID === 'function') {
        value = await conn.getPNForLID(value)
      } else if (value.endsWith('@lid') && typeof conn.getPNById === 'function') {
        value = await conn.getPNById(value)
      }
    } catch {}

    const normalized = normalizeMentionJid(conn, value)
    if (normalized?.endsWith('@s.whatsapp.net')) return normalized
  }

  return normalizeMentionJid(conn, original)
}
export async function participantsUpdate(update) {
  const systems = getRuntimeSystems()
  if (opts['self']) return
  if (this.isInit) return
  if (global.db.data == null) await global.loadDatabase()

  const id = update?.id
  const participantEntries = safeArray(update?.participants).map(participant => (
    typeof participant === 'string' ? { id: participant } : (participant || {})
  ))
  const rawParticipants = participantEntries
    .map(participant => participant.id || participant.jid || participant.phoneNumber || participant.pn || participant.lid)
    .filter(value => typeof value === 'string' && value)
  const action = update?.action
  const eventAuthor = getEventActor(update)

  if (!id || !rawParticipants.length || !action) return

  invalidateGroupMetaCache(id, this)

  let chat = global.db.data.chats[id]
  if (typeof chat !== 'object') global.db.data.chats[id] = {}
  chat = global.db.data.chats[id]

  if (!('welcome' in chat)) chat.welcome = true
  if (!('bye' in chat)) chat.bye = true
  if (!('modlog' in chat)) chat.modlog = true
  if (!('modlogSpam' in chat)) chat.modlogSpam = true
  if (!('modlogAntilink' in chat)) chat.modlogAntilink = true
  if (!('modlogAntitraba' in chat)) chat.modlogAntitraba = true
  if (!('modlogKick' in chat)) chat.modlogKick = true
  if (!('modlogBan' in chat)) chat.modlogBan = true
  if (!('modlogManual' in chat)) chat.modlogManual = true
  if (!('modlogUnknown' in chat)) chat.modlogUnknown = true

  const groupMetadata = await this.groupMetadata(id).catch(() => this.chats[id]?.metadata || {})
  const groupName = groupMetadata?.subject || await this.getName(id)
  const groupParticipants = safeArray(groupMetadata?.participants)

  switch (action) {
case 'add': {
  if (!chat.welcome) break

  const mentionJids = []
  for (const participant of [...new Set(rawParticipants)]) {
    const mentionJid = await resolvePhoneMentionJid(this, participant, groupParticipants)
    const normalized = normalizeMentionJid(this, mentionJid)
    if (normalized && !mentionJids.includes(normalized)) mentionJids.push(normalized)
  }

  if (!mentionJids.length) break

  const tags = mentionJids.map(user => `@${getJidUser(user) || 'sconosciuto'}`).join(' ')
  const welcomeText = (chat.sWelcome || 'Benvenut^ @user in @group')
    .replace(/@subject/g, groupName)
    .replace(/@group/g, groupName)
    .replace(/@desc/g, groupMetadata?.desc?.toString() || 'Nessuna descrizione disponibile')
    .replace(/@user/g, tags)

   const text = pluginUi.box('👋 Benvenuto', [
     pluginUi.row('👤', 'Utente:', tags),
     pluginUi.row('👥', 'Gruppo:', groupName),
     pluginUi.rawRow('💬', sanitizeText(welcomeText))
   ])

if (chat.sWelcomeMedia && chat.sWelcomeMediaType) {
  const fs = await import('fs')
  const mediaPath = chat.sWelcomeMedia
  const mediaType = chat.sWelcomeMediaType
  const isGif = chat.sWelcomeIsGif || false

  if (fs.existsSync(mediaPath)) {
    const buffer = fs.readFileSync(mediaPath)

    if (mediaType === 'image') {
      await this.sendMessage(id, {
        image: buffer,
        caption: text,
        mentions: mentionJids,
        mimetype: 'image/jpeg'
      })
    } else if (mediaType === 'video') {
      await this.sendMessage(id, {
        video: buffer,
        caption: text,
        mentions: mentionJids,
        mimetype: 'video/mp4',  // ← DEVE ESSERE video/mp4
        gifPlayback: isGif       // ← QUESTO FA LA DIFFERENZA
      })
    } else if (mediaType === 'sticker') {
      await this.sendMessage(id, {
        sticker: buffer,
        mimetype: 'image/webp'
      })
      await this.sendMessage(id, {
        text,
        mentions: mentionJids
      })
    }
  } else {
    await this.sendMessage(id, {
      text,
      mentions: mentionJids
    })
  }
} else {
  await this.sendMessage(id, {
    text,
    mentions: mentionJids
  })
}

  systems.antiBan.reportSuccess?.()
  systems.metrics.recordMessageSent?.()
  break
}

    case 'remove': {
      for (const participant of rawParticipants) {
        const user = await resolvePhoneMentionJid(this, participant, groupParticipants) || participant
        const kickInfo = getKickReason(id, participant) || getKickReason(id, user)

        if (kickInfo) {
          deleteKickReason(id, participant)
          deleteKickReason(id, user)
          continue
        }

        if (!chat.bye) continue

         const byeText = pluginUi.box('👋 Uscita dal gruppo', [
           pluginUi.row('👤', 'Utente:', `@${getJidUser(user) || 'sconosciuto'}`),
           pluginUi.row('👥', 'Gruppo:', groupName),
           pluginUi.rawRow('💬', sanitizeText((chat.sBye || 'Arrivederci @user')
           .replace(/@group/g, groupName)
           .replace(/@user/g, `@${getJidUser(user) || 'sconosciuto'}`)))
         ])

        if (chat.sByeMedia && chat.sByeMediaType) {
  const fs = await import('fs')
  const mediaPath = chat.sByeMedia
  const mediaType = chat.sByeMediaType
  const isGif = chat.sByeIsGif || mediaPath.toLowerCase().endsWith('.gif')

  if (fs.existsSync(mediaPath)) {
    const buffer = fs.readFileSync(mediaPath)

    if (mediaType === 'image') {
      await this.sendMessage(id, {
        image: buffer,
        caption: byeText,
        mentions: [user],
        mimetype: 'image/jpeg'
      })
    } else if (mediaType === 'video') {
      await this.sendMessage(id, {
        video: buffer,
        caption: byeText,
        mentions: [user],
        mimetype: isGif ? 'image/gif' : 'video/mp4',
        gifPlayback: isGif
      })
    } else if (mediaType === 'sticker') {
      await this.sendMessage(id, {
        sticker: buffer,
        mimetype: 'image/webp'
      })
      await this.sendMessage(id, {
        text: byeText,
        mentions: [user]
      })
    }
  } else {
    await this.sendMessage(id, {
      text: byeText,
      mentions: [user]
    })
  }
} else {
  await this.sendMessage(id, {
    text: byeText,
    mentions: [user]
  })
}
      }
      break
    }

    case 'promote':
    case 'demote': {
      const isPromote = action === 'promote'
      const eventActor = eventAuthor || null

      for (const participant of rawParticipants) {
        const user = await resolvePhoneMentionJid(this, participant, groupParticipants) || participant
        const normalizedUser = normalizeMentionJid(this, user) || user
        const normalizedParticipant = normalizeMentionJid(this, participant) || participant
        const commandAuthor = global.groupActionAuthors?.get(`${action}:${id}:${normalizedParticipant}`) || global.groupActionAuthors?.get(`${action}:${id}:${participant}`)
        const actor = commandAuthor || eventActor || null

        const normalizedActor = normalizeMentionJid(this, actor) || actor
        const actorTag = normalizedActor ? `@${getJidUser(normalizedActor) || 'admin'}` : '@admin'
        const userTag = `@${getJidUser(normalizedUser) || 'sconosciuto'}`

        let eventText = isPromote
          ? (chat.sPromote || 'Un membro è stato promosso ad amministratore.')
          : (chat.sDemote || 'Un membro non è più amministratore.')

        eventText = eventText
          .replace(/@group/g, groupName)
          .replace(/@user/g, userTag)
          .replace(/@author/g, actorTag)

        const text = pluginUi.box(
          isPromote ? '⬆️ Promozione amministratore' : '⬇️ Retrocessione amministratore',
          [
            pluginUi.row('👤', isPromote ? 'Promosso:' : 'Retrocesso:', userTag),
            pluginUi.row('🛡️', 'Eseguito da:', actorTag),
            pluginUi.rawRow('💬', sanitizeText(eventText))
          ]
        )

        await this.sendMessage(
          id,
          {
            text,
            mentions: [normalizedUser, normalizedActor].filter(Boolean)
          },
          { quoted: await getPromotionQuote(this, id, normalizedActor, normalizedUser, action) }
        ).catch(error => {
          systems.antiBan.reportError?.(error, { context: `participantsUpdate:${action}` })
          systems.metrics.recordError?.(error?.message || `participantsUpdate:${action}`)
        })
      }
      break
    }
  }
}

export async function groupsUpdate(groupsUpdate) {
  const systems = getRuntimeSystems()
  if (opts['self']) return

  for (const groupUpdate of safeArray(groupsUpdate)) {
    const id = groupUpdate?.id
    if (!id) continue

    invalidateGroupMetaCache(id, this)

    const chats = global.db.data.chats[id] || {}
    let text = ''
    if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || 'immagine modificata').replace('@icon', groupUpdate.icon)
    if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || 'link reimpostato, nuovo link: @revoke').replace('@revoke', groupUpdate.revoke)
    if (!text) continue

    const groupName = chats.name || await this.getName(id).catch(() => id)
    text = pluginUi.box('⚙️ Aggiornamento gruppo', [
      pluginUi.row('👥', 'Gruppo:', groupName),
      pluginUi.rawRow('🔔', sanitizeText(text))
    ])
    const adaptiveDelay = Number(systems.antiBan.getAdaptiveDelay?.() || 0)
    if (adaptiveDelay > 0) await delay(adaptiveDelay)

    await this.sendMessage(id, { text, mentions: safeArray(this.parseMention?.(text)) })
      .then(() => {
        systems.antiBan.reportSuccess?.()
        systems.metrics.recordMessageSent?.()
      })
      .catch(error => {
        systems.antiBan.reportError?.(error, { context: 'groupsUpdate' })
        systems.metrics.recordError?.(error?.message || 'groupsUpdate')
      })
  }
}

export async function callUpdate(callUpdate) {
  const systems = getRuntimeSystems()
  let isAnticall = global.db.data.settings?.[this.user.jid]?.antiCall
  if (!isAnticall) return

  for (let nk of safeArray(callUpdate)) {
    if (!nk?.isGroup && nk?.status === 'offer') {
      const adaptiveDelay = Number(systems.antiBan.getAdaptiveDelay?.() || 0)
      if (adaptiveDelay > 0) await delay(adaptiveDelay)

      let callmsg = await this.reply(
        nk.from,
        `ciao @${nk.from.split('@')[0]}, c'è l'anticall.`,
        false,
        { mentions: [nk.from] }
      ).catch(console.error)

      let vcard = `BEGIN:VCARD
VERSION:3.0
N:;Unlimited;;;
TEL;waid=39351396399139:+39 351 396 3991
X-ABLabel:WA-BIZ
END:VCARD`

      await this.sendMessage(nk.from, {
        contacts: {
          displayName: 'Unlimited',
          contacts: [{ vcard }]
        }
      }, { quoted: callmsg }).catch(console.error)

      await this.updateBlockStatus(nk.from, 'block').catch(console.error)
      systems.metrics.recordMessageSent?.()
    }
  }
}

global.dfail = async function (type, m, conn) {
  const notices = {
    rowner: ['⚠️ Accesso negato', 'Solo il proprietario reale può usare questo comando.'],
    owner: ['⚠️ Accesso negato', 'Solo il proprietario può usare questo comando.'],
    mods: ['⚠️ Accesso negato', 'Solo i moderatori possono usare questo comando.'],
    premium: ['⚠️ Accesso negato', 'Solo gli utenti premium possono usare questo comando.'],
    group: ['⚠️ Comando non disponibile', 'Questo comando si può usare solo nei gruppi.'],
    private: ['⚠️ Comando non disponibile', 'Questo comando si può usare solo in privato.'],
    admin: ['⚠️ Permessi insufficienti', 'Solo gli admin possono usare questo comando.'],
    moderator: ['⚠️ Permessi insufficienti', 'Solo i moderatori possono usare questo comando.'],
    botAdmin: ['⚠️ Permessi mancanti', 'Il bot deve essere admin per usare questo comando.'],
    restrict: ['⚠️ Funzione limitata', 'Questa funzione non è disponibile ora.']
  }[type]

  if (!notices || !conn?.sendMessage || !m?.chat) return

  const text = pluginUi.box(notices[0], [
    pluginUi.row('❍', 'Stato:', notices[1])
  ])

  try {
    return await conn.sendMessage(m.chat, { text }, { quoted: m })
  } catch (error) {
    console.error('Errore invio messaggio permessi', error)
    return conn.sendMessage(m.chat, { text }, { quoted: m }).catch(fallbackError => {
      console.error('Errore fallback messaggio permessi', fallbackError)
    })
  }
}
