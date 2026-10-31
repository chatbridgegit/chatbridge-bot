import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, gameWin, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function reaction(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    if (!profile.activeGame || profile.activeGame.type !== 'reaction') {
      profile.activeGame = { type: 'reaction', startedAt: Date.now(), createdAt: Date.now() }
      global.markDbDirty?.()
      return m.reply(box('Reazione', [row('⚡', 'Pronto:', 'invia di nuovo il comando appena puoi'), row('⌨️', 'Comando:', `.${extra.command}`)]))
    }
    const elapsed = Date.now() - profile.activeGame.startedAt
    profile.activeGame = null
    const win = elapsed >= 250 && elapsed < 30000
    if (win) { creditCoins(m.sender, 400, 'Vittoria Reazione'); gameWin(profile) }
    return m.reply(box(win ? 'Reazione superata' : 'Reazione fallita', [row('⚡', 'Tempo:', `${(elapsed / 1000).toFixed(2)}s`), ...(win ? [row('💠', 'Premio:', '+400 UC')] : [])]))
  })
}

export default defineUnityLifePlugin(reaction, { name: 'unitylife-reaction', command: ['reaction', 'reazione'], category: 'games', description: 'Testa la velocita di reazione', icon: '⚡', order: 24 })
