import { definePlugin } from '../../lib/plugin-utils.js'

function getOwners() {
  const values = Array.isArray(global.owner) ? global.owner : [global.owner]

  return values
    .map((entry, index) => {
      const number = Array.isArray(entry) ? entry[0] : entry
      const name = Array.isArray(entry) ? entry[1] : `Owner ${index + 1}`

      return {
        number: String(number || '').replace(/\D/g, ''),
        name: String(name).trim()
      }
    })
    .filter(owner => owner.number.length >= 5 && owner.number.length <= 15)
}

async function owner(m) {
  const owners = getOwners()

  if (!owners.length) {
    return m.reply('Nessun owner configurato nel bot.')
  }

  const contacts = owners.map(({ number, name }) => ({
    displayName: name,
    vcard: `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;type=CELL;type=VOICE;waid=${number}:+${number}
END:VCARD`
  }))

  return this.sendMessage(m.chat, {
    contacts: {
      displayName: owners.length === 1 ? owners[0].name : `${owners.length} Owners`,
      contacts
    }
  }, { quoted: m })
}

export default definePlugin(owner, {
  name: 'info-owner',
  command: ['owner', 'owners'],
  customPrefix: /^\./,
  category: 'info',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Invia gli owner del bot come contatti',
  icon: '👑',
  order: 2,
  permissions: {
    roles: ['user', 'mod', 'admin', 'owner']
  }
})