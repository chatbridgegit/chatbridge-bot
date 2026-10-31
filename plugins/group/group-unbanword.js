import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { groupState, recordAction } from '../../lib/group-moderation.js'

async function unbanword(m, extra) {
  const word = String(extra.text || '').trim().toLocaleLowerCase('it-IT')
  const chat = groupState(m.chat)
  const index = chat.bannedWords.indexOf(word)
  if (!word || index === -1) {
    return m.reply(pluginUi.box('⚠️ Unbanword', [
      pluginUi.row('ℹ️', 'Uso:', '.unbanword <parola o frase>'),
      pluginUi.row('ℹ️', 'Stato:', 'parola non presente nella lista')
    ]))
  }

  chat.bannedWords.splice(index, 1)
  recordAction(chat, m.senderPn || m.sender, 'unbanword')
  return m.reply(pluginUi.box('✅ Unbanword', [
    pluginUi.row('✅', 'Stato:', 'parola rimossa dalla lista'),
    pluginUi.row('🚫', 'Parola:', word)
  ]))
}

export default definePlugin(unbanword, {
  name: 'group-unban-word',
  command: ['unbanword', 'rimuoviparola'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Rimuove una parola dal filtro del gruppo',
  icon: '✅',
  order: 96,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
