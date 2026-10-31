import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { groupState } from '../../lib/group-moderation.js'

async function listabanword(m) {
  const words = groupState(m.chat).bannedWords
  if (!words.length) {
    return m.reply(pluginUi.box('📚 Banword', [
      pluginUi.row('✅', 'Stato:', 'nessuna parola vietata configurata')
    ]))
  }

  return m.reply(pluginUi.box('📚 Banword', [
    pluginUi.row('📊', 'Totale:', String(words.length)),
    ...words.map((word, index) => pluginUi.row('🚫', `${index + 1}.`, word))
  ]))
}

export default definePlugin(listabanword, {
  name: 'group-ban-word-list',
  command: ['listabanword', 'banwords'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Mostra le parole vietate del gruppo',
  icon: '📚',
  order: 97,
  permissions: { roles: ['mod', 'admin', 'owner'] }
}, { group: true })
