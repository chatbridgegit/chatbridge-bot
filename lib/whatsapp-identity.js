import {
  createLidMappingResolver,
  extractSenderIdentity,
  getJidKind,
  isAuthorizedOwner,
  isAuthorizedSudo,
  sameIdentity,
  serializeMessage
} from '@chatest/baileys'
import { buildInternalAuthorization, evaluateGroupAuthorization } from './group-authorization.js'

function normalizeConfiguredJids(entries = []) {
  const values = Array.isArray(entries) ? entries : [entries]
  return values
    .map(entry => Array.isArray(entry) ? entry[0] : entry)
    .filter(value => typeof value === 'string' && value.trim())
    .map(value => {
      const trimmed = value.trim()
      if (trimmed.includes('@')) return trimmed
      const digits = trimmed.replace(/\D/g, '')
      return digits ? `${digits}@s.whatsapp.net` : ''
    })
    .filter(Boolean)
}

export function getIdentityResolver(conn) {
  return conn?.identityResolver || global.identityResolver
}

export function createProjectIdentityResolver() {
  return createLidMappingResolver({ ttlMs: 15 * 60 * 1000 })
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
