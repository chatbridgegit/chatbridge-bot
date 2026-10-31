import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function businesses(m) {
  return m.reply(box('Attivita disponibili', UNITY_CONFIG.businessTypes.map(item => row('🏢', item.name, `${formatCoins(item.price)} UC | +${formatCoins(item.income)} UC`))))
}

export default defineUnityLifePlugin(businesses, { name: 'unitylife-businesses', command: ['businesses'], category: 'economy', description: 'Mostra le attivita disponibili', icon: '🏢', order: 34 })
