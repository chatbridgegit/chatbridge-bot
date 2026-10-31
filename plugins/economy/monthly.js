import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, ensureUnityProfile, formatCoins, formatDuration, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function monthly(m) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'monthly', UNITY_CONFIG.cooldowns.monthly)
    if (wait) return m.reply(box('Monthly', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    setCooldown(profile, 'monthly')
    creditCoins(m.sender, UNITY_CONFIG.rewards.monthly, 'Monthly UnityLife')
    return m.reply(box('Monthly riscattato', [row('💠', 'Ricompensa:', `+${formatCoins(UNITY_CONFIG.rewards.monthly)} UC`), row('💳', 'Saldo:', `${formatCoins(profile.coins)} UC`)]))
  })
}

export default defineUnityLifePlugin(monthly, { name: 'unitylife-monthly', command: ['monthly', 'mensile'], category: 'economy', description: 'Ricompensa mensile', icon: '🌙', order: 22 })
