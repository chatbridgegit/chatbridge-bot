import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function garage(m) {
  const profile = ensureUnityProfile(m.sender)
  return m.reply(box('Garage', [row('🚘', 'Veicoli:', profile.vehicles.length), row('🏠', 'Posti utilizzati:', `${profile.vehicles.length}/10`), ...profile.vehicles.slice(0, 8).map(vehicle => row('▫️', vehicle.name, vehicle.category))]))
}

export default defineUnityLifePlugin(garage, { name: 'unitylife-garage', command: ['garage'], category: 'world', description: 'Mostra il garage personale', icon: '🅿️', order: 22 })
