import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const activity = new Map()
const WINDOW = 10000
function chatOf(m) { const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {}); if (typeof chat.antiFlood !== 'boolean') chat.antiFlood = false; return chat }
async function before(m, { conn, isAdmin, isBotAdmin } = {}) {
  if (!m?.isGroup || m.isAuthenticatedSelf || isAdmin || !isBotAdmin || m.isBaileys || !chatOf(m).antiFlood) return false
  const key = `${m.chat}:${m.senderPn || m.sender}`; const now = Date.now(); const recent = (activity.get(key) || []).filter(time => now - time < WINDOW); recent.push(now); activity.set(key, recent)
  if (recent.length < 8) {
    if (recent.length === 1) setTimeout(() => activity.delete(key), WINDOW)
    return false
  }
  m.commandBlocked = true
  await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: !!m.key.fromMe, id: m.key.id, participant: m.key.participant || m.senderPn || m.sender } }).catch(() => {})
  activity.delete(key)
  return true
}
async function toggle(m, extra) { const chat = chatOf(m); const value = String(extra.text || '').trim().toLowerCase(); if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('🌊 AntiFlood', [pluginUi.row(chat.antiFlood ? '✅' : '❌', 'Stato:', chat.antiFlood ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antiflood on|off')])); chat.antiFlood = value === 'on'; global.markDbDirty?.(); return m.reply(pluginUi.box('🌊 AntiFlood', [pluginUi.row(chat.antiFlood ? '✅' : '❌', 'Stato:', chat.antiFlood ? 'attivato' : 'disattivato')])) }
export default definePlugin(toggle, { name: 'feature-antiflood', command: 'antiflood', category: 'protection', target: 'group', roles: ['admin', 'owner'], description: 'Rileva raffiche anomale per utente', icon: '🌊', permissions: { roles: ['admin', 'owner'] } }, { group: true, before })
