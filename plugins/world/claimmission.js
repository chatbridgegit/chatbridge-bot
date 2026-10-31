import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, creditCoins, ensureUnityProfile, formatCoins, isMissionClaimed, missionClaimKey, missionProgress, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function claimmission(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const mission = UNITY_CONFIG.missions.find(item => item.id === extra.args[0])
    if (!mission) return m.reply(box('Riscatta missione', [row('ℹ️', 'Uso:', '.claimmission <id>')]))
    if (isMissionClaimed(profile, mission)) return m.reply(box('Riscatta missione', [row('ℹ️', 'Stato:', 'missione gia riscattata')]))
    if (missionProgress(profile, mission) < mission.target) return m.reply(box('Riscatta missione', [row('🔒', 'Stato:', 'obiettivo non completato'), row('📈', 'Progressi:', `${missionProgress(profile, mission)}/${mission.target}`)]))
    profile.missions.push(missionClaimKey(mission))
    creditCoins(m.sender, mission.reward, `Missione ${mission.name}`)
    return m.reply(box('Missione riscattata', [row('✅', 'Missione:', mission.name), row('💠', 'Premio:', `+${formatCoins(mission.reward)} UC`)]))
  })
}

export default defineUnityLifePlugin(claimmission, { name: 'unitylife-claimmission', command: ['claimmission', 'riscattamissione'], category: 'world', description: 'Riscatta una missione completata', icon: '✅', order: 35 })
