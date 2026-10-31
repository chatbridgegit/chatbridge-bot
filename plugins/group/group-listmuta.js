import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, describeParticipant, getGroupMetadata } from '../../lib/plugin-utils.js'
import { groupState } from '../../lib/group-moderation.js'

async function listmuta(m, extra) {
  const chat = groupState(m.chat)
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const participants = Array.isArray(metadata.participants) ? metadata.participants : []
  const muted = Object.entries(chat.mutedUsers)

  if (!muted.length) {
    return m.reply(pluginUi.box('🔇 Lista Mute', [
      pluginUi.row('✅', 'Stato:', 'nessun membro silenziato')
    ]))
  }

  const rows = await Promise.all(muted.map(async ([key, record], index) => {
    const participant = participants.find(item => {
      const values = [item?.phoneNumber, item?.pn, item?.participantPn, item?.jid, item?.id]
      return values.includes(key)
    })
    const description = await describeParticipant(this, participant || { id: key }, index)
    return pluginUi.row('🔇', `${index + 1}.`, description.label)
  }))

  return m.reply(pluginUi.box('🔇 Lista Mute', rows))
}

export default definePlugin(listmuta, {
  name: 'group-mute-list',
  command: ['listamuta', 'listmute', 'mutati'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Mostra i membri silenziati',
  icon: '🔇',
  order: 78,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
