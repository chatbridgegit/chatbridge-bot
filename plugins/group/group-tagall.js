import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  groupState,
  participantPhoneJids,
  recordAction,
  targetMentionText
} from '../../lib/group-moderation.js'

async function tagall(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const participants = Array.isArray(metadata.participants) ? metadata.participants : []
  const targets = await participantPhoneJids(this, participants)
  const mentions = targets.map(value => value.jid)
  if (!mentions.length) {
    return m.reply(pluginUi.box('⚠️ Tagall', [
      pluginUi.row('🚫', 'Stato:', 'nessun numero di telefono disponibile per le menzioni')
    ]))
  }

  const text = String(extra.text || '').trim() || 'Attenzione a tutti i membri del gruppo.'
  const tags = targetMentionText(targets, '')
  await this.sendMessage(m.chat, {
    text: `${pluginUi.box('👥 Tagall', [pluginUi.row('📝', 'Messaggio:', text)])}\n\n${tags}`,
    mentions
  }, { quoted: m })
  recordAction(groupState(m.chat), m.senderPn || m.sender, 'tagall')
  return null
}

export default definePlugin(tagall, {
  name: 'group-tag-all',
  command: ['tagall', 'tutti'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Menziona tutti i membri del gruppo',
  icon: '👥',
  order: 91,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
