import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, ensureUnityProfile, formatCoins, formatDuration, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function weekly(m) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'weekly', UNITY_CONFIG.cooldowns.weekly)
    if (wait) return m.reply(box('Weekly', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    setCooldown(profile, 'weekly')
    creditCoins(m.sender, UNITY_CONFIG.rewards.weekly, 'Weekly UnityLife')
    return m.reply(box('Weekly riscattato', [row('💠', 'Ricompensa:', `+${formatCoins(UNITY_CONFIG.rewards.weekly)} UC`), row('💳', 'Saldo:', `${formatCoins(profile.coins)} UC`)]))
  })
}

export default defineUnityLifePlugin(weekly, { name: 'unitylife-weekly', command: ['weekly', 'settimanale'], category: 'economy', description: 'Ricompensa settimanale', icon: '🗓️', order: 21 })
