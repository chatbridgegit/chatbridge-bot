import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function calendar(m) {
  return m.reply(box('Calendario ricompense', [row('📅', 'Daily:', `${formatCoins(UNITY_CONFIG.rewards.daily)} UC + serie`), row('🗓️', 'Weekly:', `${formatCoins(UNITY_CONFIG.rewards.weekly)} UC`), row('🌙', 'Monthly:', `${formatCoins(UNITY_CONFIG.rewards.monthly)} UC`), row('🎁', 'Bonus:', `${formatCoins(UNITY_CONFIG.rewards.bonusMin)}-${formatCoins(UNITY_CONFIG.rewards.bonusMax)} UC`), row('✅', 'Check-in:', `${formatCoins(UNITY_CONFIG.rewards.checkin)} UC`)]))
}

export default defineUnityLifePlugin(calendar, { name: 'unitylife-calendar', command: ['calendar', 'calendario'], category: 'economy', description: 'Mostra il calendario premi', icon: '🗓️', order: 26 })
