import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, formatCoins, gameWin, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function math(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    if (!profile.activeGame || profile.activeGame.type !== 'math') {
      const a = Math.floor(Math.random() * 20) + 5
      const b = Math.floor(Math.random() * 12) + 2
      profile.activeGame = { type: 'math', expected: a + b, createdAt: Date.now() }
      global.markDbDirty?.()
      return m.reply(box('Matematica', [row('🧠', 'Calcolo:', `${a} + ${b} = ?`), row('⌨️', 'Rispondi:', `.${extra.command} <risultato>`) ]))
    }
    const win = Number(extra.args[0]) === profile.activeGame.expected
    profile.activeGame = null
    if (win) { creditCoins(m.sender, 350, 'Vittoria Matematica'); gameWin(profile) }
    return m.reply(box(win ? 'Calcolo corretto' : 'Calcolo errato', [row(win ? '✅' : '❌', 'Esito:', win ? '+350 UC' : 'riprova con un nuovo calcolo')]))
  })
}

export default defineUnityLifePlugin(math, { name: 'unitylife-math', command: ['math', 'matematica'], category: 'games', description: 'Risolvi un calcolo rapidamente', icon: '➗', order: 21 })
