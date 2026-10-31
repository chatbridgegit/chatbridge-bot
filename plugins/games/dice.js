import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, debitCoins, ensureUnityProfile, formatCoins, formatDuration, gameWin, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function dice(m, extra) {
  const guess = Number(extra.args[0])
  const amount = Number(extra.args[1])
  if (!Number.isInteger(guess) || guess < 1 || guess > 6 || !amount) return m.reply(box('Dadi', [row('ℹ️', 'Uso:', '.dice <1-6> <puntata>')]))
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'game', UNITY_CONFIG.cooldowns.game)
    if (wait) return m.reply(box('Dadi', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    debitCoins(m.sender, amount, 'Puntata Dadi')
    const result = Math.floor(Math.random() * 6) + 1
    const win = result === guess
    setCooldown(profile, 'game')
    if (win) { creditCoins(m.sender, amount * 5, 'Vincita Dadi'); gameWin(profile) }
    return m.reply(box(win ? 'Dadi vinti' : 'Dadi', [row('🎲', 'Risultato:', `${result} | scelta ${guess}`), row(win ? '💠' : '💸', win ? 'Premio:' : 'Puntata:', `${formatCoins(win ? amount * 4 : amount)} UC`), row('💳', 'Saldo:', `${formatCoins(profile.coins)} UC`)]))
  })
}

export default defineUnityLifePlugin(dice, { name: 'unitylife-dice', command: ['dice', 'dadi'], category: 'games', description: 'Lancia i dadi virtuali', icon: '🎲', order: 11 })
