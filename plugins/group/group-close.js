import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { groupState, recordAction } from '../../lib/group-moderation.js'

async function chiuso(m) {
  if (typeof this.groupSettingUpdate !== 'function') {
    return m.reply(pluginUi.box('⚠️ Gruppo Chiuso', [
      pluginUi.row('🚫', 'Stato:', 'API impostazioni gruppo non disponibile')
    ]))
  }
  await this.groupSettingUpdate(m.chat, 'announcement')
  const chat = groupState(m.chat)
  chat.groupMode = 'closed'
  recordAction(chat, m.senderPn || m.sender, 'close')
  return m.reply(pluginUi.box('🔒 Gruppo Chiuso', [
    pluginUi.row('✅', 'Stato:', 'solo gli amministratori possono scrivere')
  ]))
}

export default definePlugin(chiuso, {
  name: 'group-close',
  command: ['chiuso', 'chiudi'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Limita la scrittura ai soli amministratori',
  icon: '🔒',
  order: 87,
  permissions: { roles: ['admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
