import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, debitCoins, ensureUnityProfile, formatCoins, gameWin, getUserLabel, targetUser, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function battle(m, extra) {
  const target = targetUser(m)
  const amount = Number(extra.args.find(value => /^\d+$/.test(value))) || 250
  if (!target || target === m.sender) return m.reply(box('Battaglia', [row('ℹ️', 'Uso:', '.battle @utente [premio UC]')]))
  return withEconomyLock(() => {
    debitCoins(m.sender, amount, 'Premio Battaglia')
    const winner = Math.random() < 0.5 ? m.sender : target
    creditCoins(winner, amount, 'Premio Battaglia')
    const profile = ensureUnityProfile(winner)
    profile.stats.pvpWins = (profile.stats.pvpWins || 0) + 1
    gameWin(profile)
    return m.reply(box('Battaglia conclusa', [row('🏆', 'Vincitore:', getUserLabel(winner)), row('🎁', 'Premio:', `${formatCoins(amount)} UC`), row('🛡️', 'Sconfitto:', getUserLabel(winner === m.sender ? target : m.sender))]))
  })
}

export default defineUnityLifePlugin(battle, { name: 'unitylife-battle', command: ['battle', 'battaglia'], category: 'games', description: 'Battaglia virtuale tra utenti', icon: '🛡️', order: 31 })
