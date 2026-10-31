import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, ensureUnityProfile, formatCoins, formatDuration, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function bonus(m) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'bonus', UNITY_CONFIG.cooldowns.bonus)
    if (wait) return m.reply(box('Bonus', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    setCooldown(profile, 'bonus')
    const amount = Math.floor(Math.random() * (UNITY_CONFIG.rewards.bonusMax - UNITY_CONFIG.rewards.bonusMin + 1)) + UNITY_CONFIG.rewards.bonusMin
    creditCoins(m.sender, amount, 'Bonus UnityLife')
    return m.reply(box('Bonus riscattato', [row('🎁', 'Ricompensa:', `+${formatCoins(amount)} UC`), row('💳', 'Saldo:', `${formatCoins(profile.coins)} UC`)]))
  })
}

export default defineUnityLifePlugin(bonus, { name: 'unitylife-bonus', command: ['bonus'], category: 'economy', description: 'Bonus UC periodico', icon: '🎁', order: 24 })
