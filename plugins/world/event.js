import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, eventById, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

function state() {
  const value = global.db.data.unityLife || (global.db.data.unityLife = {})
  if (!value.events) value.events = Object.fromEntries(UNITY_CONFIG.events.map(event => [event.id, false]))
  return value
}

async function event(m, extra) {
  const data = state()
  if (['on', 'off'].includes(extra.args[0]) && (extra.isAdmin || extra.isOwner || extra.isROwner)) {
    const selected = eventById(extra.args[1])
    if (!selected) return m.reply(box('Gestione eventi', [row('ℹ️', 'Uso:', '.event on|off <id>')]))
    data.events[selected.id] = extra.args[0] === 'on'
    global.markDbDirty?.()
    return m.reply(box('Gestione eventi', [row(data.events[selected.id] ? '✅' : '⛔', selected.name, data.events[selected.id] ? 'attivato' : 'disattivato')]))
  }
  const selected = eventById(extra.args[0])
  if (!selected) return m.reply(box('Eventi attivi', [row('ℹ️', 'Uso:', '.events')]))
  return m.reply(box('Dettagli evento', [row(data.events[selected.id] ? '✅' : '⛔', 'Stato:', data.events[selected.id] ? 'attivo' : 'disattivo'), row('🎉', 'Evento:', selected.name), row('💠', 'Premio:', `${formatCoins(selected.reward)} UC`)]))
}

export default defineUnityLifePlugin(event, { name: 'unitylife-event', command: ['event', 'evento'], category: 'world', description: 'Mostra o configura un evento', icon: '⚙️', order: 31 })
