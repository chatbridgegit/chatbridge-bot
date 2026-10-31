import { definePlugin } from '../../lib/plugin-utils.js'

const messages = {
  'richieste.invalidNumber': 'Inserisci un numero maggiore di zero.',
  'richieste.acceptedSuccess': '✅ Accettate {count} richieste di ingresso.',
  'richieste.errorAccepting': '❌ Errore durante l\'accettazione delle richieste.',
  'richieste.accepted39Success': '✅ Accettate {count} richieste da numeri italiani.',
  'richieste.no39Found': 'Nessuna richiesta da un numero italiano trovata.',
  'richieste.invalidInput': 'Risposta non valida. Inserisci un numero oppure 39.',
  'richieste.noBotAdmin': 'Il bot deve essere amministratore del gruppo.',
  'richieste.noAdmin': 'Solo gli amministratori possono gestire le richieste.',
  'richieste.noPending': 'Non ci sono richieste di ingresso in attesa.',
  'richieste.pendingCount': '📥 Ci sono {count} richieste di ingresso in attesa.',
  'richieste.menuFooter': 'Scegli un\'azione per gestire le richieste.',
  'richieste.buttonAcceptAll': 'Accetta tutte',
  'richieste.buttonRejectAll': 'Rifiuta tutte',
  'richieste.buttonAccept39': 'Accetta numeri italiani',
  'richieste.buttonManage': 'Scegli una quantità',
  'richieste.rejectedSuccess': '✅ Rifiutate {count} richieste di ingresso.',
  'richieste.errorRejecting': '❌ Errore durante il rifiuto delle richieste.',
  'richieste.manageCustom': 'Quante richieste vuoi accettare? Comando: {command} accetta <numero>',
  'richieste.manageFooter': 'Seleziona il numero massimo di richieste da accettare.'
}

function t(key, _userId, _groupId, variables = {}) {
  const message = messages[key] ?? key
  return message.replace(/\{(\w+)\}/g, (_, name) =>
    String(variables[name] ?? `{${name}}`)
  )
}

const richiestaInAttesa = {}

async function richieste(m, {
  isAdmin,
  isBotAdmin,
  args,
  usedPrefix,
  command
}) {
  if (!m.isGroup) return

  const userId = m.sender
  const groupId = m.chat

  if (richiestaInAttesa[userId]) {
    const pending =
      await this.groupRequestParticipantsList(groupId)

    const input = (m.text || '').trim()

    delete richiestaInAttesa[userId]

    if (/^\d+$/.test(input)) {
      const numero = parseInt(input)

      if (numero <= 0) {
        return m.reply(
          t(
            'richieste.invalidNumber',
            userId,
            groupId
          )
        )
      }

      const daAccettare = pending.slice(0, numero)

      try {
        const jidList = daAccettare.map(p => p.jid)

        await this.groupRequestParticipantsUpdate(
          groupId,
          jidList,
          'approve'
        )

        return m.reply(
          t(
            'richieste.acceptedSuccess',
            userId,
            groupId,
            { count: jidList.length }
          )
        )
      } catch {
        return m.reply(
          t(
            'richieste.errorAccepting',
            userId,
            groupId
          )
        )
      }
    }

    if (input === '39' || input === '+39') {
      const daAccettare = pending.filter(
        p =>
          p.jid.startsWith('39') ||
          p.jid.startsWith('+39')
      )

      if (!daAccettare.length) {
        return m.reply(
          t(
            'richieste.no39Found',
            userId,
            groupId
          )
        )
      }

      try {
        const jidList = daAccettare.map(p => p.jid)

        await this.groupRequestParticipantsUpdate(
          groupId,
          jidList,
          'approve'
        )

        return m.reply(
          t(
            'richieste.accepted39Success',
            userId,
            groupId,
            { count: jidList.length }
          )
        )
      } catch {
        return m.reply(
          t(
            'richieste.errorAccepting',
            userId,
            groupId
          )
        )
      }
    }

    return m.reply(
      t(
        'richieste.invalidInput',
        userId,
        groupId
      )
    )
  }

  if (!isBotAdmin) {
    return m.reply(
      t(
        'richieste.noBotAdmin',
        userId,
        groupId
      )
    )
  }

  if (!isAdmin) {
    return m.reply(
      t(
        'richieste.noAdmin',
        userId,
        groupId
      )
    )
  }

  const pending =
    await this.groupRequestParticipantsList(groupId)

  if (!pending.length) {
    return m.reply(
      t(
        'richieste.noPending',
        userId,
        groupId
      )
    )
  }

  if (!args[0]) {
    return this.sendMessage(
      m.chat,
      {
        text: t(
          'richieste.pendingCount',
          userId,
          groupId,
          { count: pending.length }
        ),
        footer: t(
          'richieste.menuFooter',
          userId,
          groupId
        ),
        buttons: [
          {
            buttonId: `${usedPrefix}${command} accetta`,
            buttonText: {
              displayText: t(
                'richieste.buttonAcceptAll',
                userId,
                groupId
              )
            },
            type: 1
          },
          {
            buttonId: `${usedPrefix}${command} rifiuta`,
            buttonText: {
              displayText: t(
                'richieste.buttonRejectAll',
                userId,
                groupId
              )
            },
            type: 1
          },
          {
            buttonId: `${usedPrefix}${command} accetta39`,
            buttonText: {
              displayText: t(
                'richieste.buttonAccept39',
                userId,
                groupId
              )
            },
            type: 1
          },
          {
            buttonId: `${usedPrefix}${command} gestisci`,
            buttonText: {
              displayText: t(
                'richieste.buttonManage',
                userId,
                groupId
              )
            },
            type: 1
          }
        ],
        headerType: 1,
        viewOnce: true
      },
      { quoted: m }
    )
  }

  if (args[0] === 'accetta') {
    const numero = parseInt(args[1])

    const daAccettare =
      isNaN(numero) || numero <= 0
        ? pending
        : pending.slice(0, numero)

    try {
      const jidList = daAccettare.map(p => p.jid)

      await this.groupRequestParticipantsUpdate(
        groupId,
        jidList,
        'approve'
      )

      return m.reply(
        t(
          'richieste.acceptedSuccess',
          userId,
          groupId,
          { count: jidList.length }
        )
      )
    } catch {
      return m.reply(
        t(
          'richieste.errorAccepting',
          userId,
          groupId
        )
      )
    }
  }

  if (args[0] === 'rifiuta') {
    try {
      const jidList = pending.map(p => p.jid)

      await this.groupRequestParticipantsUpdate(
        groupId,
        jidList,
        'reject'
      )

      return m.reply(
        t(
          'richieste.rejectedSuccess',
          userId,
          groupId,
          { count: jidList.length }
        )
      )
    } catch {
      return m.reply(
        t(
          'richieste.errorRejecting',
          userId,
          groupId
        )
      )
    }
  }

  if (args[0] === 'accetta39') {
    const daAccettare = pending.filter(
      p =>
        p.jid.startsWith('39') ||
        p.jid.startsWith('+39')
    )

    if (!daAccettare.length) {
      return m.reply(
        t(
          'richieste.no39Found',
          userId,
          groupId
        )
      )
    }

    try {
      const jidList = daAccettare.map(p => p.jid)

      await this.groupRequestParticipantsUpdate(
        groupId,
        jidList,
        'approve'
      )

      return m.reply(
        t(
          'richieste.accepted39Success',
          userId,
          groupId,
          { count: jidList.length }
        )
      )
    } catch {
      return m.reply(
        t(
          'richieste.errorAccepting',
          userId,
          groupId
        )
      )
    }
  }

  if (args[0] === 'gestisci') {
    return this.sendMessage(
      m.chat,
      {
        text: t(
          'richieste.manageCustom',
          userId,
          groupId,
          { command }
        ),
        footer: t(
          'richieste.manageFooter',
          userId,
          groupId
        ),
        buttons: [
          {
            buttonId: `${usedPrefix}${command} accetta 10`,
            buttonText: { displayText: '10' },
            type: 1
          },
          {
            buttonId: `${usedPrefix}${command} accetta 20`,
            buttonText: { displayText: '20' },
            type: 1
          },
          {
            buttonId: `${usedPrefix}${command} accetta 50`,
            buttonText: { displayText: '50' },
            type: 1
          },
          {
            buttonId: `${usedPrefix}${command} accetta 100`,
            buttonText: { displayText: '100' },
            type: 1
          },
          {
            buttonId: `${usedPrefix}${command} accetta 200`,
            buttonText: { displayText: '200' },
            type: 1
          }
        ],
        headerType: 1,
        viewOnce: true
      },
      { quoted: m }
    )
  }
}

export default definePlugin(richieste, {
  name: 'group-requests',
  command: [
    'richieste',
    'requests'
  ],
  customPrefix: /^\./,
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Gestisce le richieste di ingresso nel gruppo',
  icon: '📥',
  order: 2,
  permissions: {
    roles: ['admin', 'owner'],
    botAdmin: true
  }
})