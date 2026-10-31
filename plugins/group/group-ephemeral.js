import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { groupState, recordAction } from '../../lib/group-moderation.js'

const durations = {
  off: 0,
  0: 0,
  '24h': 86400,
  '1d': 86400,
  '7d': 604800,
  '90d': 7776000
}

async function ephemeral(m, extra) {
  const value = String(extra.text || '').trim().toLowerCase()
  const seconds = durations[value]
  if (seconds === undefined) {
    return m.reply(pluginUi.box('⚠️ Messaggi Temporanei', [
      pluginUi.row('ℹ️', 'Uso:', '.temporanei off|24h|7d|90d')
    ]))
  }
  if (typeof this.groupToggleEphemeral !== 'function') {
    return m.reply(pluginUi.box('⚠️ Messaggi Temporanei', [
      pluginUi.row('🚫', 'Stato:', 'API messaggi temporanei non disponibile')
    ]))
  }

  await this.groupToggleEphemeral(m.chat, seconds)
  const chat = groupState(m.chat)
  chat.ephemeralDuration = seconds
  recordAction(chat, m.senderPn || m.sender, 'ephemeral')
  return m.reply(pluginUi.box('✅ Messaggi Temporanei', [
    pluginUi.row('⏱️', 'Durata:', seconds ? value : 'disattivati')
  ]))
}

export default definePlugin(ephemeral, {
  name: 'group-ephemeral',
  command: ['temporanei', 'ephemeral'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Configura la durata dei messaggi temporanei',
  icon: '⏱️',
  order: 103,
  permissions: { roles: ['admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
