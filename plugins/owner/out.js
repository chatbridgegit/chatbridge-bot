import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

async function out(m) {
  if (!m.isGroup || typeof this.groupLeave !== 'function') return m.reply(pluginUi.box('🚪 Out', [pluginUi.row('❌', 'Stato:', 'questo comando funziona solo nei gruppi')]))
  await m.reply(pluginUi.box('🚪 Uscita gruppo', [pluginUi.row('⚠️', 'Stato:', 'il bot sta lasciando il gruppo')]))
  return this.groupLeave(m.chat)
}

export default definePlugin(out, {
  name: 'owner-out',
  command: ['out'],
  category: 'owner',
  target: 'group',
  owner: true,
  roles: ['owner'],
  description: 'Fa uscire il bot dal gruppo corrente',
  icon: '🚪',
  order: 15,
  permissions: { roles: ['owner'] }
}, { group: true })
