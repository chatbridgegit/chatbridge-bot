import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins, getUserLabel, netWorth } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function richest(m) {
  const users = Object.keys(global.db.data.users || {}).map(id => ({ id, profile: ensureUnityProfile(id) })).sort((left, right) => netWorth(right.profile) - netWorth(left.profile)).slice(0, 10)
  return m.reply(box('Classifica patrimonio', users.length ? users.map((entry, index) => row(index < 3 ? ['🥇', '🥈', '🥉'][index] : '▫️', `${index + 1}. ${getUserLabel(entry.id)}`, `${formatCoins(netWorth(entry.profile))} UC`)) : [row('ℹ️', 'Stato:', 'classifica vuota')]))
}

export default defineUnityLifePlugin(richest, { name: 'unitylife-richest', command: ['richest', 'ricchi'], category: 'economy', description: 'Classifica dei patrimoni maggiori', icon: '🏆', order: 19 })
