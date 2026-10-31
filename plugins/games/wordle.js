import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, gameWin, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))
const words = ['chatbridge', 'economia', 'cometa', 'futuro', 'codice', 'pianeta']

async function wordle(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    if (!profile.activeGame || profile.activeGame.type !== 'wordle') {
      const expected = words[Math.floor(Math.random() * words.length)]
      profile.activeGame = { type: 'wordle', expected, createdAt: Date.now() }
      global.markDbDirty?.()
      return m.reply(box('Wordle', [row('🔤', 'Parola:', `${expected.length} lettere`), row('⌨️', 'Rispondi:', `.${extra.command} <parola>`) ]))
    }
    const expected = profile.activeGame.expected
    const win = extra.args.join('').toLowerCase() === expected
    profile.activeGame = null
    if (win) { creditCoins(m.sender, 350, 'Vittoria Wordle'); gameWin(profile) }
    return m.reply(box(win ? 'Wordle completato' : 'Wordle', [row(win ? '✅' : '❌', 'Esito:', win ? '+350 UC' : `parola: ${expected}`)]))
  })
}

export default defineUnityLifePlugin(wordle, { name: 'unitylife-wordle', command: ['wordle', 'parola'], category: 'games', description: 'Mini-gioco giornaliero di parole', icon: '🔤', order: 25 })
