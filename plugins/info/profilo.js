import { pluginUi } from '../../lib/plugin-font.js'
import { ensureUnityProfile, formatCoins, jobById, netWorth, targetUser } from '../../lib/uc-engine.js'
import { definePlugin, getBotConfig, resolvePhoneJid } from '../../lib/plugin-utils.js'

const personalFields = {
  genere: 'gender',
  gender: 'gender',
  nickname: 'nickname',
  nome: 'nickname',
  instagram: 'instagram',
  ig: 'instagram',
  bio: 'bio',
  descrizione: 'bio',
  citta: 'city',
  'città': 'city',
  city: 'city',
  pronome: 'pronouns',
  pronomi: 'pronouns',
  pronouns: 'pronouns'
}

const personalLabels = {
  gender: ['⚧️', 'Genere'],
  nickname: ['🏷️', 'Nickname'],
  instagram: ['📸', 'Instagram'],
  bio: ['📝', 'Bio'],
  city: ['📍', 'Citta'],
  pronouns: ['💬', 'Pronomi']
}

function positiveNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0
}

function personalData(user) {
  if (!user.personal || typeof user.personal !== 'object' || Array.isArray(user.personal)) user.personal = {}
  return user.personal
}

function formatPersonalValue(key, value) {
  if (!value) return 'non impostato'
  if (key === 'instagram' && !String(value).startsWith('@') && !/^https?:\/\//i.test(value)) return `@${value}`
  return String(value)
}

function profileUpdate(m, extra, user, target) {
  const input = String(extra?.text || '').trim()
  if (!input) return null

  const parts = input.split(/\s+/)
  const first = String(parts.shift() || '').toLowerCase()
  const fieldName = first === 'set' ? String(parts.shift() || '').toLowerCase() : first
  const key = personalFields[fieldName]
  if (!key) {
    if (target !== m.sender) return null
    return m.reply(pluginUi.box('Profilo personale', [
      pluginUi.row('ℹ️', 'Uso:', '.profilo set <campo> <valore>'),
      pluginUi.row('📋', 'Campi:', 'genere, nickname, instagram, bio, citta, pronomi')
    ]))
  }

  if (target !== m.sender) return m.reply('Puoi modificare solo il tuo profilo.')
  const value = parts.join(' ').trim()
  const data = personalData(user)
  if (!value || ['-', 'none', 'nessuno', 'reset', 'rimuovi'].includes(value.toLowerCase())) {
    delete data[key]
    global.markDbDirty?.()
    return m.reply(pluginUi.box('Profilo personale', [pluginUi.row('✅', 'Aggiornamento:', `${personalLabels[key][1]} rimosso`)]))
  }
  if (value.length > 120) return m.reply('Il valore del profilo non puo superare 120 caratteri.')

  data[key] = value
  global.markDbDirty?.()
  return m.reply(pluginUi.box('Profilo personale', [pluginUi.row('✅', 'Aggiornamento:', `${personalLabels[key][1]} salvato`), pluginUi.row('ℹ️', 'Uso:', '.profilo per visualizzare il profilo')]))
}

async function profile(m, extra) {
  const requestedTarget = targetUser(m)
  const target = requestedTarget || m.sender
  const user = global.db.data.users[target] || (global.db.data.users[target] = {})
  const updated = profileUpdate(m, extra, user, target)
  if (updated) return updated

  const { name: botName } = getBotConfig()
  const personal = personalData(user)
  const economy = ensureUnityProfile(target)
  const commands = positiveNumber(user.comandi)
  const xp = positiveNumber(user.exp)
  const displayName = personal.nickname || user.name || (target === m.sender ? m.name : '') || target.split('@')[0]
  const rows = [
    pluginUi.row('👤', 'Utente:', displayName),
    pluginUi.row('🆔', 'ID:', target.split('@')[0]),
    pluginUi.row('⚡', 'Comandi eseguiti:', commands),
    pluginUi.row('⭐', 'XP:', xp),
    pluginUi.row('💳', 'Portafoglio:', `${formatCoins(economy.coins)} UC`),
    pluginUi.row('🏦', 'Banca:', `${formatCoins(economy.bank)} UC`),
    pluginUi.row('💎', 'Patrimonio:', `${formatCoins(netWorth(economy))} UC`),
    pluginUi.row('📈', 'Livello:', economy.level),
    pluginUi.row('💼', 'Lavoro:', jobById(economy.job)?.name || 'nessuno'),
    ...Object.entries(personalLabels).map(([key, [icon, label]]) => pluginUi.row(icon, `${label}:`, formatPersonalValue(key, personal[key])))
  ]
  const usage = pluginUi.box('Modifica profilo', [
    pluginUi.row('✏️', 'Uso:', '.profilo set <campo> <valore>'),
    pluginUi.row('📋', 'Campi:', 'genere, nickname, instagram, bio, citta, pronomi'),
    pluginUi.row('🗑️', 'Rimuovi:', '.profilo set <campo> -')
  ])
  const text = [pluginUi.box(`${botName} Profilo`, rows), usage].join('\n\n')

  let picture
  try {
    const jid = await resolvePhoneJid(this, { id: target }) || target
    picture = await this.profilePictureUrl(jid, 'image')
  } catch {}

  if (picture) return this.sendMessage(m.chat, { image: { url: picture }, caption: text }, { quoted: m })
  return m.reply(text)
}

export default definePlugin(profile, {
  name: 'info-profile',
  command: ['profilo', 'userinfo'],
  customPrefix: /^\./,
  category: 'info',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra e aggiorna il profilo personale e UnityLife',
  icon: '👤',
  order: 3,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
