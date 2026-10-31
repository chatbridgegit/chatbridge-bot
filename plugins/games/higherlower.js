import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, debitCoins, ensureUnityProfile, formatCoins, formatDuration, gameWin, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function higherlower(m, extra) {
  const choice = String(extra.args[0] || '').toLowerCase()
  const amount = Number(extra.args[1])
  if (!['higher', 'lower', 'maggiore', 'minore'].includes(choice) || !amount) return m.reply(box('Higher or Lower', [row('ℹ️', 'Uso:', '.higherlower maggiore <puntata>')]))
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'game', UNITY_CONFIG.cooldowns.game)
    if (wait) return m.reply(box('Higher or Lower', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    debitCoins(m.sender, amount, 'Puntata Higher Lower')
    const current = Math.floor(Math.random() * 100) + 1
    const next = Math.floor(Math.random() * 100) + 1
    const higher = choice === 'higher' || choice === 'maggiore'
    const win = higher ? next > current : next < current
    setCooldown(profile, 'game')
    if (win) { creditCoins(m.sender, amount * 2, 'Vincita Higher Lower'); gameWin(profile) }
    return m.reply(box(win ? 'Higher or Lower vinto' : 'Higher or Lower', [row('🔢', 'Numeri:', `${current} -> ${next}`), row('🎯', 'Scelta:', higher ? 'maggiore' : 'minore'), row(win ? '💠' : '💸', win ? 'Premio:' : 'Puntata:', `${formatCoins(win ? amount : amount)} UC`)]))
  })
}

export default defineUnityLifePlugin(higherlower, { name: 'unitylife-higherlower', command: ['higherlower', 'maggiorminore'], category: 'games', description: 'Indovina il prossimo numero', icon: '🔼', order: 12 })
