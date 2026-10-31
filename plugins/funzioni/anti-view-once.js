import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

function chatOf(m) {
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  if (typeof chat.antioneview !== 'boolean') chat.antioneview = true
  return chat
}

function getViewOnceMessage(message) {
  let current = message
  let found = false
  for (let index = 0; index < 3; index++) {
    if (!current || typeof current !== 'object') return found ? current : null
    const type = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'].find(key => current[key])
    if (!type) return found ? current : null
    found = true
    current = current[type]?.message
  }
  return found ? current : null
}

async function before(m, { conn, isAdmin, isBotAdmin } = {}) {
  if (!m?.isGroup || m.isAuthenticatedSelf || isAdmin || !isBotAdmin || !chatOf(m).antioneview) return false
  if (!getViewOnceMessage(m.message)) return false
  m.commandBlocked = true
  await conn.sendMessage(m.chat, {
    delete: {
      remoteJid: m.chat,
      fromMe: !!m.key.fromMe,
      id: m.key.id,
      participant: m.key.participant || m.senderPn || m.sender
    }
  }).catch(() => {})
  return true
}

async function toggle(m, extra) {
  const chat = chatOf(m)
  const value = String(extra.text || '').trim().toLowerCase()
  if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('👁️ AntiViewOnce', [pluginUi.row(chat.antioneview ? '✅' : '❌', 'Stato:', chat.antioneview ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antiviewonce on|off')]))
  chat.antioneview = value === 'on'
  global.markDbDirty?.()
  return m.reply(pluginUi.box('👁️ AntiViewOnce', [pluginUi.row(chat.antioneview ? '✅' : '❌', 'Stato:', chat.antioneview ? 'attivato' : 'disattivato')]))
}

export default definePlugin(toggle, {
  name: 'feature-antiviewonce',
  command: 'antiviewonce',
  category: 'protection',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Blocca contenuti visualizzabili una sola volta',
  icon: '👁️',
  permissions: { roles: ['admin', 'owner'] }
}, { group: true, before })
