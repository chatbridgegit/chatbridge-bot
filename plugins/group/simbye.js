import { participantsUpdate } from '../../handler.js'
import { definePlugin } from '../../lib/plugin-utils.js'

async function simulateBye(m) {
  await participantsUpdate.call(this, {
    id: m.chat,
    participants: [m.sender],
    action: 'remove'
  })
  return null
}

export default definePlugin(simulateBye, {
  name: 'group-sim-bye',
  command: ['simbye'],
  customPrefix: /^\./,
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Simula il messaggio di addio del gruppo',
  icon: '👋',
  order: 86,
  permissions: { roles: ['admin', 'owner'] }
}, { group: true })
