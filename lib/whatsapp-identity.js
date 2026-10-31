import { buildInternalAuthorization, evaluateGroupAuthorization } from './group-authorization.js'

const PN_SERVER = 's.whatsapp.net'
const LID_SERVER = 'lid'

function normalizeJid(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  let jid = value.trim()
  if (!jid.includes('@')) {
    const digits = jid.replace(/\D/g, '')
    return digits ? `${digits}@${PN_SERVER}` : null
  }

  const [user, server] = jid.split('@')
  if (!user || !server) return null
  const normalizedUser = user.split(':')[0]
  return `${normalizedUser}@${server === 'c.us' ? PN_SERVER : server}`
}

function normalizeConfiguredJids(entries = []) {
  const values = Array.isArray(entries) ? entries : [entries]
  return values
    .map(entry => Array.isArray(entry) ? entry[0] : entry)
    .filter(value => typeof value === 'string' && value.trim())
    .map(normalizeJid)
    .filter(Boolean)
}

export function getJidKind(jid) {
  const normalized = normalizeJid(jid)
  if (!normalized) return null
  if (normalized.endsWith(`@${LID_SERVER}`)) return 'lid'
  if (normalized.endsWith(`@${PN_SERVER}`)) return 'pn'
  return null
}

export function getIdentityResolver(conn) {
  return conn?.identityResolver || global.identityResolver
}

export function createProjectIdentityResolver({ ttlMs = 15 * 60 * 1000 } = {}) {
  const mappings = new Map()
  return {
    record(lid, pn) {
      const normalizedLid = normalizeJid(lid)
      const normalizedPn = normalizeJid(pn)
      if (getJidKind(normalizedLid) !== 'lid' || getJidKind(normalizedPn) !== 'pn') return false
      mappings.set(normalizedLid, { pn: normalizedPn, expiresAt: Date.now() + ttlMs })
      return true
    },
    resolve(lid) {
      const normalizedLid = normalizeJid(lid)
      const mapping = mappings.get(normalizedLid)
      if (!mapping) return null
      if (mapping.expiresAt <= Date.now()) {
        mappings.delete(normalizedLid)
        return null
      }
      return mapping.pn
    }
  }
}

export function recordLidMapping(resolver, lid, pn, source = 'protocol') {
  if (!resolver || getJidKind(lid) !== 'lid' || getJidKind(pn) !== 'pn') return false
  return resolver.record(lid, pn, source)
}

export function recordParticipantMappings(resolver, participants = [], source = 'group-metadata') {
  if (!resolver || !Array.isArray(participants)) return

  for (const participant of participants) {
    const sourceParticipant = typeof participant === 'string' ? { id: participant } : participant
    const lid = sourceParticipant?.lid || (typeof sourceParticipant?.id === 'string' && sourceParticipant.id.endsWith('@lid') ? sourceParticipant.id : undefined)
    const pn = sourceParticipant?.phoneNumber || sourceParticipant?.pn || sourceParticipant?.participantPn || sourceParticipant?.jid
    recordLidMapping(resolver, lid, pn, source)
  }
}

function buildIdentity({ jid, pn, lid, resolver } = {}) {
  const normalizedJid = normalizeJid(jid)
  const normalizedPn = normalizeJid(pn)
  const normalizedLid = normalizeJid(lid)
  const inferredPn = getJidKind(normalizedJid) === 'pn' ? normalizedJid : null
  const inferredLid = getJidKind(normalizedJid) === 'lid' ? normalizedJid : null
  const identityLid = normalizedLid || inferredLid
  const identityPn = (getJidKind(normalizedPn) === 'pn' ? normalizedPn : inferredPn) ||
    (identityLid ? resolver?.resolve?.(identityLid) : null)
  const identifiers = [...new Set([normalizedJid, normalizedPn, identityPn, identityLid].filter(Boolean))]

  return {
    jid: identityPn || normalizedJid || identityLid,
    pn: identityPn,
    lid: identityLid,
    identifiers
  }
}

export function extractSenderIdentity(message, options = {}) {
  const key = message?.key || {}
  const transportFromMe = key.fromMe === true
  const socketIdentity = options.socketIdentity?.id || options.socketIdentity?.jid
  const jid = options.senderJid || key.participant || message?.participant ||
    (transportFromMe ? socketIdentity : null) || options.remoteJid || key.remoteJid || message?.remoteJid
  const pn = options.senderPn || options.participantPn || key.senderPn || key.participantPn ||
    message?.senderPn || message?.participantPn
  const lid = options.senderLid || options.participantLid || key.senderLid || key.participantLid ||
    message?.senderLid || message?.participantLid
  return buildIdentity({ jid, pn, lid, resolver: options.resolver })
}

export function sameIdentity(left, right, resolver) {
  const normalizedLeft = normalizeJid(left)
  const normalizedRight = normalizeJid(right)
  if (!normalizedLeft || !normalizedRight) return false
  if (normalizedLeft === normalizedRight) return true
  return resolver?.resolve?.(normalizedLeft) === normalizedRight ||
    resolver?.resolve?.(normalizedRight) === normalizedLeft
}

function isAuthorized(identity, jids, resolver) {
  const identifiers = identity?.identifiers || []
  return jids.some(jid =>
    identifiers.some(identifier => sameIdentity(identifier, jid, resolver)) ||
    sameIdentity(identity?.jid, jid, resolver) ||
    (identity?.lid && sameIdentity(resolver?.resolve?.(identity.lid), jid, resolver))
  )
}

export function isAuthorizedOwner(identity, ownerConfig, resolver) {
  return isAuthorized(identity, ownerConfig?.owners || [], resolver)
}

export function isAuthorizedSudo(identity, ownerConfig, resolver) {
  return isAuthorized(identity, ownerConfig?.sudo || [], resolver)
}

export function serializeMessage(message, options = {}) {
  const key = message?.key || {}
  const remoteJid = options.remoteJid || key.remoteJid || message?.remoteJid
  const transportFromMe = key.fromMe === true
  const socketIdentity = options.socketIdentity || options.socket?.user
  const identity = extractSenderIdentity(message, {
    ...options,
    socketIdentity,
    remoteJid,
    senderJid: options.senderJid || (transportFromMe
      ? socketIdentity?.id || socketIdentity?.jid
      : options.senderJid)
  })
  const ownIdentity = buildIdentity({ jid: socketIdentity?.id || socketIdentity?.jid, resolver: options.resolver })
  const senderJid = options.senderJid || (transportFromMe
    ? socketIdentity?.id || socketIdentity?.jid
    : key.participant || message?.participant || remoteJid)

  return {
    identity,
    sender: identity.jid,
    senderRaw: normalizeJid(senderJid),
    senderPn: identity.pn,
    senderLid: identity.lid,
    transportFromMe,
    isAuthenticatedSelf: transportFromMe && identityMatches(identity, ownIdentity, options.resolver)
  }
}

export function serializeIncomingMessage(message, conn) {
  const key = message?.key || {}
  const remoteJid = key.remoteJid || message?.remoteJid
  const isGroup = typeof remoteJid === 'string' && remoteJid.endsWith('@g.us')
  const participant = key.participant || message?.participant
  const participantPn = key.participantPn || message?.participantPn || key.senderPn || message?.senderPn
  const participantLid = key.participantLid || message?.participantLid || key.senderLid || message?.senderLid
  const resolver = getIdentityResolver(conn)

  const serialized = serializeMessage(message, {
    socket: conn,
    socketIdentity: conn?.user,
    resolver,
    remoteJid,
    participant,
    participantPn,
    participantLid,
    senderJid: participant,
    senderPn: key.senderPn || message?.senderPn,
    senderLid: key.senderLid || message?.senderLid,
    isGroup
  })

  recordLidMapping(resolver, serialized.identity?.lid, serialized.identity?.pn, 'message-protocol')
  return serialized
}

export function participantIdentity(participant) {
  const source = typeof participant === 'string' ? { id: participant } : (participant || {})
  const id = source.id || source.jid || source.phoneNumber || source.pn || source.lid
  return extractSenderIdentity({
    key: {
      participant: id,
      participantPn: source.participantPn || source.pn || source.phoneNumber || source.jid,
      participantLid: source.lid
    },
    participant: id
  }, {
    senderJid: id,
    senderPn: source.participantPn || source.pn || source.phoneNumber || source.jid,
    senderLid: source.lid
  })
}

export function identityMatches(identity, candidate, resolver) {
  const left = identity?.identifiers || []
  const right = candidate?.identifiers || []
  return left.some(a => right.some(b => sameIdentity(a, b, resolver)))
}

export function identityMatchesJid(identity, jid, resolver) {
  if (!jid || typeof jid !== 'string') return false
  return identityMatches(identity, participantIdentity({ id: jid }), resolver)
}

export function findParticipantByIdentity(identity, participants, resolver) {
  if (!identity || !Array.isArray(participants)) return null
  return participants.find(participant => identityMatches(identity, participantIdentity(participant), resolver)) || null
}

export function getAuthorization(identity, conn, isSelf = false) {
  const resolver = getIdentityResolver(conn)
  const ownerConfig = {
    owners: normalizeConfiguredJids(global.owner || []),
    sudo: normalizeConfiguredJids(global.mods || [])
  }
  const unresolvedLid = identity?.lid && !identity?.pn && !resolver?.resolve?.(identity.lid)
  const isROwner = !unresolvedLid && isAuthorizedOwner(identity, ownerConfig, resolver)
  const isSudo = !unresolvedLid && isAuthorizedSudo(identity, ownerConfig, resolver)

  return {
    resolver,
    ...buildInternalAuthorization({
      isConfiguredOwner: isROwner,
      isConfiguredSudo: isSudo,
      isAuthenticatedSelf: isSelf
    })
  }
}

export function getGroupAuthorization(identity, participants, resolver, options = {}) {
  const unresolvedLid = identity?.lid && !identity?.pn && !resolver?.resolve?.(identity.lid)
  if (unresolvedLid) return { ...evaluateGroupAuthorization({ metadataAvailable: false }), reason: 'identity-unresolved' }

  return evaluateGroupAuthorization({
    identity,
    participants,
    metadataAvailable: options.metadataAvailable !== false,
    metadataAge: options.metadataAge,
    matchParticipant: (senderIdentity, participant) => identityMatches(
      senderIdentity,
      participantIdentity(participant),
      resolver
    )
  })
}

export function isGroupAdmin(identity, participants, resolver) {
  return getGroupAuthorization(identity, participants, resolver).isAdmin
}
