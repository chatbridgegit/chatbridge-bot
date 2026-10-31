import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, gameWin, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))
const words = ['chatbridge', 'economia', 'cometa', 'futuro', 'codice', 'pianeta']

async function anagram(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    if (!profile.activeGame || profile.activeGame.type !== 'anagram') {
      const expected = words[Math.floor(Math.random() * words.length)]
      const scrambled = expected.split('').sort(() => Math.random() - 0.5).join('')
      profile.activeGame = { type: 'anagram', expected, createdAt: Date.now() }
      global.markDbDirty?.()
      return m.reply(box('Anagramma', [row('🔡', 'Sequenza:', scrambled), row('⌨️', 'Rispondi:', `.${extra.command} <parola>`) ]))
    }
    const expected = profile.activeGame.expected
    const win = extra.args.join('').toLowerCase() === expected
    profile.activeGame = null
    if (win) { creditCoins(m.sender, 350, 'Vittoria Anagramma'); gameWin(profile) }
    return m.reply(box(win ? 'Anagramma risolto' : 'Anagramma', [row(win ? '✅' : '❌', 'Esito:', win ? '+350 UC' : `parola: ${expected}`)]))
  })
}

export default defineUnityLifePlugin(anagram, { name: 'unitylife-anagram', command: ['anagram', 'anagramma'], category: 'games', description: 'Risolvi un anagramma', icon: '🔡', order: 26 })
