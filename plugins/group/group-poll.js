import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { groupState, recordAction } from '../../lib/group-moderation.js'

async function sondaggio(m, extra) {
  const parts = String(extra.text || '')
    .split('|')
    .map(value => value.trim())
    .filter(Boolean)
  const question = parts.shift()
  const options = parts.slice(0, 12)

  if (!question || options.length < 2) {
    return m.reply(pluginUi.box('⚠️ Sondaggio', [
      pluginUi.row('ℹ️', 'Uso:', '.sondaggio domanda | opzione 1 | opzione 2'),
      pluginUi.row('ℹ️', 'Limite:', 'sono consentite da 2 a 12 opzioni')
    ]))
  }

  if (typeof this.sendPoll !== 'function') {
    return m.reply(pluginUi.box('⚠️ Sondaggio', [
      pluginUi.row('🚫', 'Stato:', 'funzione sondaggi non disponibile in questa versione')
    ]))
  }

  await this.sendPoll(m.chat, question, options.map(option => [option]))
  recordAction(groupState(m.chat), m.senderPn || m.sender, 'poll')
  return null
}

export default definePlugin(sondaggio, {
  name: 'group-poll',
  command: ['sondaggio', 'poll'],
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Crea un sondaggio nel gruppo',
  icon: '📊',
  order: 88,
  permissions: { roles: ['admin', 'owner'] }
}, { group: true })
