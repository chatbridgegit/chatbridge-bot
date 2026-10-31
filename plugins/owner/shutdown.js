import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

async function shutdown(m, extra) {
  if (extra.args[0] !== 'confirm') return m.reply(pluginUi.box('⛔ Shutdown', [pluginUi.row('⚠️', 'Conferma:', '.shutdown confirm'), pluginUi.row('ℹ️', 'Nota:', 'il bot verra arrestato definitivamente')]))
  await m.reply(pluginUi.box('⛔ Shutdown', [pluginUi.row('✅', 'Stato:', 'arresto in corso')]))
  setTimeout(() => process.exit(0), 500)
}

export default definePlugin(shutdown, {
  name: 'owner-shutdown',
  command: ['shutdown'],
  category: 'owner',
  target: 'all',
  rowner: true,
  roles: ['owner'],
  description: 'Arresta il processo del bot',
  icon: '⛔',
  order: 19,
  permissions: { roles: ['owner'] }
})
