import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  getGroupTarget,
  groupState,
  protectedTargetError,
  recordAction
} from '../../lib/group-moderation.js'
import { getWarnRecord, markDatabaseDirty } from '../../lib/group-state.js'

async function unwarn(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const target = await getGroupTarget(this, m, metadata.participants, extra.text)
  const error = protectedTargetError(m, target, 'Unwarn')
  if (error) return error

  const chat = groupState(m.chat)
  const record = getWarnRecord(chat, target.key)
  if (!record || record.count < 1) {
    return m.reply(pluginUi.box('⚠️ Unwarn', [
      pluginUi.row('ℹ️', 'Stato:', 'utente senza warn attivi')
    ]))
  }

  record.count = Math.max(0, record.count - 1)
  record.entries.pop()
  if (!record.count) delete chat.warns[target.key]
  markDatabaseDirty()
  recordAction(chat, m.senderPn || m.sender, 'unwarn')
  return m.reply(pluginUi.box('✅ Unwarn', [
    pluginUi.row('👤', 'Utente:', target.description.label),
    pluginUi.row('📊', 'Conteggio:', String(record.count))
  ]))
}

export default definePlugin(unwarn, {
  name: 'group-unwarn',
  command: ['unwarn'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Rimuove l’ultimo warn di un utente',
  icon: '✅',
  order: 81,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
