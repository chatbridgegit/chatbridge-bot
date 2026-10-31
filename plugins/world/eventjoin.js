import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, creditCoins, formatCoins, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function eventjoin(m) {
  return withEconomyLock(() => {
    const state = global.db.data.unityLife || (global.db.data.unityLife = {})
    state.events = state.events || Object.fromEntries(UNITY_CONFIG.events.map(event => [event.id, false]))
    const selected = UNITY_CONFIG.events.find(event => state.events[event.id])
    if (!selected) return m.reply(box('Partecipa evento', [row('🌙', 'Stato:', 'nessun evento attivo')]))
    state.eventParticipants = state.eventParticipants || {}
    state.eventParticipants[selected.id] = state.eventParticipants[selected.id] || []
    if (state.eventParticipants[selected.id].includes(m.sender)) return m.reply(box('Partecipa evento', [row('ℹ️', 'Stato:', 'hai gia partecipato')]))
    state.eventParticipants[selected.id].push(m.sender)
    creditCoins(m.sender, selected.reward, `Evento ${selected.name}`)
    global.markDbDirty?.()
    return m.reply(box('Partecipazione registrata', [row('🎉', 'Evento:', selected.name), row('💠', 'Premio:', `+${formatCoins(selected.reward)} UC`)]))
  })
}

export default defineUnityLifePlugin(eventjoin, { name: 'unitylife-eventjoin', command: ['eventjoin', 'partecipaevento'], category: 'world', description: 'Partecipa a un evento attivo', icon: '🎟️', order: 32 })
