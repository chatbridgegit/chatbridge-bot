import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { formatCoins, getUserLabel, targetUser, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function challenge(m, extra) {
  const target = targetUser(m)
  const amount = Number(extra.args.find(value => /^\d+$/.test(value))) || 100
  if (!target || target === m.sender) return m.reply(box('Sfida', [row('ℹ️', 'Uso:', '.challenge @utente [premio UC]')]))
  return withEconomyLock(() => {
    const state = global.db.data.unityLife
    state.challenges = Array.isArray(state.challenges) ? state.challenges : []
    state.challenges.unshift({ from: m.sender, to: target, amount, at: Date.now(), status: 'pending' })
    state.challenges = state.challenges.slice(0, 100)
    global.markDbDirty?.()
    return m.reply(box('Sfida inviata', [row('⚔️', 'Avversario:', getUserLabel(target)), row('🎁', 'Premio:', `${formatCoins(amount)} UC`), row('ℹ️', 'Durata:', '10 minuti')]))
  })
}

export default defineUnityLifePlugin(challenge, { name: 'unitylife-challenge', command: ['challenge', 'sfida'], category: 'games', description: 'Invia una sfida a un utente', icon: '📣', order: 33 })
