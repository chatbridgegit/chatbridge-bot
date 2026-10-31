import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

function chatOf(m) { const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {}); if (typeof chat.antivoip !== 'boolean') chat.antivoip = false; return chat }
async function isVoipNumber(value) {
  try {
    const module = await import('awesome-phonenumber')
    const PhoneNumber = module.default || module
    const parsed = PhoneNumber(`+${String(value).replace(/\D/g, '')}`)
    const type = typeof parsed?.getType === 'function' ? parsed.getType() : parsed?.type
    return type === 'voip'
  } catch {
    return false
  }
}

async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner } = {}) {
  if (!m?.isGroup || m.isAuthenticatedSelf || !chatOf(m).antivoip || !isBotAdmin || isAdmin || isOwner || isROwner) return false
  const sender = m.senderPn || m.sender || ''
  const number = String(sender).split('@')[0].split(':')[0]
  if (!await isVoipNumber(number)) return false

  const bot = global.db.data.settings[conn.user.jid] || {}
  if (!bot.restrict) return false
  await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {})
  m.commandBlocked = true
  return true
}
async function toggle(m, extra) { const chat = chatOf(m); const value = String(extra.text || '').trim().toLowerCase(); if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('📞 Antivoip', [pluginUi.row(chat.antivoip ? '✅' : '❌', 'Stato:', chat.antivoip ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antivoip on|off')])); chat.antivoip = value === 'on'; global.markDbDirty?.(); return m.reply(pluginUi.box('📞 Antivoip', [pluginUi.row(chat.antivoip ? '✅' : '❌', 'Stato:', chat.antivoip ? 'attivato' : 'disattivato')])) }
export default definePlugin(toggle, { name: 'feature-antivoip', command: 'antivoip', category: 'protection', target: 'group', roles: ['admin', 'owner'], description: 'Rileva numeri VoIP sospetti', icon: '📞', permissions: { roles: ['admin', 'owner'] } }, { group: true, before })
