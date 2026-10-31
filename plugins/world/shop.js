import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function shop(m) {
  return m.reply(box('UnityLife Shop', UNITY_CONFIG.items.map(item => row('🛒', `${item.name} [${item.id}]`, `${item.type} | ${formatCoins(item.price)} UC`))))
}

export default defineUnityLifePlugin(shop, { name: 'unitylife-shop', command: ['shop', 'negozio'], category: 'world', description: 'Apre lo shop UnityLife', icon: '🛒', order: 23 })
