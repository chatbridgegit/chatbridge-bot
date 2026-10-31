import { pluginUi } from '../../lib/plugin-font.js'
import {
  definePlugin,
  describeParticipant,
  getGroupMetadata,
  resolvePhoneJid
} from '../../lib/plugin-utils.js'
import { groupState } from '../../lib/group-moderation.js'

async function listmod(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const chat = groupState(m.chat)
  const configured = chat.moderators
  const sources = [...configured, ...(Array.isArray(global.mods) ? global.mods : [])]
    .map(value => Array.isArray(value) ? value[0] : value)
    .filter(Boolean)
    .map(String)
  const resolvedModerators = await Promise.all(sources.map(async value => ({
    value,
    phone: await resolvePhoneJid(this, { id: value })
  })))
  const moderators = [...new Map(resolvedModerators
    .filter(item => item.phone || item.value.includes('@lid') || /\d{5,16}/.test(item.value))
    .map(item => [item.phone || item.value, item.phone || item.value])).values()]

  if (!moderators.length) {
    return m.reply(pluginUi.box('🛡️ Moderatori', [
      pluginUi.row('ℹ️', 'Stato:', 'nessun moderatore configurato')
    ]))
  }

  const rows = await Promise.all(moderators.map(async (jid, index) => {
    const description = await describeParticipant(this, { id: jid }, index)
    return pluginUi.row('🛡️', 'Moderatore:', description.label)
  }))

  return m.reply(pluginUi.box('🛡️ Moderatori', [
    pluginUi.row('👥', 'Gruppo:', metadata.subject || m.chat),
    ...rows
  ]))
}

export default definePlugin(listmod, {
  name: 'group-moderators',
  command: ['listmod'],
  category: 'group',
  target: 'group',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Elenca i moderatori configurati',
  icon: '🛡️',
  order: 60,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
}, { group: true })
