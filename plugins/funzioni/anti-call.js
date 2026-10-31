import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

async function toggle(m, extra) {
  const settings = global.db.data.settings[this.user.jid] || (global.db.data.settings[this.user.jid] = {})
  const value = String(extra.text || '').trim().toLowerCase()
  if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('📵 AntiCall', [pluginUi.row(settings.antiCall ? '✅' : '❌', 'Stato:', settings.antiCall ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.anticall on|off')]))
  settings.antiCall = value === 'on'
  global.markDbDirty?.()
  return m.reply(pluginUi.box('📵 AntiCall', [pluginUi.row(settings.antiCall ? '✅' : '❌', 'Stato:', settings.antiCall ? 'attivato' : 'disattivato')]))
}

export default definePlugin(toggle, { name: 'feature-anticall', command: 'anticall', category: 'protection', target: 'group', roles: ['admin', 'owner'], description: 'Blocca le chiamate al bot', icon: '📵', permissions: { roles: ['admin', 'owner'] } }, { group: true })
