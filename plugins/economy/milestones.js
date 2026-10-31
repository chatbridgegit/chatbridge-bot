import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins, netWorth } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function milestones(m) {
  const profile = ensureUnityProfile(m.sender)
  const total = netWorth(profile)
  return m.reply(box('Traguardi economici', [row(profile.streak >= 7 ? '✅' : '▫️', 'Daily 7:', `${profile.streak}/7`), row(profile.streak >= 30 ? '✅' : '▫️', 'Daily 30:', `${profile.streak}/30`), row(total >= 1000000 ? '✅' : '▫️', 'Patrimonio 1M:', `${formatCoins(total)}/1.000.000 UC`), row(profile.level >= 5 ? '✅' : '▫️', 'Livello lavoro 5:', `${profile.level}/5`)]))
}

export default defineUnityLifePlugin(milestones, { name: 'unitylife-milestones', command: ['milestones', 'traguardi'], category: 'economy', description: 'Mostra i traguardi economici', icon: '🎯', order: 27 })
