import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, gameWin, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function typing(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const phrase = 'unitylife premia la costanza'
    if (!profile.activeGame || profile.activeGame.type !== 'typing') {
      profile.activeGame = { type: 'typing', expected: phrase, createdAt: Date.now() }
      global.markDbDirty?.()
      return m.reply(box('Digitazione', [row('⌨️', 'Frase:', phrase), row('ℹ️', 'Rispondi:', `.${extra.command} ${phrase}`) ]))
    }
    const win = extra.args.join(' ').toLowerCase() === phrase
    profile.activeGame = null
    if (win) { creditCoins(m.sender, 350, 'Vittoria Digitazione'); gameWin(profile) }
    return m.reply(box(win ? 'Digitazione superata' : 'Digitazione', [row(win ? '✅' : '❌', 'Esito:', win ? '+350 UC' : 'testo non corretto')]))
  })
}

export default defineUnityLifePlugin(typing, { name: 'unitylife-typing', command: ['typing', 'digitazione'], category: 'games', description: 'Test di velocita nella digitazione', icon: '⌨️', order: 27 })
