import { pluginUi } from '../../lib/plugin-font.js'
import {
  definePlugin,
  describeParticipant,
  getGroupMetadata,
  getParticipants
} from '../../lib/plugin-utils.js'

async function admins(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const participants = getParticipants(metadata, extra.participants)
  const groupAdmins = participants.filter(participant => participant?.admin === 'admin' || participant?.admin === 'superadmin')

  if (!groupAdmins.length) {
    return m.reply(pluginUi.box('👨‍💼 Admin Gruppo', [
      pluginUi.row('ℹ️', 'Stato:', 'nessun admin trovato')
    ]))
  }

  const rows = await Promise.all(groupAdmins.map(async (participant, index) => {
    const description = await describeParticipant(this, participant, index)
    const role = participant.admin === 'superadmin' ? 'owner gruppo' : 'admin'
    return pluginUi.row(participant.admin === 'superadmin' ? '👑' : '👨‍💼', role, description.label)
  }))

  return m.reply(pluginUi.box('👨‍💼 Admin Gruppo', rows))
}

export default definePlugin(admins, {
  name: 'group-admins',
  command: ['admins'],
  category: 'group',
  target: 'group',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Elenca gli amministratori del gruppo',
  icon: '👨‍💼',
  order: 50,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
}, { group: true })
