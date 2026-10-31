import { definePlugin } from '../../lib/plugin-utils.js'

async function ghostjid(m) {
  const caller = m.key?.participant
  if (!caller || !m.key?.remoteJid) {
    return m.reply('❌ Non riesco a identificare chi ha invocato il comando.')
  }

  if (typeof this.sendMessage !== 'function') {
    return m.reply('❌ Invio dei messaggi ghost non disponibile.')
  }

  return this.sendMessage(m.key.remoteJid, {
    text: 'questo messaggio dovrebbe essere visibile solo a te.'
  }, {
    ghostJid: caller
  })
}

export default definePlugin(ghostjid, {
  name: 'ghost-jid-test',
  command: ['ghostjid'],
  customPrefix: /^\./,
  category: 'beta',
  target: 'group',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Invia una risposta di prova visibile solo a chi usa il comando',
  icon: '👻',
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
}, { group: true })
