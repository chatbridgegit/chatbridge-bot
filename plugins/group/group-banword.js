import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { groupState, recordAction } from '../../lib/group-moderation.js'

async function banword(m, extra) {
  const word = String(extra.text || '').trim().toLocaleLowerCase('it-IT')
  if (word.length < 2 || word.length > 100) {
    return m.reply(pluginUi.box('⚠️ Banword', [
      pluginUi.row('ℹ️', 'Uso:', '.banword <parola o frase>'),
      pluginUi.row('ℹ️', 'Limite:', 'la parola o frase deve avere da 2 a 100 caratteri')
    ]))
  }

  const chat = groupState(m.chat)
  if (chat.bannedWords.includes(word)) {
    return m.reply(pluginUi.box('⚠️ Banword', [
      pluginUi.row('ℹ️', 'Stato:', 'parola già presente nella lista')
    ]))
  }

  if (chat.bannedWords.length >= 100) {
    return m.reply(pluginUi.box('⚠️ Banword', [
      pluginUi.row('🚫', 'Stato:', 'limite massimo di 100 parole o frasi raggiunto')
    ]))
  }

  chat.bannedWords.push(word)
  recordAction(chat, m.senderPn || m.sender, 'banword')
  return m.reply(pluginUi.box('🚫 Banword', [
    pluginUi.row('✅', 'Stato:', 'parola aggiunta alla lista'),
    pluginUi.row('🚫', 'Parola:', word)
  ]))
}

export default definePlugin(banword, {
  name: 'group-ban-word',
  command: ['banword', 'parolavietata'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Aggiunge una parola al filtro del gruppo',
  icon: '🚫',
  order: 95,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
