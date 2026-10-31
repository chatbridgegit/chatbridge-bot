import translate from '@vitalets/google-translate-api'
import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const MAX_TRANSLATION_LENGTH = 5000
const TRANSLATION_COOLDOWN = 4000
const requests = new Map()

function getSource(m, text) {
  const direct = String(text || '').trim()
  if (direct) return direct
  return String(m.quoted?.text || '').trim()
}

function getTargetAndSource(m, text) {
  const value = String(text || '').trim()
  const match = value.match(/^([a-z]{2,5}(?:-[a-z]{2,5})?)\s+([\s\S]+)$/i)
  if (match) return { target: match[1].toLowerCase(), source: match[2].trim() }
  return { target: 'it', source: getSource(m, text) }
}

function rateLimit(m) {
  const key = `${m.chat}:${m.sender}`
  const expiresAt = requests.get(key) || 0
  const now = Date.now()
  if (expiresAt > now) return Math.ceil((expiresAt - now) / 1000)
  requests.set(key, now + TRANSLATION_COOLDOWN)
  setTimeout(() => {
    if ((requests.get(key) || 0) <= Date.now()) requests.delete(key)
  }, TRANSLATION_COOLDOWN)
  return 0
}

async function translation(m, { text, usedPrefix, command }) {
  const { target, source } = getTargetAndSource(m, text)
  if (!source) {
    return m.reply(pluginUi.box('🌍 Traduttore', [
      pluginUi.row('ℹ️', 'Uso:', `${usedPrefix}${command} <lingua> <testo>`),
      pluginUi.row('✨', 'Esempio:', `${usedPrefix}${command} en Ciao mondo`),
      pluginUi.row('↩️', 'Risposta:', `rispondi a un testo con ${usedPrefix}${command} en`)
    ]))
  }

  if (!/^[a-z]{2,5}(?:-[a-z]{2,5})?$/i.test(target)) {
    return m.reply(pluginUi.box('⚠️ Traduttore', [pluginUi.row('🚫', 'Lingua:', 'usa un codice come it, en, fr o pt-BR')]))
  }
  if (source.length > MAX_TRANSLATION_LENGTH) {
    return m.reply(pluginUi.box('⚠️ Traduttore', [pluginUi.row('🚫', 'Limite:', `${MAX_TRANSLATION_LENGTH} caratteri massimi`)]))
  }

  const remaining = rateLimit(m)
  if (remaining) return m.reply(pluginUi.box('⏱️ Traduttore', [pluginUi.row('🕒', 'Attendi:', `${remaining} secondi prima di una nuova richiesta`)]))

  try {
    const result = await translate(source, { to: target, client: 'gtx' })
    const detected = result.from?.language?.iso || 'auto'
    return m.reply(pluginUi.box('🌍 Traduttore', [
      pluginUi.row('🔤', 'Da:', detected.toUpperCase()),
      pluginUi.row('🎯', 'A:', target.toUpperCase()),
      pluginUi.row('📝', 'Originale:', source.length > 300 ? `${source.slice(0, 297)}...` : source),
      pluginUi.row('✅', 'Risultato:', result.text || 'Nessuna traduzione disponibile')
    ]))
  } catch (error) {
    console.error('[tools-translate]', error)
    return m.reply(pluginUi.box('⚠️ Traduttore', [pluginUi.row('🚫', 'Stato:', 'Servizio di traduzione temporaneamente non disponibile')]))
  }
}

export default definePlugin(translation, {
  name: 'tools-translate',
  command: ['tr', 'translate', 'traduci'],
  category: 'tools',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Traduce testo in oltre cento lingue',
  icon: '🌍',
  order: 5,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
