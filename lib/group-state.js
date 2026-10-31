import { ensureFeatureState } from './group-features.js'

function isRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function ensureGroupState(chat = {}) {
  if (!Array.isArray(chat.moderators)) chat.moderators = []
  chat.moderators = [...new Set(chat.moderators
    .map(value => Array.isArray(value) ? value[0] : value)
    .filter(value => typeof value === 'string' && value.trim())
    .map(value => value.trim()))]
  if (!isRecord(chat.warns)) chat.warns = {}
  if (!isRecord(chat.mutedUsers)) chat.mutedUsers = {}
  if (!Array.isArray(chat.bannedWords)) chat.bannedWords = []
  chat.bannedWords = [...new Set(chat.bannedWords
    .filter(value => typeof value === 'string')
    .map(value => value.trim().toLocaleLowerCase('it-IT'))
    .filter(Boolean))]
  if (!isRecord(chat.memberActivity)) chat.memberActivity = {}
  if (!isRecord(chat.modStats)) chat.modStats = {}
  if (!isRecord(chat._featureActivity)) chat._featureActivity = {}
  const defaultInactiveDays = Number(global.inactiveDays) > 0 ? Number(global.inactiveDays) : 30
  if (!Number.isFinite(Number(chat.inactiveDays)) || Number(chat.inactiveDays) < 1) chat.inactiveDays = defaultInactiveDays
  if (!['open', 'closed'].includes(chat.groupMode)) chat.groupMode = 'open'
  if (typeof chat.joinApprovalMode !== 'boolean') chat.joinApprovalMode = false
  if (!Number.isFinite(Number(chat.ephemeralDuration)) || Number(chat.ephemeralDuration) < 0) chat.ephemeralDuration = 0
  ensureFeatureState(chat)
  return chat
}

export function identityKey(value) {
  if (!value) return ''
  const raw = typeof value === 'string'
    ? value
    : value.pn || value.phoneNumber || value.jid || value.id || value.lid || ''
  if (!raw) return ''
  const stringValue = String(raw).trim()
  if (stringValue.endsWith('@lid')) return stringValue
  const digits = stringValue.replace(/\D/g, '')
  return digits ? `${digits}@s.whatsapp.net` : stringValue
}

export function markGroupAction(chat, actor, action) {
  if (!chat || !action) return
  ensureGroupState(chat)
  const key = identityKey(actor) || 'unknown'
  const current = isRecord(chat.modStats[key]) ? chat.modStats[key] : {
    count: 0,
    actions: {},
    lastAt: 0
  }
  current.count = Number(current.count) + 1
  current.actions[action] = Number(current.actions[action] || 0) + 1
  current.lastAt = Date.now()
  chat.modStats[key] = current
}

export function markDatabaseDirty() {
  if (typeof global.markDbDirty === 'function') global.markDbDirty()
}

export function getWarnRecord(chat, key, create = false) {
  ensureGroupState(chat)
  if (!key) return null
  if (!chat.warns[key] && create) chat.warns[key] = { count: 0, entries: [] }
  const record = chat.warns[key]
  if (!isRecord(record)) return null
  if (!Number.isFinite(Number(record.count))) record.count = 0
  if (!Array.isArray(record.entries)) record.entries = []
  return record
}
