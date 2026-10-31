import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, ensureUnityProfile, formatCoins, formatDuration, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function daily(m) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'daily', UNITY_CONFIG.cooldowns.daily)
    if (wait) return m.reply(box('Daily', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    profile.streak = Date.now() - profile.lastDaily <= 2 * UNITY_CONFIG.cooldowns.daily ? profile.streak + 1 : 1
    profile.lastDaily = Date.now()
    profile.stats.dailyClaims++
    setCooldown(profile, 'daily')
    const amount = UNITY_CONFIG.rewards.daily + Math.min(profile.streak * 25, 750)
    creditCoins(m.sender, amount, 'Daily UnityLife')
    return m.reply(box('Daily riscattato', [row('💠', 'Ricompensa:', `+${formatCoins(amount)} UC`), row('🔥', 'Serie:', `${profile.streak} giorni`), row('💳', 'Saldo:', `${formatCoins(profile.coins)} UC`)]))
  })
}

export default defineUnityLifePlugin(daily, { name: 'unitylife-daily', command: ['daily', 'giornaliero'], category: 'economy', description: 'Ricompensa giornaliera', icon: '📅', order: 20 })
