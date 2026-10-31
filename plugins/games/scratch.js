import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, debitCoins, ensureUnityProfile, formatCoins, formatDuration, gameWin, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function scratch(m, extra) {
  const amount = Number(extra.args[0])
  if (!amount) return m.reply(box('Gratta e vinci', [row('ℹ️', 'Uso:', '.scratch <puntata>')]))
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'game', UNITY_CONFIG.cooldowns.game)
    if (wait) return m.reply(box('Gratta e vinci', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    debitCoins(m.sender, amount, 'Puntata Scratch')
    const roll = Math.random()
    const multiplier = roll < 0.03 ? 10 : roll < 0.15 ? 4 : roll < 0.45 ? 2 : 0
    setCooldown(profile, 'game')
    if (multiplier) { creditCoins(m.sender, amount * multiplier, 'Vincita Scratch'); gameWin(profile) }
    return m.reply(box(multiplier ? 'Gratta vinto' : 'Gratta e vinci', [row('🎟️', 'Esito:', multiplier ? `hai trovato x${multiplier}` : 'nessun premio'), row(multiplier ? '💠' : '💸', multiplier ? 'Premio:' : 'Puntata:', `${formatCoins(multiplier ? amount * (multiplier - 1) : amount)} UC`)]))
  })
}

export default defineUnityLifePlugin(scratch, { name: 'unitylife-scratch', command: ['scratch', 'gratta'], category: 'games', description: 'Gratta e scopri una ricompensa', icon: '🎟️', order: 14 })
