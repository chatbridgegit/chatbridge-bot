import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function dealership(m) {
  return m.reply(box('Concessionaria', UNITY_CONFIG.cars.map(car => row('🚗', `${car.name} [${car.id}]`, `${car.category} | ${formatCoins(car.price)} UC`))))
}

export default defineUnityLifePlugin(dealership, { name: 'unitylife-dealership', command: ['dealership', 'concessionaria'], category: 'world', description: 'Mostra la concessionaria', icon: '🚘', order: 19 })
