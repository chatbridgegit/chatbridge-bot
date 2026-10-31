import {
  findParticipantByIdentity,
  getIdentityResolver,
  identityMatchesJid,
  participantIdentity
} from './whatsapp-identity.js'
import {
  describeParticipant,
  resolvePhoneJid
} from './plugin-utils.js'
import { ensureGroupState, identityKey, markDatabaseDirty, markGroupAction } from './group-state.js'
import { pluginUi } from './plugin-font.js'

export async function getGroupTarget(conn, m, participants = [], text = '') {
  const mention = Array.isArray(m?.mentionedJid) ? m.mentionedJid[0] : null
  const quoted = m?.quoted
  const quotedJid = quoted?.senderPn || quoted?.sender || quoted?.key?.participant
  const argument = String(text || '').split(/\s+/).find(value => /^@?\+?[0-9]{5,16}(?:@[a-z.]+)?$/i.test(value))
  const raw = mention || quotedJid || argument?.replace(/^@/, '')
  if (!raw) return null

  const resolver = getIdentityResolver(conn)
  const participant = findParticipantByIdentity(
    participantIdentity({ id: raw }),
    Array.isArray(participants) ? participants : [],
    resolver
  )
  const phoneJid = await resolvePhoneJid(conn, participant || { id: raw })
  const jid = phoneJid || (typeof raw === 'string' ? raw : null)
  if (!jid) return null

  const resolvedParticipant = participant || findParticipantByIdentity(
    participantIdentity({ id: jid }),
    Array.isArray(participants) ? participants : [],
    resolver
  )

  const description = await describeParticipant(conn, resolvedParticipant || { id: jid })
  const isBot = !!conn?.user?.id && (identityMatchesJid(
    participantIdentity({ id: conn.user.jid || conn.user.id }),
    jid,
    resolver
  ))

  return {
    raw,
    jid,
    phoneJid,
    key: identityKey(phoneJid || jid),
    participant: resolvedParticipant,
    description,
    inGroup: !!resolvedParticipant,
    isBot,
    isAdmin: resolvedParticipant?.admin === 'admin' || resolvedParticipant?.admin === 'superadmin',
    isSuperAdmin: resolvedParticipant?.admin === 'superadmin'
  }
}

export function targetError(m, title = 'Gestione Gruppo') {
  return m.reply(pluginUi.box(`⚠️ ${title}`, [
    pluginUi.row('👤', 'Stato:', 'menziona un utente o rispondi al suo messaggio')
  ]))
}

export function protectedTargetError(m, target, title = 'Gestione Gruppo') {
  if (!target) return targetError(m, title)
  if (!target.inGroup) {
    return m.reply(pluginUi.box(`⚠️ ${title}`, [
      pluginUi.row('🚫', 'Stato:', "l'utente non appartiene a questo gruppo")
    ]))
  }
  if (target.isBot) {
    return m.reply(pluginUi.box(`⚠️ ${title}`, [
      pluginUi.row('🚫', 'Stato:', 'il bot non può essere il destinatario')
    ]))
  }
  if (target.isSuperAdmin) {
    return m.reply(pluginUi.box(`⚠️ ${title}`, [
      pluginUi.row('🚫', 'Stato:', 'il proprietario del gruppo non può essere modificato')
    ]))
  }
  return null
}

export function adminTargetError(m, title = 'Gestione Gruppo') {
  return m.reply(pluginUi.box(`⚠️ ${title}`, [
    pluginUi.row('🚫', 'Stato:', 'non è possibile modificare un amministratore')
  ]))
}

export async function updateParticipants(conn, chatId, target, action) {
  if (!target?.jid || typeof conn?.groupParticipantsUpdate !== 'function') {
    throw new Error('API gestione partecipanti non disponibile')
  }
  return conn.groupParticipantsUpdate(chatId, [target.phoneJid || target.jid], action)
}

export function groupState(chatId) {
  if (!global.db?.data?.chats) return null
  const chat = global.db.data.chats[chatId] || (global.db.data.chats[chatId] = {})
  return ensureGroupState(chat)
}

export function recordAction(chat, actor, action, target = null, chatId = null) {
  markGroupAction(chat, actor, action)
  if (chatId && target && ['promote', 'demote'].includes(action)) {
    global.groupActionAuthors = global.groupActionAuthors || new Map()
    const keys = [target.phoneJid, target.jid, target.raw]
      .filter(value => typeof value === 'string' && value)
    for (const key of keys) {
      global.groupActionAuthors.set(`${action}:${chatId}:${key}`, actor)
    }
    setTimeout(() => {
      for (const key of keys) global.groupActionAuthors.delete(`${action}:${chatId}:${key}`)
    }, 30000)
  }
  markDatabaseDirty()
}

export function targetMentionText(targets, fallback = '') {
  const tags = targets
    .map(target => target?.phoneJid || target?.jid)
    .filter(jid => typeof jid === 'string' && jid.includes('@s.whatsapp.net'))
    .map(jid => `@${jid.split('@')[0]}`)
  return tags.length ? tags.join(' ') : fallback
}

export async function participantPhoneJids(conn, participants = []) {
  const values = await Promise.all((Array.isArray(participants) ? participants : []).map(async participant => {
    const jid = await resolvePhoneJid(conn, participant)
    return jid ? { participant, jid } : null
  }))
  return values.filter(Boolean)
}

export function stripMentionTokens(text = '') {
  return String(text).replace(/@[0-9]{5,16}/g, '').replace(/\s+/g, ' ').trim()
}

export function getRecentMessageKeys(conn, chatId, limit) {
  const messages = conn?.chats?.[chatId]?.messages
  if (!messages || typeof messages !== 'object') return []
  return Object.values(messages)
    .filter(message => message?.key?.id && message.key.remoteJid === chatId)
    .sort((left, right) => Number(right.messageTimestamp || 0) - Number(left.messageTimestamp || 0))
    .slice(0, limit)
    .map(message => message.key)
}

export async function deleteMessage(conn, chatId, key) {
  if (!key?.id || typeof conn?.sendMessage !== 'function') return false
  const remoteJid = key.remoteJid
    ? (conn.decodeJid ? conn.decodeJid(key.remoteJid) : key.remoteJid)
    : chatId
  const currentChat = conn.decodeJid ? conn.decodeJid(chatId) : chatId
  if (remoteJid !== currentChat) return false
  await conn.sendMessage(chatId, {
    delete: {
      remoteJid: currentChat,
      fromMe: !!key.fromMe,
      id: key.id,
      participant: key.participant
    }
  })
  return true
}

export function sameConfiguredIdentity(conn, left, right) {
  const resolver = getIdentityResolver(conn)
  return identityMatchesJid(participantIdentity({ id: left }), right, resolver)
}
