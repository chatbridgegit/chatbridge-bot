import { pluginFont, pluginUi } from './plugin-font.js'

export const groupFeatureDefinitions = [
  { key: 'antiLink', command: 'antilink', label: 'Antilink', icon: '🔗', category: 'protection', default: true, description: 'Blocca link esterni e inviti' },
  { key: 'antitiktok', command: 'antilinktiktok', aliases: ['antitiktok'], label: 'AntiTiktok', icon: '🎵', category: 'protection', default: false, description: 'Blocca link TikTok' },
  { key: 'antiLinkWhatsApp', command: 'antilinkwhatsapp', label: 'AntiLink WhatsApp', icon: '💬', category: 'protection', default: false, description: 'Blocca link WhatsApp e inviti' },
  { key: 'antiLinkInstagram', command: 'antilinkig', aliases: ['antilinkinstagram'], label: 'AntiLink Instagram', icon: '📸', category: 'protection', default: false, description: 'Blocca link Instagram' },
  { key: 'antispam', command: 'antispam', label: 'Antispam', icon: '🛑', category: 'protection', default: true, description: 'Riduce raffiche di messaggi e comandi' },
  { key: 'antiTraba', command: 'antitraba', label: 'Antitraba', icon: '🧱', category: 'protection', default: true, description: 'Blocca pattern di testo ripetuti e anomali' },
  { key: 'antimedia', command: 'antimedia', label: 'Antimedia', icon: '🖼️', category: 'protection', default: false, description: 'Blocca media nei gruppi' },
  { key: 'antibot', command: 'antibot', label: 'Antibot', icon: '🤖', category: 'protection', default: false, description: 'Blocca messaggi generati da altri bot' },
  { key: 'welcome', command: 'welcome', label: 'Benvenuto', icon: '🎉', category: 'automation', default: true, description: 'Invia il messaggio di benvenuto' },
  { key: 'bye', command: 'bye', label: 'Addio', icon: '👋', category: 'automation', default: true, description: 'Invia il messaggio di uscita' },
  { key: 'bestemmiometro', command: 'bestemmiometro', label: 'Bestemmiometro', icon: '🤬', category: 'moderation', default: false, description: 'Rileva e gestisce linguaggio offensivo' },
  { key: 'sologruppo', command: 'sologruppo', label: 'Solo Gruppo', icon: '👥', category: 'access', default: false, description: 'Limita il bot ai gruppi' },
  { key: 'soloadmin', command: 'soloadmin', label: 'Solo Admin', icon: '🛡️', category: 'access', default: false, description: 'Limita i comandi agli admin e moderatori' },
  { key: 'antiporno', command: 'antiporno', label: 'Antiporno', icon: '🔞', category: 'moderation', default: false, description: 'Blocca contenuti testuali espliciti' },
  { key: 'antiCall', command: 'anticall', label: 'AntiCall', icon: '📵', category: 'protection', default: false, description: 'Blocca le chiamate al bot' },
  { key: 'antivirus', command: 'antivirus', label: 'Antivirus', icon: '🦠', category: 'protection', default: false, description: 'Blocca allegati e nomi file pericolosi' },
  { key: 'antivoip', command: 'antivoip', label: 'Antivoip', icon: '📞', category: 'protection', default: false, description: 'Rileva pattern di numeri VoIP sospetti' },
  { key: 'antioneview', command: 'antiviewonce', label: 'AntiViewOnce', icon: '👁️', category: 'protection', default: true, description: 'Blocca contenuti visualizzabili una sola volta' },
  { key: 'antiInvite', command: 'antiinvite', label: 'AntiInvite', icon: '🚫', category: 'protection', default: false, description: 'Blocca inviti ad altri gruppi' },
  { key: 'antiFlood', command: 'antiflood', label: 'AntiFlood', icon: '🌊', category: 'protection', default: false, description: 'Rileva raffiche anomale per utente' },
  { key: 'antiForward', command: 'antiforward', label: 'AntiForward', icon: '↪️', category: 'protection', default: false, description: 'Blocca messaggi inoltrati' },
  { key: 'antiDocument', command: 'antidocumenti', label: 'AntiDocumenti', icon: '📄', category: 'protection', default: false, description: 'Blocca documenti non autorizzati' },
  { key: 'antiReaction', command: 'antireaction', label: 'AntiReaction', icon: '💢', category: 'moderation', default: false, description: 'Blocca reazioni nei messaggi del gruppo' }
]

const definitionByName = new Map()
for (const definition of groupFeatureDefinitions) {
  for (const value of [definition.key, definition.command, ...(definition.aliases || []), definition.label]) {
    definitionByName.set(String(value).toLowerCase().replace(/[\s_-]/g, ''), definition)
  }
}

export function getGroupFeatureDefinition(value) {
  if (!value) return null
  return definitionByName.get(String(value).toLowerCase().replace(/[\s_-]/g, '')) || null
}

export function ensureFeatureState(chat = {}) {
  for (const definition of groupFeatureDefinitions) {
    if (typeof chat[definition.key] !== 'boolean') chat[definition.key] = definition.default
  }
  return chat
}

export function setGroupFeature(chat, value, enabled) {
  const definition = getGroupFeatureDefinition(value)
  if (!definition) return null
  chat[definition.key] = Boolean(enabled)
  return definition
}

export function featureEmoji(chat, definition) {
  return chat?.[definition.key] === true ? '✅' : '❌'
}

export function featureRows(chat, definitions = groupFeatureDefinitions) {
  return definitions.map(definition => pluginUi.rawRow(
    '',
    `${featureEmoji(chat, definition)} ${pluginFont(definition.label)}`
  ))
}
