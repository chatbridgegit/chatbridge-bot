import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, debitCoins, ensureUnityProfile, formatCoins, gameWin, getUserLabel, targetUser, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function duel(m, extra) {
  const target = targetUser(m)
  const amount = Number(extra.args.find(value => /^\d+$/.test(value))) || 100
  if (!target || target === m.sender) return m.reply(box('Duello', [row('ℹ️', 'Uso:', '.duel @utente [premio UC]')]))
  return withEconomyLock(() => {
    debitCoins(m.sender, amount, 'Premio Duello')
    const winner = Math.random() < 0.5 ? m.sender : target
    creditCoins(winner, amount, 'Premio Duello')
    const profile = ensureUnityProfile(winner)
    profile.stats.pvpWins = (profile.stats.pvpWins || 0) + 1
    gameWin(profile)
    return m.reply(box('Duello concluso', [row('🏆', 'Vincitore:', getUserLabel(winner)), row('🎁', 'Premio:', `${formatCoins(amount)} UC`), row('⚔️', 'Avversario:', getUserLabel(winner === m.sender ? target : m.sender))]))
  })
}

export default defineUnityLifePlugin(duel, { name: 'unitylife-duel', command: ['duel', 'duello'], category: 'games', description: 'Sfida direttamente un altro utente', icon: '⚔️', order: 30 })
