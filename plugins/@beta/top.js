const presenceState = new Map()

export function trackPresenceUpdate(groupId, userId, status) {
  if (!groupId || !userId) return
  if (!presenceState.has(groupId)) presenceState.set(groupId, new Map())
  presenceState.get(groupId).set(userId, {
    status: status || 'unavailable',
    updatedAt: Date.now()
  })
}

export default {
  name: 'presence-tracker',
  command: [],
  category: 'system',
  target: 'event',
  roles: ['system'],
  description: 'Aggiorna lo stato presenza dei gruppi'
}
