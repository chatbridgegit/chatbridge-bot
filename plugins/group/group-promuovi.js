import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  getGroupTarget,
  protectedTargetError,
  recordAction,
  updateParticipants
} from '../../lib/group-moderation.js'

async function promuovi(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const target = await getGroupTarget(this, m, metadata.participants, extra.text)
  const error = protectedTargetError(m, target, 'Promozione')
  if (error) return error
  if (target.isAdmin) {
    return m.reply(pluginUi.box('⚠️ Promozione', [
      pluginUi.row('ℹ️', 'Stato:', 'utente già amministratore')
    ]))
  }

  await updateParticipants(this, m.chat, target, 'promote')
  recordAction(global.db.data.chats[m.chat], m.senderPn || m.sender, 'promote', target, m.chat)
}

export default definePlugin(promuovi, {
  name: 'group-promote',
  command: ['promuovi', 'promote', 'p'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Promuove un membro ad amministratore',
  icon: '⬆️',
  order: 70,
  permissions: { roles: ['admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
