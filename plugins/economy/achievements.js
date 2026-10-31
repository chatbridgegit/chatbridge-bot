import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, achievementComplete, ensureUnityProfile, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function achievements(m) {
  const profile = ensureUnityProfile(m.sender)
  return m.reply(box('Achievement', UNITY_CONFIG.achievements.map(item => row(profile.achievements.includes(item.id) ? '🏆' : achievementComplete(profile, item) ? '✅' : '▫️', `${item.name} [${item.id}]`, `${item.description} | ${formatCoins(item.reward)} UC`))))
}

export default defineUnityLifePlugin(achievements, { name: 'unitylife-achievements', command: ['achievements', 'obiettivi'], category: 'economy', description: 'Mostra gli achievement disponibili', icon: '🏆', order: 42 })
