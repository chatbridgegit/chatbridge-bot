import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

function chatOf(m) { const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {}); if (typeof chat.antiDocument !== 'boolean') chat.antiDocument = false; return chat }
async function before(m, { conn, isAdmin, isBotAdmin } = {}) {
  const message = m.message?.viewOnceMessage?.message || m.message?.ephemeralMessage?.message || m.message || {}
  if (!m?.isGroup || m.isAuthenticatedSelf || isAdmin || !isBotAdmin || !chatOf(m).antiDocument || !message.documentMessage) return false
  m.commandBlocked = true
  await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: !!m.key.fromMe, id: m.key.id, participant: m.key.participant || m.senderPn || m.sender } }).catch(() => {})
  return true
}
async function toggle(m, extra) { const chat = chatOf(m); const value = String(extra.text || '').trim().toLowerCase(); if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('📄 AntiDocumenti', [pluginUi.row(chat.antiDocument ? '✅' : '❌', 'Stato:', chat.antiDocument ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antidocumenti on|off')])); chat.antiDocument = value === 'on'; global.markDbDirty?.(); return m.reply(pluginUi.box('📄 AntiDocumenti', [pluginUi.row(chat.antiDocument ? '✅' : '❌', 'Stato:', chat.antiDocument ? 'attivato' : 'disattivato')])) }
export default definePlugin(toggle, { name: 'feature-antidocumenti', command: 'antidocumenti', category: 'protection', target: 'group', roles: ['admin', 'owner'], description: 'Blocca documenti non autorizzati', icon: '📄', permissions: { roles: ['admin', 'owner'] } }, { group: true, before })
