import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const pattern = /(?:chat\.whatsapp\.com|whatsapp\.com\/channel|wa\.me)\b[^\s]*/i

function textOf(m) {
  const raw = m.message || {}
  return [m.text, raw.conversation, raw.extendedTextMessage?.text, raw.imageMessage?.caption, raw.videoMessage?.caption, raw.documentMessage?.caption, raw.groupInviteMessage?.inviteCode]
    .filter(value => typeof value === 'string').join(' ').replace(/[\u200b\u200c\u200d\uFEFF]/g, '')
}

function chatOf(m) {
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  if (typeof chat.antiLinkWhatsApp !== 'boolean') chat.antiLinkWhatsApp = false
  return chat
}

async function before(m, { conn, isAdmin, isBotAdmin } = {}) {
  if (!m?.isGroup || m.isAuthenticatedSelf || isAdmin) return false
  const chat = chatOf(m)
  if (!chat.antiLinkWhatsApp || !isBotAdmin || !pattern.test(textOf(m))) return false
  m.commandBlocked = true
  await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: !!m.key.fromMe, id: m.key.id, participant: m.key.participant || m.senderPn || m.sender } }).catch(() => {})
  return true
}

async function toggle(m, extra) {
  const chat = chatOf(m)
  const value = String(extra.text || '').trim().toLowerCase()
  if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('💬 AntiLink WhatsApp', [pluginUi.row(chat.antiLinkWhatsApp ? '✅' : '❌', 'Stato:', chat.antiLinkWhatsApp ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antilinkwhatsapp on|off')]))
  chat.antiLinkWhatsApp = value === 'on'
  global.markDbDirty?.()
  return m.reply(pluginUi.box('💬 AntiLink WhatsApp', [pluginUi.row(chat.antiLinkWhatsApp ? '✅' : '❌', 'Stato:', chat.antiLinkWhatsApp ? 'attivato' : 'disattivato')]))
}

export default definePlugin(toggle, {
  name: 'feature-antilinkwhatsapp', command: 'antilinkwhatsapp', category: 'protection', target: 'group',
  roles: ['admin', 'owner'], description: 'Blocca link WhatsApp e inviti', icon: '💬', permissions: { roles: ['admin', 'owner'] }
}, { group: true, before })
