import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, ensureUnityProfile, formatCoins, missionProgress } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function mission(m, extra) {
  const profile = ensureUnityProfile(m.sender)
  const selected = UNITY_CONFIG.missions.find(item => item.id === extra.args[0])
  if (!selected) return m.reply(box('Missione', [row('ℹ️', 'Uso:', '.mission <id>')]))
  return m.reply(box('Dettagli missione', [row('🕵️', 'Missione:', selected.name), row('📋', 'Obiettivo:', selected.description), row('📈', 'Progressi:', `${missionProgress(profile, selected)}/${selected.target}`), row('💠', 'Premio:', `${formatCoins(selected.reward)} UC`), row('📅', 'Tipo:', selected.type)]))
}

export default defineUnityLifePlugin(mission, { name: 'unitylife-mission', command: ['mission', 'missione'], category: 'world', description: 'Mostra i dettagli di una missione', icon: '🕵️', order: 34 })
