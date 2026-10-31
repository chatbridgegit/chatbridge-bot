import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, formatCoins, gameWin, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function guess(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    if (!profile.activeGame || profile.activeGame.type !== 'guess') {
      profile.activeGame = { type: 'guess', expected: Math.floor(Math.random() * 10) + 1, createdAt: Date.now() }
      global.markDbDirty?.()
      return m.reply(box('Indovina il numero', [row('🎯', 'Range:', 'da 1 a 10'), row('⌨️', 'Rispondi:', `.${extra.command} <numero>`) ]))
    }
    const win = Number(extra.args[0]) === profile.activeGame.expected
    const expected = profile.activeGame.expected
    profile.activeGame = null
    if (win) { creditCoins(m.sender, 350, 'Vittoria Indovina'); gameWin(profile) }
    return m.reply(box(win ? 'Numero indovinato' : 'Numero errato', [row(win ? '✅' : '❌', 'Esito:', win ? '+350 UC' : `numero corretto: ${expected}`)]))
  })
}

export default defineUnityLifePlugin(guess, { name: 'unitylife-guess', command: ['guess', 'indovina'], category: 'games', description: 'Indovina il numero corretto', icon: '🎯', order: 22 })
