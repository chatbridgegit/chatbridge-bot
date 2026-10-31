import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

const words = ['banana', 'computer', 'scuola', 'gatto', 'luna', 'robot', 'cioccolato']
const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value = '') => pluginUi.row(icon, label, value)

function hangman(m, { args, command }) {
  const games = this.impiccato || (this.impiccato = {})
  const roomId = m.chat

  if (command === 'impiccato') {
    if (games[roomId]) {
      return m.reply(box('Impiccato', [row('🎯', 'Partita:', 'È già in corso in questo gruppo.')]))
    }

    const word = words[Math.floor(Math.random() * words.length)]
    games[roomId] = {
      word,
      hidden: '■'.repeat(word.length),
      errors: 0,
      guesses: []
    }

    return m.reply(box('Impiccato iniziato', [
      row('🔤', 'Parola:', `${word.length} lettere`),
      row('⌨️', 'Tentativo:', '.lettera <lettera>'),
      row('❗', 'Errori massimi:', '6')
    ]))
  }

  const game = games[roomId]
  if (!game) {
    return m.reply(box('Impiccato', [row('ℹ️', 'Partita:', 'Nessuna partita attiva. Avvia con .impiccato')]))
  }

  if (command === 'stopimpiccato') {
    delete games[roomId]
    return m.reply(box('Impiccato', [row('🛑', 'Partita:', 'Terminata.')]))
  }

  const letter = String(args[0] || '').toLowerCase()
  if (!/^[a-z]$/.test(letter)) {
    return m.reply(box('Impiccato', [row('ℹ️', 'Uso:', '.lettera <singola lettera>')]))
  }
  if (game.guesses.includes(letter)) {
    return m.reply(box('Impiccato', [row('⛔', 'Tentativo:', 'Questa lettera è già stata provata.')]))
  }

  game.guesses.push(letter)
  if (game.word.includes(letter)) {
    game.hidden = [...game.word]
      .map((character, index) => character === letter ? letter : game.hidden[index])
      .join('')

    if (game.hidden === game.word) {
      delete games[roomId]
      return m.reply(box('Impiccato vinto', [row('🎉', 'Parola:', game.word)]))
    }

    return m.reply(box('Impiccato', [
      row('✅', 'Parola:', game.hidden),
      row('🔠', 'Tentativi:', game.guesses.join(', ')),
      row('❌', 'Errori:', `${game.errors}/6`)
    ]))
  }

  game.errors += 1
  if (game.errors >= 6) {
    delete games[roomId]
    return m.reply(box('Impiccato perso', [
      row('💀', 'Parola:', game.word),
      row('❌', 'Errori:', '6/6')
    ]))
  }

  return m.reply(box('Impiccato', [
    row('❌', 'Parola:', game.hidden),
    row('🔠', 'Tentativi:', game.guesses.join(', ')),
    row('⚠️', 'Errori:', `${game.errors}/6`)
  ]))
}

export default definePlugin(hangman, {
  name: 'fun-impiccato',
  command: ['impiccato', 'lettera', 'stopimpiccato'],
  category: 'fun',
  target: 'group',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Gioca all’impiccato con il gruppo',
  icon: '🎯',
  order: 1,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
}, { group: true })
