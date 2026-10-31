import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

async function restart(m, extra) {
  if (extra.args[0] !== 'confirm') return m.reply(pluginUi.box('🔄 Restart', [pluginUi.row('⚠️', 'Conferma:', '.restart confirm'), pluginUi.row('ℹ️', 'Nota:', 'il processo verra riavviato dal supervisor')]))
  await m.reply(pluginUi.box('🔄 Restart', [pluginUi.row('✅', 'Stato:', 'riavvio in corso')]))
  setTimeout(() => process.exit(0), 500)
}

export default definePlugin(restart, {
  name: 'owner-restart',
  command: ['restart'],
  category: 'owner',
  target: 'all',
  rowner: true,
  roles: ['owner'],
  description: 'Riavvia il processo del bot',
  icon: '🔄',
  order: 18,
  permissions: { roles: ['owner'] }
})
