import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function vehicles(m) {
  const profile = ensureUnityProfile(m.sender)
  return m.reply(box('I miei veicoli', profile.vehicles.length ? profile.vehicles.map(vehicle => row('🚗', vehicle.name, `${formatCoins(vehicle.value)} UC | ${vehicle.category}`)) : [row('ℹ️', 'Stato:', 'garage vuoto'), row('💡', 'Catalogo:', '.dealership')]))
}

export default defineUnityLifePlugin(vehicles, { name: 'unitylife-vehicles', command: ['vehicles', 'veicoli'], category: 'world', description: 'Mostra i veicoli posseduti', icon: '🚗', order: 18 })
