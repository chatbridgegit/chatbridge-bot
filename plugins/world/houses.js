import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function houses(m) {
  return m.reply(box('Case disponibili', UNITY_CONFIG.houses.map(house => row('🏠', `${house.name} [${house.id}]`, `${formatCoins(house.price)} UC | +${formatCoins(house.income)} UC`))))
}

export default defineUnityLifePlugin(houses, { name: 'unitylife-houses', command: ['houses', 'case'], category: 'world', description: 'Mostra le case disponibili', icon: '🏘️', order: 15 })
