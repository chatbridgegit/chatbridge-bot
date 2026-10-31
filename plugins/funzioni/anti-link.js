import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})|whatsapp\.com\/channel\/([0-9A-Za-z]{20,24})/i
const urlRegex = /(https?:\/\/[^\s]+)/gi

function normalizeInvisible(text = '') {
  return String(text).replace(/[\s\u200b\u200c\u200d\uFEFF]+/g, ' ').trim()
}

function extractRealMessageTextAndUrls(message = {}) {
  const parts = []
  const pushText = value => {
    if (typeof value !== 'string') return
    const clean = normalizeInvisible(value)
    if (clean) parts.push(clean)
  }
  pushText(message.conversation)
  pushText(message.extendedTextMessage?.text)
  pushText(message.imageMessage?.caption)
  pushText(message.videoMessage?.caption)
  pushText(message.documentMessage?.caption)
  pushText(message.buttonsResponseMessage?.selectedDisplayText)
  pushText(message.listResponseMessage?.title)
  pushText(message.listResponseMessage?.description)
  pushText(message.templateButtonReplyMessage?.selectedDisplayText)
  pushText(message.groupInviteMessage?.inviteCode)
  pushText(message.groupInviteMessage?.caption)
  pushText(message.groupInviteMessage?.groupName)
  const text = parts.join(' ').trim()
  return { text, urls: [...new Set((text.match(urlRegex) || []).map(url => url.trim()))] }
}

function containsWhatsAppLink(text = '', urls = []) {
  linkRegex.lastIndex = 0
  if (linkRegex.test(text)) return true
  return urls.some(url => {
    linkRegex.lastIndex = 0
    return linkRegex.test(url)
  })
}

function findDetectedWhatsAppLink(text = '', urls = []) {
  const detected = urls.find(url => {
    linkRegex.lastIndex = 0
    return linkRegex.test(url)
  })
  linkRegex.lastIndex = 0
  return detected || text.match(linkRegex)?.[0] || null
}

async function getCurrentGroupLinkSafe(conn, chatId) {
  try {
    const inviteCode = await conn.groupInviteCode(chatId)
    return inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : null
  } catch {
    return null
  }
}

const formatBox = (title, lines) => `╭═━ 〖 ${title} 〗═━⪩
${lines.map(line => `│❍ ${line}`).join('\n')}
╰━━━━━━━━━⪩`

function chatOf(m) {
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  if (typeof chat.antiLink !== 'boolean') chat.antiLink = true
  return chat
}

async function before(m, { conn, isAdmin, isBotAdmin, setKickReason } = {}) {
  if (!m?.isGroup || m.isAuthenticatedSelf || !m.message || !chatOf(m).antiLink) return false
  const { text, urls } = extractRealMessageTextAndUrls(m.message)
  if (!containsWhatsAppLink(text, urls) || isAdmin) return false

  const currentGroupLink = await getCurrentGroupLinkSafe(conn, m.chat)
  const normalizedUrls = urls.map(url => url.replace(/[),.!?]+$/g, '').toLowerCase())
  if (currentGroupLink && normalizedUrls.length && normalizedUrls.every(url => url === currentGroupLink.toLowerCase())) return false
  m.commandBlocked = true

  if (!isBotAdmin) {
    await m.reply(formatBox('𓌹 🚫 𓌺 Antilink', ['Non posso intervenire.', 'Devo essere admin del gruppo.'])).catch(() => {})
    return true
  }

  const sender = `@${m.sender.split('@')[0]}`
  const detectedUrl = findDetectedWhatsAppLink(text, urls) || 'link WhatsApp rilevato'
  setKickReason?.(m.chat, m.sender, {
    type: 'antilink',
    reason: 'Link WhatsApp non consentito',
    details: `Contenuto rilevato: ${String(detectedUrl).slice(0, 500)}`,
    source: 'plugins/funzioni/anti-link.js',
    messageId: m.key.id,
    rawText: text
  }, m.sender)

  await conn.sendMessage(m.chat, {
    text: formatBox('𓌹 🚫 𓌺 Antilink', [`Ciao ${sender}`, 'Qui i link WhatsApp non sono ammessi.', 'Procedo con la rimozione.']),
    mentions: [m.sender]
  }, { quoted: m }).catch(() => {})
  await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant || m.sender } }).catch(() => {})

  const bot = global.db.data.settings[conn.user.jid] || {}
  if (!bot.restrict) {
    await m.reply(formatBox('𓌹 ⚠️ 𓌺 Antilink', ['Link rilevato.', 'Ma restrict non è attivo.'])).catch(() => {})
    return true
  }
  await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {})
  return true
}

async function toggle(m, extra) {
  const chat = chatOf(m)
  const value = String(extra.text || '').trim().toLowerCase()
  if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('🔗 Antilink', [pluginUi.row(chat.antiLink ? '✅' : '❌', 'Stato:', chat.antiLink ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antilink on|off')]))
  chat.antiLink = value === 'on'
  global.markDbDirty?.()
  return m.reply(pluginUi.box('🔗 Antilink', [pluginUi.row(chat.antiLink ? '✅' : '❌', 'Stato:', chat.antiLink ? 'attivato' : 'disattivato')]))
}

export default definePlugin(toggle, {
  name: 'feature-antilink', command: 'antilink', category: 'protection', target: 'group',
  roles: ['admin', 'owner'], description: 'Blocca tutti i link esterni', icon: '🔗',
  permissions: { roles: ['admin', 'owner'] }
}, { group: true, before })
