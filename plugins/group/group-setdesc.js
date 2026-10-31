import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { groupState, recordAction } from '../../lib/group-moderation.js'

async function setdesc(m, extra) {
  const description = String(extra.text || '').trim()
  if (description.length > 2048) {
    return m.reply(pluginUi.box('⚠️ Descrizione Gruppo', [
      pluginUi.row('ℹ️', 'Limite:', 'la descrizione non può superare 2048 caratteri')
    ]))
  }
  if (typeof this.groupUpdateDescription !== 'function') {
    return m.reply(pluginUi.box('⚠️ Descrizione Gruppo', [
      pluginUi.row('🚫', 'Stato:', 'API descrizione gruppo non disponibile')
    ]))
  }

  await this.groupUpdateDescription(m.chat, description)
  recordAction(groupState(m.chat), m.senderPn || m.sender, 'setdesc')
  return m.reply(pluginUi.box('✏️ Descrizione Gruppo', [
    pluginUi.row('✅', 'Stato:', 'descrizione aggiornata')
  ]))
}

export default definePlugin(setdesc, {
  name: 'group-set-description',
  command: ['setdesc', 'descrizione'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Modifica la descrizione del gruppo',
  icon: '✏️',
  order: 101,
  permissions: { roles: ['admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
