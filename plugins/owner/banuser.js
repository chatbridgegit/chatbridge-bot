import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

function targetOf(m, text = '') {
  return m.mentionedJid?.[0] || m.quoted?.sender || String(text).match(/(?:^|\s)@?(\d{8,15})(?:\s|$)/)?.[1] && `${String(text).match(/(?:^|\s)@?(\d{8,15})(?:\s|$)/)[1]}@s.whatsapp.net`
}

async function banuser(m, extra) {
  const target = targetOf(m, extra.text)
  if (!target || target === m.sender) return m.reply(pluginUi.box('⛔ Ban User', [pluginUi.row('ℹ️', 'Uso:', '.banuser @utente')]))
  const user = global.db.data.users[target] || (global.db.data.users[target] = {})
  user.banned = true
  user.bannedAt = Date.now()
  user.bannedBy = m.sender
  global.markDbDirty?.()
  return m.reply(pluginUi.box('⛔ Utente bloccato', [pluginUi.row('✅', 'Stato:', 'comandi disabilitati'), pluginUi.row('👤', 'Utente:', `@${target.split('@')[0]}`)]))
}

export default definePlugin(banuser, {
  name: 'owner-banuser',
  command: ['banuser'],
  category: 'owner',
  target: 'all',
  owner: true,
  roles: ['owner'],
  description: 'Blocca i comandi a un utente',
  icon: '⛔',
  order: 10,
  permissions: { roles: ['owner'] }
})
