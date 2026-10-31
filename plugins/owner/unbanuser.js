import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

function targetOf(m, text = '') {
  return m.mentionedJid?.[0] || m.quoted?.sender || String(text).match(/(?:^|\s)@?(\d{8,15})(?:\s|$)/)?.[1] && `${String(text).match(/(?:^|\s)@?(\d{8,15})(?:\s|$)/)[1]}@s.whatsapp.net`
}

async function unbanuser(m, extra) {
  const target = targetOf(m, extra.text)
  if (!target) return m.reply(pluginUi.box('✅ Unban User', [pluginUi.row('ℹ️', 'Uso:', '.unbanuser @utente')]))
  const user = global.db.data.users[target] || (global.db.data.users[target] = {})
  user.banned = false
  user.bannedAt = 0
  user.bannedBy = null
  global.markDbDirty?.()
  return m.reply(pluginUi.box('✅ Utente sbloccato', [pluginUi.row('✅', 'Stato:', 'comandi riabilitati'), pluginUi.row('👤', 'Utente:', `@${target.split('@')[0]}`)]))
}

export default definePlugin(unbanuser, {
  name: 'owner-unbanuser',
  command: ['unbanuser'],
  category: 'owner',
  target: 'all',
  owner: true,
  roles: ['owner'],
  description: 'Riabilita i comandi a un utente',
  icon: '✅',
  order: 11,
  permissions: { roles: ['owner'] }
})
