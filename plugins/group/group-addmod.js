import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  getGroupTarget,
  groupState,
  protectedTargetError,
  recordAction,
  sameConfiguredIdentity
} from '../../lib/group-moderation.js'

async function addmod(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const target = await getGroupTarget(this, m, metadata.participants, extra.text)
  const error = protectedTargetError(m, target, 'Moderatore')
  if (error) return error
  if (target.isAdmin) {
    return m.reply(pluginUi.box('⚠️ Moderatore', [
      pluginUi.row('🚫', 'Stato:', 'gli amministratori non vengono registrati come moderatori')
    ]))
  }

  const chat = groupState(m.chat)
  if (chat.moderators.some(value => sameConfiguredIdentity(this, value, target.jid))) {
    return m.reply(pluginUi.box('🛡️ Moderatore', [
      pluginUi.row('ℹ️', 'Stato:', 'utente già presente nella lista moderatori')
    ]))
  }

  chat.moderators.push(target.phoneJid || target.jid)
  recordAction(chat, m.senderPn || m.sender, 'addmod')
  return m.reply(pluginUi.box('🛡️ Moderatore', [
    pluginUi.row('✅', 'Stato:', 'moderatore aggiunto'),
    pluginUi.row('👤', 'Utente:', target.description.label)
  ]))
}

export default definePlugin(addmod, {
  name: 'group-add-moderator',
  command: ['addmod', 'aggiungimod', 'modadd', 'mod'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Aggiunge un moderatore non amministratore',
  icon: '🛡️',
  order: 65,
  permissions: { roles: ['admin', 'owner'] }
}, { group: true })
