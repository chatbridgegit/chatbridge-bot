import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  getGroupTarget,
  protectedTargetError,
  recordAction,
  updateParticipants
} from '../../lib/group-moderation.js'

async function retrocedi(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const target = await getGroupTarget(this, m, metadata.participants, extra.text)
  const error = protectedTargetError(m, target, 'Retrocessione')
  if (error) return error
  if (!target.isAdmin) {
    return m.reply(pluginUi.box('⚠️ Retrocessione', [
      pluginUi.row('ℹ️', 'Stato:', 'utente non è amministratore')
    ]))
  }

  await updateParticipants(this, m.chat, target, 'demote')
  recordAction(global.db.data.chats[m.chat], m.senderPn || m.sender, 'demote', target, m.chat)
}

export default definePlugin(retrocedi, {
  name: 'group-demote',
  command: ['retrocedi', 'demote', 'r'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Rimuove i privilegi admin da un membro',
  icon: '⬇️',
  order: 71,
  permissions: { roles: ['admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
