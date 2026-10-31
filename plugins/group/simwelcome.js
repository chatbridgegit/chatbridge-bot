import { participantsUpdate } from '../../handler.js'
import { definePlugin } from '../../lib/plugin-utils.js'

async function simulateWelcome(m) {
  await participantsUpdate.call(this, {
    id: m.chat,
    participants: [m.sender],
    action: 'add'
  })
  return null
}

export default definePlugin(simulateWelcome, {
  name: 'group-sim-welcome',
  command: ['simwelcome'],
  customPrefix: /^\./,
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Simula il messaggio di benvenuto del gruppo',
  icon: '🎉',
  order: 85,
  permissions: { roles: ['admin', 'owner'] }
}, { group: true })
