import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  adminTargetError,
  getGroupTarget,
  groupState,
  protectedTargetError,
  recordAction,
  stripMentionTokens,
  updateParticipants
} from '../../lib/group-moderation.js'
import { getWarnRecord, markDatabaseDirty } from '../../lib/group-state.js'

async function warn(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const target = await getGroupTarget(this, m, metadata.participants, extra.text)
  const error = protectedTargetError(m, target, 'Warn')
  if (error) return error
  if (target.isAdmin) return adminTargetError(m, 'Warn')

  const chat = groupState(m.chat)
  const record = getWarnRecord(chat, target.key, true)
  const maxWarn = Math.max(1, Number(global.maxwarn) || 3)
  const reason = stripMentionTokens(extra.text) || 'motivo non specificato'
  record.count++
  record.entries.push({
    at: Date.now(),
    reason,
    by: m.senderPn || m.sender
  })
  record.entries = record.entries.slice(-20)
  record.lastReason = reason
  markDatabaseDirty()
  recordAction(chat, m.senderPn || m.sender, 'warn')

  let removed = false
  let removalError = false
  if (record.count >= maxWarn) {
    if (!extra.isBotAdmin) {
      removalError = true
    } else {
      try {
        extra.setKickReason?.(m.chat, target.jid, {
          type: 'warn',
          reason: `raggiunto il limite di ${maxWarn} warn`,
          source: 'group-warn',
          messageId: m.id
        }, m.sender)
        await updateParticipants(this, m.chat, target, 'remove')
        removed = true
      } catch {
        removalError = true
      }
    }
  }

  const status = removed
    ? 'limite raggiunto: utente rimosso'
    : removalError
      ? 'warn registrato, rimozione non riuscita: verifica i permessi del bot'
      : 'warn registrato'

  return m.reply(pluginUi.box('⚠️ Warn', [
    pluginUi.row('👤', 'Utente:', target.description.label),
    pluginUi.row('📊', 'Conteggio:', `${record.count}/${maxWarn}`),
    pluginUi.row(removed ? '👢' : '✅', 'Stato:', status),
    pluginUi.row('📝', 'Motivo:', reason)
  ]))
}

export default definePlugin(warn, {
  name: 'group-warn',
  command: ['warn'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Assegna un warn con storico per gruppo',
  icon: '⚠️',
  order: 80,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
