import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, describeParticipant, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  getGroupTarget,
  groupState,
  protectedTargetError
} from '../../lib/group-moderation.js'
import { getWarnRecord } from '../../lib/group-state.js'

async function listawarn(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const chat = groupState(m.chat)
  const target = await getGroupTarget(this, m, metadata.participants, extra.text)

  if (target) {
    const error = protectedTargetError(m, target, 'Lista Warn')
    if (error) return error
    const record = getWarnRecord(chat, target.key)
    if (!record || record.count < 1) {
      return m.reply(pluginUi.box('📜 Lista Warn', [
        pluginUi.row('👤', 'Utente:', target.description.label),
        pluginUi.row('✅', 'Stato:', 'nessun warn attivo')
      ]))
    }

    const reasons = record.entries.slice(-5).map((entry, index) => {
      const date = new Date(entry.at || Date.now()).toLocaleDateString('it-IT')
      return pluginUi.row('⚠️', `${index + 1}.`, `${date} - ${entry.reason || 'motivo non specificato'}`)
    })
    return m.reply(pluginUi.box('📜 Lista Warn', [
      pluginUi.row('👤', 'Utente:', target.description.label),
      pluginUi.row('📊', 'Conteggio:', String(record.count)),
      ...reasons
    ]))
  }

  const active = Object.entries(chat.warns)
    .filter(([, record]) => Number(record?.count) > 0)

  if (!active.length) {
    return m.reply(pluginUi.box('📜 Lista Warn', [
      pluginUi.row('✅', 'Stato:', 'nessun warn attivo nel gruppo')
    ]))
  }

  const rows = await Promise.all(active.map(async ([key, record], index) => {
    const participant = (Array.isArray(metadata.participants) ? metadata.participants : []).find(value => {
      const candidate = value?.phoneNumber || value?.pn || value?.participantPn || value?.jid || value?.id
      return candidate && String(candidate) === key
    })
    const description = await describeParticipant(this, participant || { id: key }, index)
    return pluginUi.row('⚠️', `${index + 1}.`, `${description.label} - ${record.count} warn`)
  }))

  return m.reply(pluginUi.box('📜 Lista Warn', rows))
}

export default definePlugin(listawarn, {
  name: 'group-warn-list',
  command: ['listawarn', 'warns'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Mostra i warn attivi del gruppo',
  icon: '📜',
  order: 82,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
