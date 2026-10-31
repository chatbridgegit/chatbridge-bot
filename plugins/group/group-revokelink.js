import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { groupState, recordAction } from '../../lib/group-moderation.js'

async function revokelink(m) {
  if (typeof this.groupRevokeInvite !== 'function') {
    return m.reply(pluginUi.box('⚠️ Revoca Link', [
      pluginUi.row('🚫', 'Stato:', 'API revoca link non disponibile')
    ]))
  }

  const code = await this.groupRevokeInvite(m.chat)
  if (!code) {
    return m.reply(pluginUi.box('⚠️ Revoca Link', [
      pluginUi.row('🚫', 'Stato:', 'WhatsApp non ha restituito un nuovo link')
    ]))
  }

  recordAction(groupState(m.chat), m.senderPn || m.sender, 'revoke-link')
  return m.reply(pluginUi.box('🔗 Link Revocato', [
    pluginUi.row('✅', 'Stato:', 'vecchio link invalidato'),
    pluginUi.row('🔗', 'Nuovo link:', `https://chat.whatsapp.com/${code}`)
  ]))
}

export default definePlugin(revokelink, {
  name: 'group-revoke-link',
  command: ['revokelink', 'revocalink'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Revoca il link attuale e ne genera uno nuovo',
  icon: '🔗',
  order: 100,
  permissions: { roles: ['admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
