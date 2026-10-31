import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  adminTargetError,
  getGroupTarget,
  protectedTargetError,
  recordAction,
  updateParticipants
} from '../../lib/group-moderation.js'

async function kick(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const target = await getGroupTarget(this, m, metadata.participants, extra.text)
  const error = protectedTargetError(m, target, 'Rimozione')
  if (error) return error
  if (target.isAdmin) return adminTargetError(m, 'Rimozione')

  await updateParticipants(this, m.chat, target, 'remove')
  if (typeof extra.setKickReason === 'function') {
    extra.setKickReason(m.chat, target.jid, {
      type: 'kickcmd',
      reason: 'rimozione tramite comando',
      source: 'group-kick',
      messageId: m.id
    }, m.sender)
  }
  recordAction(global.db.data.chats[m.chat], m.senderPn || m.sender, 'kick')
  return m.reply(pluginUi.box('👢 Rimozione', [
    pluginUi.row('✅', 'Stato:', 'utente rimosso dal gruppo'),
    pluginUi.row('👤', 'Utente:', target.description.label)
  ]))
}

export default definePlugin(kick, {
  name: 'group-kick',
  command: ['kick', 'rimuovi'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Rimuove un membro dal gruppo',
  icon: '👢',
  order: 72,
  permissions: { roles: ['admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
