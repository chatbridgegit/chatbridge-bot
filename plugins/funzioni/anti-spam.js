import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const userSpamCounters = {}
const STICKER_LIMIT = 6
const PHOTO_VIDEO_LIMIT = 13
const RESET_TIMEOUT = 5000

const formatAntiSpamMessage = (title, body) => `╭═━ 〖 🚨 ${title} 〗═━⪩
│❍ ${body.join('\n│❍ ')}
╰━━━━━━━━━⪩`

function chatOf(m) {
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  if (typeof chat.antispam !== 'boolean') chat.antispam = true
  return chat
}

async function before(m, { conn, isAdmin, isBotAdmin, setKickReason } = {}) {
  if (m.isBaileys && m.isAuthenticatedSelf) return true
  if (!m?.isGroup || isAdmin || m.isAuthenticatedSelf || !chatOf(m).antispam) return false
  const chat = m.chat
  const bot = global.db.data.settings[conn.user.jid] || {}
  const sender = m.senderPn || m.sender
  if (!userSpamCounters[chat]) userSpamCounters[chat] = {}
  if (!userSpamCounters[chat][sender]) userSpamCounters[chat][sender] = { stickerCount: 0, photoVideoCount: 0, messageIds: [], lastMessageTime: 0, timer: null }

  const counter = userSpamCounters[chat][sender]
  const currentTime = Date.now()
  const messageContent = m.message?.viewOnceMessage?.message ||
    m.message?.viewOnceMessageV2?.message ||
    m.message?.viewOnceMessageV2Extension?.message ||
    m.message?.ephemeralMessage?.message ||
    m.message || {}
  const isSticker = !!messageContent.stickerMessage
  const isPhotoOrVideo = !!(messageContent.imageMessage || messageContent.videoMessage)
  const resetCounter = () => {
    if (counter.timer) clearTimeout(counter.timer)
    delete userSpamCounters[chat][sender]
  }
  const scheduleReset = () => {
    if (counter.timer) clearTimeout(counter.timer)
    counter.timer = setTimeout(() => { delete userSpamCounters[chat]?.[sender] }, RESET_TIMEOUT)
  }
  const detailsText = () => `Sticker: ${counter.stickerCount}, Foto/video: ${counter.photoVideoCount}, Finestra: ${RESET_TIMEOUT / 1000}s`

  if (!isSticker && !isPhotoOrVideo) {
    if (currentTime - counter.lastMessageTime > RESET_TIMEOUT && (counter.stickerCount > 0 || counter.photoVideoCount > 0)) resetCounter()
    return false
  }
  if (isSticker) counter.stickerCount++
  if (isPhotoOrVideo) counter.photoVideoCount++
  counter.messageIds.push({ id: m.key.id, participant: m.key.participant || m.sender })
  counter.lastMessageTime = currentTime

  const isStickerSpam = counter.stickerCount >= STICKER_LIMIT
  const isPhotoVideoSpam = counter.photoVideoCount >= PHOTO_VIDEO_LIMIT
  if (!isStickerSpam && !isPhotoVideoSpam) {
    scheduleReset()
    return false
  }

  m.commandBlocked = true
  if (!isBotAdmin) {
    await conn.sendMessage(chat, { text: formatAntiSpamMessage('𝒜𝓃𝓉𝒾𝓈𝓅𝒶𝓂', ['Spam rilevato.', 'Devo essere admin per intervenire.']) }).catch(() => {})
    scheduleReset()
    return true
  }
  if (!bot.restrict) {
    await conn.sendMessage(chat, { text: formatAntiSpamMessage('𝒜𝓃𝓉𝒾𝓈𝓅𝒶𝓂', ['Spam rilevato.', 'La modalità restrict non è attiva.']) }).catch(() => {})
    scheduleReset()
    return true
  }

  let groupLocked = false
  try {
    await conn.groupSettingUpdate(chat, 'announcement')
    groupLocked = true
    if (!isAdmin) {
      setKickReason?.(chat, sender, { type: 'spam', reason: isStickerSpam ? 'Flood di sticker' : 'Flood di foto/video', details: detailsText(), source: 'plugins/funzioni/anti-spam.js', messageId: m.key.id, extra: { stickerCount: counter.stickerCount, photoVideoCount: counter.photoVideoCount, totalMessagesFlagged: counter.messageIds.length, resetTimeout: RESET_TIMEOUT } }, conn.user.jid)
      await conn.sendMessage(chat, { text: formatAntiSpamMessage('𝒜𝓃𝓉𝒾𝓈𝓅𝒶𝓂', [`Ciao @${sender.split('@')[0]}`, isStickerSpam ? 'Troppi sticker inviati in pochi secondi.' : 'Troppi media inviati in pochi secondi.', 'Procedo con la rimozione.']), mentions: [sender] }).catch(() => {})
      await conn.groupParticipantsUpdate(chat, [sender], 'remove')
    }
    for (const message of counter.messageIds) {
      const messageId = typeof message === 'string' ? message : message.id
      const participant = typeof message === 'string' ? m.key.participant || m.sender : message.participant
      await conn.sendMessage(chat, { delete: { remoteJid: chat, fromMe: false, id: messageId, participant } }).catch(() => {})
    }
    await conn.sendMessage(chat, { text: formatAntiSpamMessage('𝒜𝓃𝓉𝒾𝓈𝓅𝒶𝓂', [isStickerSpam ? 'Sticker rimossi.' : 'Media rimossi.', 'Chat sistemata.']) }).catch(() => {})
  } catch (error) {
    console.error('𝐸𝓇𝓇𝑜𝓇𝑒 𝑔𝑒𝓈𝓉𝒾𝑜𝓃𝑒 𝒶𝓃𝓉𝒾𝓈𝓅𝒶𝓂:', error)
  } finally {
    if (groupLocked) await conn.groupSettingUpdate(chat, 'not_announcement').catch(() => {})
    resetCounter()
  }
  return true
}

async function toggle(m, extra) {
  const chat = chatOf(m)
  const value = String(extra.text || '').trim().toLowerCase()
  if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('🛑 Antispam', [pluginUi.row(chat.antispam ? '✅' : '❌', 'Stato:', chat.antispam ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antispam on|off')]))
  chat.antispam = value === 'on'
  global.markDbDirty?.()
  return m.reply(pluginUi.box('🛑 Antispam', [pluginUi.row(chat.antispam ? '✅' : '❌', 'Stato:', chat.antispam ? 'attivato' : 'disattivato')]))
}

export default definePlugin(toggle, {
  name: 'feature-antispam', command: 'antispam', category: 'protection', target: 'group', roles: ['admin', 'owner'],
  description: 'Blocca raffiche di messaggi e comandi', icon: '🛑', permissions: { roles: ['admin', 'owner'] }
}, { group: true, before })
