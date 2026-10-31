import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, debitCoins, ensureUnityProfile, formatCoins, formatDuration, gameWin, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function jackpot(m) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'game', UNITY_CONFIG.cooldowns.game)
    if (wait) return m.reply(box('Jackpot', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    const entry = 100
    debitCoins(m.sender, entry, 'Ingresso Jackpot')
    const state = global.db.data.unityLife
    state.jackpot = Math.max(10000, Number(state.jackpot || 10000) + entry)
    setCooldown(profile, 'game')
    if (Math.floor(Math.random() * 25) !== 0) return m.reply(box('Jackpot', [row('🎟️', 'Ingresso:', `${formatCoins(entry)} UC`), row('💰', 'Montepremi:', `${formatCoins(state.jackpot)} UC`), row('🍀', 'Esito:', 'non hai trovato il jackpot')]))
    const reward = state.jackpot
    state.jackpot = 10000
    creditCoins(m.sender, reward, 'Vincita Jackpot')
    gameWin(profile)
    return m.reply(box('Jackpot vinto', [row('🏆', 'Premio:', `+${formatCoins(reward)} UC`), row('🔄', 'Nuovo montepremi:', '10.000 UC')]))
  })
}

export default defineUnityLifePlugin(jackpot, { name: 'unitylife-jackpot', command: ['jackpot'], category: 'games', description: 'Partecipa al jackpot del server', icon: '💰', order: 15 })
