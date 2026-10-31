import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  getGroupTarget,
  groupState,
  protectedTargetError,
  recordAction,
  sameConfiguredIdentity,
  targetError
} from '../../lib/group-moderation.js'

async function delmod(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const target = await getGroupTarget(this, m, metadata.participants, extra.text)
  const error = !target
    ? targetError(m, 'Moderatore')
    : (target.isBot || target.isSuperAdmin)
      ? protectedTargetError(m, target, 'Moderatore')
      : null
  if (error) return error

  const chat = groupState(m.chat)
  const index = chat.moderators.findIndex(value => sameConfiguredIdentity(this, value, target.jid))
  if (index === -1) {
    return m.reply(pluginUi.box('⚠️ Moderatore', [
      pluginUi.row('ℹ️', 'Stato:', 'utente non presente nella lista moderatori')
    ]))
  }

  chat.moderators.splice(index, 1)
  recordAction(chat, m.senderPn || m.sender, 'delmod')
  return m.reply(pluginUi.box('🛡️ Moderatore', [
    pluginUi.row('✅', 'Stato:', 'moderatore rimosso'),
    pluginUi.row('👤', 'Utente:', target.description.label)
  ]))
}

export default definePlugin(delmod, {
  name: 'group-remove-moderator',
  command: ['delmod', 'rimuovimod', 'unmod'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Rimuove un moderatore non amministratore',
  icon: '🛡️',
  order: 66,
  permissions: { roles: ['admin', 'owner'] }
}, { group: true })
