import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

function state() {
  const value = global.db.data.unityLife || (global.db.data.unityLife = {})
  if (!value.events) value.events = Object.fromEntries(UNITY_CONFIG.events.map(event => [event.id, false]))
  return value
}

async function events(m) {
  const data = state()
  const active = UNITY_CONFIG.events.filter(event => data.events[event.id])
  return m.reply(box('Eventi attivi', active.length ? active.map(event => row('🎉', event.name, `${event.description} | ${formatCoins(event.reward)} UC`)) : [row('🌙', 'Stato:', 'nessun evento attivo'), row('🛡️', 'Info:', '.event on <id> per amministratori')]))
}

export default defineUnityLifePlugin(events, { name: 'unitylife-events', command: ['events', 'eventi'], category: 'world', description: 'Mostra gli eventi attivi', icon: '🎉', order: 30 })
