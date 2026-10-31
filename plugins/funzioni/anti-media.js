import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'
import { bold } from '../../lib/bold.js'
import { getGroupAuthorization, getIdentityResolver } from '../../lib/whatsapp-identity.js'

function chatOf(m) { const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {}); if (typeof chat.antimedia !== 'boolean') chat.antimedia = false; return chat }
async function before(m, { conn, isBotAdmin } = {}) {
  if (!m?.isGroup || m.isAuthenticatedSelf || !chatOf(m).antimedia) return false
  const msg = m.msg || {}
  const type = m.mtype || ''
  const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
  const authorization = getGroupAuthorization(
    m.identity,
    groupMetadata?.participants,
    getIdentityResolver(conn),
    { metadataAvailable: !!groupMetadata }
  )
  if (!authorization.verified || !isBotAdmin) return false
  if (authorization.isAdmin) return true
  if (!['imageMessage', 'videoMessage'].includes(type)) return true
  const isViewOnce = msg?.[type]?.viewOnce
  const isGif = msg?.videoMessage?.gifPlayback
  if (isViewOnce && !isGif) return true
  m.commandBlocked = true
  await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant || m.sender } }).catch(() => {})
  await conn.sendMessage(m.chat, { text: bold('┌──────────\n   • ⚠️ ୭ *ANTIMEDIA ATTIVO*\n└──────────\n\n• Violazione regole\n\nSolo foto e video a 1 visual sono permessi\n\n┌──────────╮\n│ ˚. ᵎᵎ 🚫\n│ Media eliminato\n└──────────'), mentions: [m.sender] }).catch(() => {})
  return true
}
async function toggle(m, extra) { const chat = chatOf(m); const value = String(extra.text || '').trim().toLowerCase(); if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('🖼️ Antimedia', [pluginUi.row(chat.antimedia ? '✅' : '❌', 'Stato:', chat.antimedia ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antimedia on|off')])); chat.antimedia = value === 'on'; global.markDbDirty?.(); return m.reply(pluginUi.box('🖼️ Antimedia', [pluginUi.row(chat.antimedia ? '✅' : '❌', 'Stato:', chat.antimedia ? 'attivato' : 'disattivato')])) }
export default definePlugin(toggle, { name: 'feature-antimedia', command: 'antimedia', category: 'protection', target: 'group', roles: ['admin', 'owner'], description: 'Blocca i media nei gruppi', icon: '🖼️', permissions: { roles: ['admin', 'owner'] } }, { group: true, before })
