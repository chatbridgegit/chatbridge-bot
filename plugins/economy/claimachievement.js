import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, achievementComplete, creditCoins, ensureUnityProfile, formatCoins, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function claimAchievement(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const achievement = UNITY_CONFIG.achievements.find(item => item.id === extra.args[0])
    if (!achievement) return m.reply(box('Achievement', [row('ℹ️', 'Uso:', '.claimachievement <id>')]))
    if (profile.achievements.includes(achievement.id)) return m.reply(box('Achievement', [row('ℹ️', 'Stato:', 'ricompensa gia riscattata')]))
    if (!achievementComplete(profile, achievement)) return m.reply(box('Achievement', [row('🔒', 'Stato:', 'obiettivo non completato')]))
    profile.achievements.push(achievement.id)
    creditCoins(m.sender, achievement.reward, `Achievement ${achievement.name}`)
    return m.reply(box('Achievement riscattato', [row('🏆', 'Obiettivo:', achievement.name), row('💠', 'Premio:', `+${formatCoins(achievement.reward)} UC`)]))
  })
}

export default defineUnityLifePlugin(claimAchievement, { name: 'unitylife-claimachievement', command: ['claimachievement', 'riscattaobiettivo'], category: 'economy', description: 'Riscatta un achievement completato', icon: '🎖️', order: 43 })
