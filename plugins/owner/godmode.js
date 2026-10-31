import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

async function godmode(m) {
  if (!m.isGroup || typeof this.groupParticipantsUpdate !== 'function') return m.reply(pluginUi.box('🧠 Godmode', [pluginUi.row('❌', 'Stato:', 'usa il comando in un gruppo')]))
  try {
    await this.groupParticipantsUpdate(m.chat, [m.sender], 'promote')
    return m.reply(pluginUi.box('🧠 Godmode', [pluginUi.row('✅', 'Stato:', 'owner promosso ad amministratore'), pluginUi.row('👤', 'Utente:', `@${m.sender.split('@')[0]}`)]))
  } catch (error) {
    return m.reply(pluginUi.box('🧠 Godmode', [pluginUi.row('❌', 'Stato:', error?.message || 'promozione non riuscita')]))
  }
}

export default definePlugin(godmode, {
  name: 'owner-godmode',
  command: ['godmode'],
  category: 'owner',
  target: 'group',
  rowner: true,
  roles: ['owner'],
  description: 'Promuove l’owner ad amministratore',
  icon: '🧠',
  order: 17,
  permissions: { roles: ['owner'] }
}, { group: true })
