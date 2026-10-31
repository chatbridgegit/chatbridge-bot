export const GROUP_AUTHORIZATION_MAX_AGE = 15000

export function buildInternalAuthorization({ isConfiguredOwner = false, isConfiguredSudo = false, isAuthenticatedSelf = false } = {}) {
  const isROwner = isConfiguredOwner === true
  const isSudo = isConfiguredSudo === true
  return {
    isSelf: isAuthenticatedSelf === true,
    isROwner,
    isOwner: isROwner,
    isMods: isROwner || isSudo,
    isSudo
  }
}

export function isCompleteGroupMetadata(metadata) {
  if (!metadata || !Array.isArray(metadata.participants) || metadata.participants.length === 0) return false
  return metadata.participants.every(participant => {
    if (!participant || typeof participant !== 'object') return false
    const hasIdentity = [participant.id, participant.jid, participant.phoneNumber, participant.pn, participant.lid]
      .some(value => typeof value === 'string' && value.length > 0)
    return hasIdentity && Object.prototype.hasOwnProperty.call(participant, 'admin')
  })
}

function baseAuthorization(reason = 'unverified') {
  return {
    verified: false,
    present: false,
    isAdmin: false,
    isGroupOwner: false,
    participant: null,
    reason
  }
}

export function evaluateGroupAuthorization({
  identity,
  participants,
  metadataAvailable = true,
  metadataAge = 0,
  matchParticipant
} = {}) {
  if (!metadataAvailable || !isCompleteGroupMetadata({ participants })) {
    return baseAuthorization('metadata-unavailable')
  }

  if (Number.isFinite(metadataAge) && metadataAge > GROUP_AUTHORIZATION_MAX_AGE) {
    return baseAuthorization('metadata-stale')
  }

  if (!identity || typeof matchParticipant !== 'function') {
    return baseAuthorization('identity-unavailable')
  }

  const matches = participants.filter(participant => matchParticipant(identity, participant))
  if (matches.length !== 1) {
    return {
      ...baseAuthorization(matches.length > 1 ? 'identity-ambiguous' : 'not-a-member'),
      verified: true
    }
  }

  const participant = matches[0]
  const adminRole = typeof participant?.admin === 'string'
    ? participant.admin.toLowerCase()
    : participant?.admin === true
      ? 'admin'
      : ''
  const isGroupOwner = adminRole === 'superadmin' || adminRole === 'owner'
  return {
    verified: true,
    present: true,
    isAdmin: isGroupOwner || adminRole === 'admin',
    isGroupOwner,
    participant,
    reason: 'verified'
  }
}

export function requiresVerifiedGroupAuthorization(plugin = {}) {
  const permissions = plugin.permissions && typeof plugin.permissions === 'object'
    ? plugin.permissions
    : {}
  const roles = Array.isArray(plugin.roles)
    ? plugin.roles
    : Array.isArray(permissions.roles)
      ? permissions.roles
      : []
  const normalizedRoles = roles.map(role => String(role).toLowerCase())
  return Boolean(
    plugin.admin === true ||
    plugin.moderator === true ||
    plugin.botAdmin === true ||
    permissions.admin === true ||
    permissions.moderator === true ||
    permissions.botAdmin === true ||
    normalizedRoles.includes('admin') ||
    normalizedRoles.includes('mod') ||
    normalizedRoles.includes('moderator') ||
    normalizedRoles.includes('owner')
  )
}

export function allowsUnverifiedGroupUser(plugin = {}) {
  const permissions = plugin.permissions && typeof plugin.permissions === 'object'
    ? plugin.permissions
    : {}
  const roles = Array.isArray(plugin.roles)
    ? plugin.roles
    : Array.isArray(permissions.roles)
      ? permissions.roles
      : []
  const normalizedRoles = roles.map(role => String(role).toLowerCase())
  return normalizedRoles.includes('user') && !(
    plugin.admin === true ||
    plugin.moderator === true ||
    plugin.botAdmin === true ||
    permissions.admin === true ||
    permissions.moderator === true ||
    permissions.botAdmin === true
  )
}
