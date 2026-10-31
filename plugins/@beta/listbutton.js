import { definePlugin } from '../../lib/plugin-utils.js'

async function listbutton(m) {
  const sections = [{
    title: 'Opzioni',
    rows: [{
      title: 'Prima opzione',
      rowId: 'list-option-1'
    }, {
      title: 'Seconda opzione',
      rowId: 'list-option-2',
      description: 'Riga con descrizione'
    }]
  }]

  // Il payload protobuf completo evita che i client iOS scartino il messaggio.
  const nativeListSender = typeof this.sendNCarousel === 'function'
    ? this.sendNCarousel
    : typeof this.sendButton === 'function'
      ? this.sendButton
      : null

  if (m.isGroup && nativeListSender) {
    const nativeSections = sections.map(section => ({
      ...section,
      rows: section.rows.map(row => ({
        title: row.title,
        id: row.rowId,
        ...(row.description ? { description: row.description } : {})
      }))
    }))

    return nativeListSender(
      m.chat,
      'Seleziona una voce dalla lista.',
      'Test iOS / Android / gruppi',
      null,
      [],
      null,
      [],
      [['Apri lista', nativeSections]],
      m
    )
  }

  if (typeof this.sendMessage !== 'function') {
    return m.reply('❌ Invio delle liste non disponibile.')
  }

  return this.sendMessage(m.chat, {
    text: 'Seleziona una voce dalla lista.',
    footer: 'Test iOS / Android',
    title: 'Lista di prova',
    buttonText: 'Apri lista',
    sections
  })
}

export default definePlugin(listbutton, {
  name: 'list-button-test',
  command: ['listbutton'],
  customPrefix: /^\./,
  category: 'beta',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Invia una lista compatibile con iOS, Android e gruppi',
  icon: '📋',
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
