import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata, resolvePhoneJid } from '../../lib/plugin-utils.js'
import { groupState, recordAction, updateParticipants } from '../../lib/group-moderation.js'
import { identityKey } from '../../lib/group-state.js'

async function inattivi(m, extra) {
  const chat = groupState(m.chat)
  const args = String(extra.text || '').trim().split(/\s+/).filter(Boolean)
  const remove = ['rimuovi', 'kick', 'elimina'].includes((args[0] || '').toLowerCase())
  const daysValue = Number(remove ? args[1] : args[0])
  const days = Number.isFinite(daysValue) && daysValue > 0
    ? daysValue
    : Number(chat.inactiveDays) || Number(global.inactiveDays) || 30
  if (days > 3650) {
    return m.reply(pluginUi.box('⚠️ Inattivi', [
      pluginUi.row('ℹ️', 'Limite:', 'la soglia massima è di 3650 giorni')
    ]))
  }

  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const participants = Array.isArray(metadata.participants) ? metadata.participants : []
  const now = Date.now()
  const threshold = days * 86400000
  const candidates = []

  for (const participant of participants) {
    if (participant.admin === 'admin' || participant.admin === 'superadmin') continue
    const phoneJid = await resolvePhoneJid(this, participant)
    if (!phoneJid) continue
    if (chat.moderators.some(value => identityKey(value) === identityKey(phoneJid))) continue
    const lastActivity = Number(chat.memberActivity[identityKey(phoneJid)] || 0)
    if (lastActivity && now - lastActivity >= threshold) {
      candidates.push({ participant, phoneJid, lastActivity })
    }
  }

  if (remove) {
    if (!extra.isBotAdmin) {
      return m.reply(pluginUi.box('⚠️ Inattivi', [
        pluginUi.row('🚫', 'Stato:', 'il bot deve essere admin per rimuovere gli inattivi')
      ]))
    }

    let removed = 0
    for (const candidate of candidates) {
      try {
        await updateParticipants(this, m.chat, { jid: candidate.phoneJid, phoneJid: candidate.phoneJid }, 'remove')
        removed++
      } catch {}
    }
    if (removed) recordAction(chat, m.senderPn || m.sender, 'inattivi-remove')
    return m.reply(pluginUi.box('🧹 Inattivi', [
      pluginUi.row('✅', 'Rimossi:', String(removed)),
      pluginUi.row('⏱️', 'Soglia:', `${days} giorni`),
      ...(removed !== candidates.length ? [pluginUi.row('⚠️', 'Non riusciti:', String(candidates.length - removed))] : [])
    ]))
  }

  if (!candidates.length) {
    return m.reply(pluginUi.box('🧹 Inattivi', [
      pluginUi.row('✅', 'Stato:', `nessun membro inattivo da almeno ${days} giorni`)
    ]))
  }

  const rows = candidates.map((candidate, index) => {
    const date = new Date(candidate.lastActivity).toLocaleDateString('it-IT')
    return pluginUi.row('🧹', `${index + 1}.`, `+${candidate.phoneJid.split('@')[0]} - ultimo messaggio ${date}`)
  })
  return m.reply(pluginUi.box('🧹 Inattivi', [
    pluginUi.row('⏱️', 'Soglia:', `${days} giorni`),
    ...rows,
    pluginUi.row('ℹ️', 'Azione:', `.inattivi rimuovi ${days}`)
  ]))
}

export default definePlugin(inattivi, {
  name: 'group-inactive',
  command: ['inattivi', 'inattive'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Elenca o rimuove membri inattivi',
  icon: '🧹',
  order: 98,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
