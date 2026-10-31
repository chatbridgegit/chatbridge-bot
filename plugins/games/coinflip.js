import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, debitCoins, ensureUnityProfile, formatCoins, formatDuration, gameWin, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function coinflip(m, extra) {
  const choice = String(extra.args.find(value => /^(testa|croce|heads|tails)$/i.test(value)) || '').toLowerCase()
  const amount = Number(extra.args.find(value => /^\d+$/.test(value)))
  if (!choice || !amount) return m.reply(box('Testa o croce', [row('ℹ️', 'Uso:', '.coinflip testa <puntata>'), row('💠', 'Scelte:', 'testa | croce')]))
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const wait = cooldownRemaining(profile, 'game', UNITY_CONFIG.cooldowns.game)
    if (wait) return m.reply(box('Coinflip', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    debitCoins(m.sender, amount, 'Puntata Coinflip')
    const result = Math.random() < 0.5 ? 'testa' : 'croce'
    const selected = choice === 'testa' || choice === 'heads' ? 'testa' : 'croce'
    setCooldown(profile, 'game')
    if (result === selected) { creditCoins(m.sender, amount * 2, 'Vincita Coinflip'); gameWin(profile) }
    return m.reply(box(result === selected ? 'Coinflip vinto' : 'Coinflip', [row('🪙', 'Risultato:', `${result} | scelta ${selected}`), row(result === selected ? '💠' : '💸', result === selected ? 'Premio:' : 'Puntata:', `${formatCoins(result === selected ? amount : -amount)} UC`), row('💳', 'Saldo:', `${formatCoins(profile.coins)} UC`)]))
  })
}

export default defineUnityLifePlugin(coinflip, { name: 'unitylife-coinflip', command: ['coinflip', 'moneta'], category: 'games', description: 'Gioca a testa o croce con UC', icon: '🪙', order: 10 })
