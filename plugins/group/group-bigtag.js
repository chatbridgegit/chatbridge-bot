import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'
import {
  groupState,
  participantPhoneJids,
  recordAction,
  targetMentionText
} from '../../lib/group-moderation.js'

async function bigtag(m, extra) {
  const [countText, ...messageParts] = String(extra.text || '').trim().split(/\s+/)
  const requested = Number(countText)
  if (!Number.isInteger(requested) || requested < 1 || requested > 200) {
    return m.reply(pluginUi.box('⚠️ Bigtag', [
      pluginUi.row('ℹ️', 'Uso:', '.bigtag <numero> <testo>'),
      pluginUi.row('ℹ️', 'Limite:', 'il numero deve essere compreso tra 1 e 200')
    ]))
  }

  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const participants = Array.isArray(metadata.participants) ? metadata.participants : []
  const targets = (await participantPhoneJids(this, participants)).slice(0, requested)
  const mentions = targets.map(value => value.jid)
  if (!mentions.length) {
    return m.reply(pluginUi.box('⚠️ Bigtag', [
      pluginUi.row('🚫', 'Stato:', 'nessun numero di telefono disponibile per le menzioni')
    ]))
  }

  const text = messageParts.join(' ').trim() || 'Attenzione ai membri selezionati.'
  const tags = targetMentionText(targets, '')
  await this.sendMessage(m.chat, {
    text: `${pluginUi.box('📢 Bigtag', [
      pluginUi.row('👥', 'Destinatari:', String(mentions.length)),
      pluginUi.row('📝', 'Messaggio:', text)
    ])}\n\n${tags}`,
    mentions
  }, { quoted: m })
  recordAction(groupState(m.chat), m.senderPn || m.sender, 'bigtag')
  return null
}

export default definePlugin(bigtag, {
  name: 'group-big-tag',
  command: ['bigtag'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Menziona un numero limitato di membri',
  icon: '📢',
  order: 92,
  permissions: { roles: ['admin', 'owner'] }
}, { group: true })
