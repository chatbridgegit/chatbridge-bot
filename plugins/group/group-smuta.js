import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  getGroupTarget,
  groupState,
  protectedTargetError,
  recordAction
} from '../../lib/group-moderation.js'

async function smuta(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const target = await getGroupTarget(this, m, metadata.participants, extra.text)
  const error = protectedTargetError(m, target, 'Smuta')
  if (error) return error

  const chat = groupState(m.chat)
  const user = global.db.data.users[target.key] || global.db.data.users[target.jid]
  const legacyMuted = user && typeof user.muto === 'object' && user.muto[m.chat]
  const legacyGlobalMuted = user?.muto === true
  if (!chat.mutedUsers[target.key] && !legacyMuted && !legacyGlobalMuted) {
    return m.reply(pluginUi.box('⚠️ Smuta', [
      pluginUi.row('ℹ️', 'Stato:', 'utente non presente nella lista dei silenziati')
    ]))
  }

  delete chat.mutedUsers[target.key]
  if (legacyMuted) delete user.muto[m.chat]
  if (legacyGlobalMuted) user.muto = false
  recordAction(chat, m.senderPn || m.sender, 'unmute')
  return m.reply(pluginUi.box('🔊 Smuta', [
    pluginUi.row('✅', 'Stato:', 'utente riabilitato'),
    pluginUi.row('👤', 'Utente:', target.description.label)
  ]))
}

export default definePlugin(smuta, {
  name: 'group-unmute',
  command: ['smuta', 'unmute'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Rimuove il silenziamento di un membro',
  icon: '🔊',
  order: 77,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
