import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, ensureUnityProfile, formatCoins, formatDuration, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function checkin(m) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'checkin', UNITY_CONFIG.cooldowns.checkin)
    if (wait) return m.reply(box('Presenza', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    setCooldown(profile, 'checkin')
    creditCoins(m.sender, UNITY_CONFIG.rewards.checkin, 'Presenza giornaliera')
    return m.reply(box('Presenza registrata', [row('✅', 'Premio:', `+${formatCoins(UNITY_CONFIG.rewards.checkin)} UC`), row('💳', 'Saldo:', `${formatCoins(profile.coins)} UC`)]))
  })
}

export default defineUnityLifePlugin(checkin, { name: 'unitylife-checkin', command: ['checkin', 'presenza'], category: 'economy', description: 'Registra la presenza giornaliera', icon: '✅', order: 25 })
