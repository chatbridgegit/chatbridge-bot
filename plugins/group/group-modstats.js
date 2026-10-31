import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, describeParticipant, getGroupMetadata } from '../../lib/plugin-utils.js'
import { groupState } from '../../lib/group-moderation.js'

async function modstats(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const chat = groupState(m.chat)
  const stats = Object.entries(chat.modStats)
    .filter(([, value]) => Number(value?.count) > 0)
    .sort((left, right) => Number(right[1].count) - Number(left[1].count))

  if (!stats.length) {
    return m.reply(pluginUi.box('🧑‍⚖️ Mod Stats', [
      pluginUi.row('ℹ️', 'Stato:', 'nessuna azione registrata')
    ]))
  }

  const rows = await Promise.all(stats.slice(0, 50).map(async ([key, value], index) => {
    const participant = (Array.isArray(metadata.participants) ? metadata.participants : []).find(item => {
      const values = [item?.phoneNumber, item?.pn, item?.participantPn, item?.jid, item?.id]
      return values.includes(key)
    })
    const description = await describeParticipant(this, participant || { id: key }, index)
    const actions = Object.entries(value.actions || {})
      .sort((left, right) => right[1] - left[1])
      .map(([action, count]) => `${action}:${count}`)
      .join(', ')
    return pluginUi.row('🧑‍⚖️', `${index + 1}.`, `${description.label} - ${value.count} (${actions})`)
  }))

  return m.reply(pluginUi.box('🧑‍⚖️ Mod Stats', rows))
}

export default definePlugin(modstats, {
  name: 'group-moderator-stats',
  command: ['modstats'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Mostra le azioni dei moderatori',
  icon: '🧑‍⚖️',
  order: 99,
  permissions: { roles: ['admin', 'owner'] }
}, { group: true })
