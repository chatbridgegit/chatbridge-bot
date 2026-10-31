import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, formatCoins, gameWin, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))
const questions = [{ question: 'Quale linguaggio usa Node.js?', options: ['Python', 'JavaScript', 'Ruby'], answer: 2 }, { question: 'Quanti lati ha un esagono?', options: ['5', '6', '8'], answer: 2 }, { question: 'Quale pianeta e rosso?', options: ['Marte', 'Venere', 'Giove'], answer: 1 }]

async function trivia(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const answer = extra.args.join(' ').trim()
    if (!profile.activeGame || profile.activeGame.type !== 'trivia') {
      const item = questions[Math.floor(Math.random() * questions.length)]
      profile.activeGame = { type: 'trivia', ...item, createdAt: Date.now() }
      global.markDbDirty?.()
      return m.reply(box('Quiz', [row('❓', 'Domanda:', item.question), ...item.options.map((option, index) => row(`${index + 1}.`, 'Risposta:', option)), row('⌨️', 'Rispondi:', `.${extra.command} <numero>`) ]))
    }
    const game = profile.activeGame
    profile.activeGame = null
    const win = Number(answer) === game.answer
    if (win) { creditCoins(m.sender, 500, 'Vittoria Quiz'); gameWin(profile); profile.stats.quizWins++ }
    return m.reply(box(win ? 'Risposta corretta' : 'Risposta errata', [row(win ? '✅' : '❌', 'Esito:', win ? 'corretto' : `risposta: ${game.answer}`), ...(win ? [row('💠', 'Premio:', '+500 UC')] : [])]))
  })
}

export default defineUnityLifePlugin(trivia, { name: 'unitylife-trivia', command: ['trivia', 'quiz'], category: 'games', description: 'Quiz a risposta multipla con premi UC', icon: '🧠', order: 20 })
