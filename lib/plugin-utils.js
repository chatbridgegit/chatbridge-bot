import { getIdentityResolver } from './whatsapp-identity.js'

export function definePlugin(handler, metadata, flags = {}) {
  const permissions = metadata.permissions && typeof metadata.permissions === 'object'
    ? metadata.permissions
    : {}
  const roles = Array.isArray(metadata.roles) ? metadata.roles : permissions.roles || []
  const normalized = { ...metadata, roles, permissions: { ...permissions, roles } }
  const permissionFlags = ['group', 'botAdmin', 'admin', 'moderator', 'owner', 'rowner', 'mods']
    .filter(flag => permissions[flag] === true)
    .reduce((result, flag) => ({ ...result, [flag]: true }), {})

  const { name, ...assignableMetadata } = normalized
  const plugin = Object.assign(handler, assignableMetadata, permissionFlags, {
    metadata: normalized,
    ...flags
  })

  // Function.name is configurable but not writable: assignment via Object.assign fails.
  Object.defineProperty(plugin, 'name', {
    value: String(name || handler.name || 'plugin'),
    configurable: true
  })

  return plugin
}

export function getBotConfig() {
  const name = global.botName || global.nomebot || global.wm || 'Bot'
  const version = global.botVersion || global.version || global.vs || ''
  return {
    name: String(name).trim() || 'Bot',
    version: String(version).trim()
  }
}

export function formatRuntime(start = global.timestamp?.start) {
  const startTime = start instanceof Date ? start.getTime() : Number(start)
  if (!Number.isFinite(startTime)) return '00:00:00:00'

  const elapsed = Math.max(0, Date.now() - startTime)
  const days = Math.floor(elapsed / 86400000)
  const hours = Math.floor(elapsed / 3600000) % 24
  const minutes = Math.floor(elapsed / 60000) % 60
  const seconds = Math.floor(elapsed / 1000) % 60
  return [days, hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':')
}

export async function getGroupMetadata(conn, chatId, provided) {
  if (provided?.participants) return provided
  if (!conn?.groupMetadata || !chatId) return { participants: [] }
  return await conn.groupMetadata(chatId).catch(() => ({ participants: [] }))
}

export function getParticipants(metadata, fallback = []) {
  return Array.isArray(metadata?.participants) ? metadata.participants : fallback
}

function asCandidate(value) {
  if (typeof value !== 'string') return null
  const candidate = value.trim()
  return candidate || null
}

function normalizePhoneCandidate(value) {
  const candidate = asCandidate(value)
  if (!candidate || candidate.endsWith('@lid') || candidate.endsWith('@g.us')) return null

  const number = candidate.split('@')[0].split(':')[0].replace(/\D/g, '')
  if (number.length < 5 || number.length > 15) return null
  return `${number}@s.whatsapp.net`
}

async function resolveLid(conn, candidate) {
  if (!candidate?.endsWith('@lid')) return candidate

  const resolver = getIdentityResolver(conn)
  const mapped = resolver?.resolve?.(candidate)
  if (mapped && mapped !== candidate) return mapped

  for (const method of ['getPNForLID', 'getPNById']) {
    if (typeof conn?.[method] !== 'function') continue
    try {
      const phone = await conn[method](candidate)
      if (phone) return phone
    } catch {}
  }

  return null
}

export async function resolvePhoneJid(conn, participant) {
  const values = [
    participant?.phoneNumber,
    participant?.pn,
    participant?.participantPn,
    participant?.jid,
    participant?.id,
    participant?.lid,
    typeof participant === 'string' ? participant : null
  ]

  for (const value of values) {
    const candidate = asCandidate(value)
    if (!candidate) continue
    const resolved = await resolveLid(conn, candidate)
    const phoneJid = normalizePhoneCandidate(resolved)
    if (phoneJid) return phoneJid
  }

  return null
}

export async function describeParticipant(conn, participant, fallbackIndex = 0) {
  const source = typeof participant === 'string' ? { id: participant } : (participant || {})
  const phoneJid = await resolvePhoneJid(conn, source)
  const phone = phoneJid ? phoneJid.split('@')[0] : ''
  let name = source.notify || source.name || ''

  if (!name && phoneJid && typeof conn?.getName === 'function') {
    try {
      name = await conn.getName(phoneJid)
    } catch {}
  }

  if (!name) name = `Utente ${fallbackIndex + 1}`
  return {
    jid: phoneJid || source.id || source.jid || source.lid || null,
    phone,
    name: String(name),
    label: `${String(name)} — ${phone ? `+${phone}` : 'numero non disponibile'}`
  }
}

export function hasRole(extra, roles = []) {
  const allowed = Array.isArray(roles) ? roles.map(role => String(role).toLowerCase()) : []
  if (allowed.includes('owner') && (extra?.isROwner || extra?.isOwner)) return true
  if (allowed.includes('mod') && (extra?.isMods || extra?.isModerator)) return true
  if (allowed.includes('admin') && extra?.isAdmin) return true
  return allowed.includes('user')
}

export async function denyRole(m, conn, type = 'moderator') {
  if (typeof global.dfail === 'function') return global.dfail(type, m, conn)
  return m?.reply?.('Permessi insufficienti.')
}

export function pendingRequestJid(request) {
  return request?.jid || request?.participant || request?.requester || request?.id || null
}
