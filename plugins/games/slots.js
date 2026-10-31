import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, debitCoins, ensureUnityProfile, formatCoins, formatDuration, gameWin, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))
const MAX_SLOT_BET = 5000

async function slots(m, extra) {
  const amount = Number(extra.args[0])
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_SLOT_BET) {
    return m.reply(box('Slot virtuali', [
      row('ℹ️', 'Uso:', '.slots <puntata>'),
      row('💰', 'Limite:', `puntata da 1 a ${MAX_SLOT_BET} UC`)
    ]))
  }
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'game', UNITY_CONFIG.cooldowns.game)
    if (wait) return m.reply(box('Slot virtuali', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    debitCoins(m.sender, amount, 'Puntata Slot')
    const symbols = ['🍒', '🍋', '🔔', '💎', '⭐']
    const result = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)])
    const same = result.every(symbol => symbol === result[0])
    const pair = new Set(result).size === 2
    const multiplier = same ? (result[0] === '💎' ? 12 : 6) : pair ? 2 : 0
    setCooldown(profile, 'game')
    if (multiplier) { creditCoins(m.sender, amount * multiplier, 'Vincita Slot'); gameWin(profile) }
    return m.reply(box(multiplier ? 'Slot vinti' : 'Slot', [row('🎰', 'Risultato:', result.join(' | ')), row(multiplier ? '💠' : '💸', multiplier ? 'Premio:' : 'Puntata:', `${formatCoins(multiplier ? amount * (multiplier - 1) : amount)} UC`), row('💳', 'Saldo:', `${formatCoins(profile.coins)} UC`)]))
  })
}

export default defineUnityLifePlugin(slots, { name: 'unitylife-slots', command: ['slots', 'slot'], category: 'games', description: 'Slot mini-game con UC virtuali', icon: '🎰', order: 13 })
