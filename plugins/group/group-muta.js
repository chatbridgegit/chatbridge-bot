import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  adminTargetError,
  getGroupTarget,
  groupState,
  protectedTargetError,
  recordAction
} from '../../lib/group-moderation.js'

async function muta(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const target = await getGroupTarget(this, m, metadata.participants, extra.text)
  const error = protectedTargetError(m, target, 'Mute')
  if (error) return error
  if (target.isAdmin) return adminTargetError(m, 'Mute')

  const chat = groupState(m.chat)
  chat.mutedUsers[target.key] = {
    at: Date.now(),
    by: m.senderPn || m.sender,
    name: target.description.name
  }
  const user = global.db.data.users[target.key] || (global.db.data.users[target.jid] = {})
  if (!user.muto || typeof user.muto !== 'object') user.muto = {}
  user.muto[m.chat] = true
  recordAction(chat, m.senderPn || m.sender, 'mute')
  return m.reply(pluginUi.box('🔇 Mute', [
    pluginUi.row('✅', 'Stato:', 'utente silenziato'),
    pluginUi.row('👤', 'Utente:', target.description.label)
  ]))
}

export default definePlugin(muta, {
  name: 'group-mute',
  command: ['muta', 'mute'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Silenziato un membro del gruppo',
  icon: '🔇',
  order: 76,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
