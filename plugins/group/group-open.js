import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { groupState, recordAction } from '../../lib/group-moderation.js'

async function aperto(m) {
  if (typeof this.groupSettingUpdate !== 'function') {
    return m.reply(pluginUi.box('⚠️ Gruppo Aperto', [
      pluginUi.row('🚫', 'Stato:', 'API impostazioni gruppo non disponibile')
    ]))
  }
  await this.groupSettingUpdate(m.chat, 'not_announcement')
  const chat = groupState(m.chat)
  chat.groupMode = 'open'
  recordAction(chat, m.senderPn || m.sender, 'open')
  return m.reply(pluginUi.box('🔓 Gruppo Aperto', [
    pluginUi.row('✅', 'Stato:', 'tutti i partecipanti possono scrivere')
  ]))
}

export default definePlugin(aperto, {
  name: 'group-open',
  command: ['aperto', 'apri'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Permette a tutti di scrivere nel gruppo',
  icon: '🔓',
  order: 86,
  permissions: { roles: ['admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
