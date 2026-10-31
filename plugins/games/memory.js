import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, gameWin, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function memory(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    if (!profile.activeGame || profile.activeGame.type !== 'memory') {
      const sequence = String(Math.floor(100 + Math.random() * 900))
      profile.activeGame = { type: 'memory', expected: sequence, createdAt: Date.now() }
      global.markDbDirty?.()
      return m.reply(box('Memoria', [row('🧩', 'Sequenza:', sequence), row('⌨️', 'Rispondi:', `.${extra.command} <sequenza>`) ]))
    }
    const win = extra.args.join('') === profile.activeGame.expected
    profile.activeGame = null
    if (win) { creditCoins(m.sender, 350, 'Vittoria Memoria'); gameWin(profile) }
    return m.reply(box(win ? 'Memoria superata' : 'Memoria errata', [row(win ? '✅' : '❌', 'Esito:', win ? '+350 UC' : 'sequenza non corretta')]))
  })
}

export default defineUnityLifePlugin(memory, { name: 'unitylife-memory', command: ['memory', 'memoria'], category: 'games', description: 'Metti alla prova la memoria', icon: '🧩', order: 23 })
