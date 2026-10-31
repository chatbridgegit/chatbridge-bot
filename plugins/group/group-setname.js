import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { groupState, recordAction } from '../../lib/group-moderation.js'

async function setname(m, extra) {
  const subject = String(extra.text || '').trim()
  if (subject.length < 1 || subject.length > 100) {
    return m.reply(pluginUi.box('⚠️ Nome Gruppo', [
      pluginUi.row('ℹ️', 'Uso:', '.setname <nuovo nome>'),
      pluginUi.row('ℹ️', 'Limite:', 'il nome deve avere da 1 a 100 caratteri')
    ]))
  }
  if (typeof this.groupUpdateSubject !== 'function') {
    return m.reply(pluginUi.box('⚠️ Nome Gruppo', [
      pluginUi.row('🚫', 'Stato:', 'API nome gruppo non disponibile')
    ]))
  }

  await this.groupUpdateSubject(m.chat, subject)
  recordAction(groupState(m.chat), m.senderPn || m.sender, 'setname')
  return m.reply(pluginUi.box('✏️ Nome Gruppo', [
    pluginUi.row('✅', 'Stato:', 'nome gruppo aggiornato'),
    pluginUi.row('✏️', 'Nome:', subject)
  ]))
}

export default definePlugin(setname, {
  name: 'group-set-name',
  command: ['setname', 'nomegruppo'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Modifica il nome del gruppo',
  icon: '✏️',
  order: 85,
  permissions: { roles: ['admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
