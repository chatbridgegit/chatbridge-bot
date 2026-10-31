import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, ensureUnityProfile, formatCoins, isMissionClaimed, missionProgress } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function missions(m, extra) {
  const profile = ensureUnityProfile(m.sender)
  const selected = UNITY_CONFIG.missions.find(item => item.id === extra.args[0])
  if (selected) return m.reply(box('Dettagli missione', [row('🕵️', 'Missione:', selected.name), row('📋', 'Obiettivo:', selected.description), row('📈', 'Progressi:', `${missionProgress(profile, selected)}/${selected.target}`), row('💠', 'Premio:', `${formatCoins(selected.reward)} UC`), row('📅', 'Tipo:', selected.type)]))
  return m.reply(box('Missioni UnityLife', UNITY_CONFIG.missions.map(item => row(isMissionClaimed(profile, item) ? '🏆' : '▫️', `${item.name} [${item.id}]`, `${missionProgress(profile, item)}/${item.target} | ${formatCoins(item.reward)} UC`))))
}

export default defineUnityLifePlugin(missions, { name: 'unitylife-missions', command: ['missions', 'missioni'], category: 'world', description: 'Mostra missioni e progressi', icon: '🕵️', order: 33 })
