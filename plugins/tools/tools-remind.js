import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const MIN_DELAY = 5000
const MAX_DELAY = 7 * 24 * 60 * 60 * 1000
const MAX_REMINDERS_PER_USER = 5
const reminders = new Map()

function getUserReminders(m) {
  const key = `${m.chat}:${m.sender}`
  if (!reminders.has(key)) reminders.set(key, [])
  return { key, items: reminders.get(key) }
}

function parseDelay(value) {
  const match = String(value || '').match(/^(\d{1,6})(s|m|h|d)$/i)
  if (!match) return null
  const amount = Number(match[1])
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
  const delay = amount * multipliers[match[2].toLowerCase()]
  return delay >= MIN_DELAY && delay <= MAX_DELAY ? delay : null
}

function humanDelay(delay) {
  const units = [[86400000, 'g'], [3600000, 'h'], [60000, 'm'], [1000, 's']]
  const unit = units.find(([value]) => delay >= value) || units.at(-1)
  return `${Math.round(delay / unit[0])}${unit[1]}`
}

function formatReminder(item) {
  const remaining = Math.max(0, item.dueAt - Date.now())
  return `${item.id} · ${humanDelay(remaining)} · ${item.text}`
}

function scheduleReminder(conn, m, text, delay, key, items) {
  const item = {
    id: String(Date.now()).slice(-6),
    text,
    dueAt: Date.now() + delay,
    timer: null
  }
  item.timer = setTimeout(async () => {
    const index = items.indexOf(item)
    if (index !== -1) items.splice(index, 1)
    if (!items.length) reminders.delete(key)
    await conn.sendMessage(m.chat, {
      text: pluginUi.box('⏰ Promemoria', [
        pluginUi.row('🔔', 'Per:', `@${m.sender.split('@')[0]}`),
        pluginUi.row('📝', 'Messaggio:', item.text)
      ]),
      mentions: [m.sender]
    }).catch(error => console.error('[tools-remind]', error))
  }, delay)
  items.push(item)
  return item
}

async function reminder(m, { text, args, usedPrefix, command }) {
  const input = String(text || args?.join(' ') || '').trim()
  const { key, items } = getUserReminders(m)

  if (input.toLowerCase() === 'list') {
    return m.reply(pluginUi.box('⏰ Promemoria', items.length
      ? items.map(item => pluginUi.row('🔔', 'Attivo:', formatReminder(item)))
      : [pluginUi.row('ℹ️', 'Stato:', 'nessun promemoria attivo')]))
  }

  if (input.toLowerCase() === 'cancel') {
    for (const item of items) clearTimeout(item.timer)
    reminders.delete(key)
    return m.reply(pluginUi.box('⏰ Promemoria', [pluginUi.row('✅', 'Stato:', 'tutti i promemoria sono stati annullati')]))
  }

  const match = input.match(/^(\S+)\s+([\s\S]+)$/)
  const delay = parseDelay(match?.[1])
  const reminderText = match?.[2]?.trim()
  if (!delay || !reminderText || reminderText.length > 500) {
    return m.reply(pluginUi.box('⏰ Promemoria', [
      pluginUi.row('ℹ️', 'Uso:', `${usedPrefix}${command} <tempo> <testo>`),
      pluginUi.row('✨', 'Esempio:', `${usedPrefix}${command} 30m controlla il progetto`),
      pluginUi.row('🔧', 'Gestione:', `${usedPrefix}${command} list · ${usedPrefix}${command} cancel`),
      pluginUi.row('⏱️', 'Intervallo:', 'da 5 secondi a 7 giorni')
    ]))
  }
  if (items.length >= MAX_REMINDERS_PER_USER) {
    return m.reply(pluginUi.box('⚠️ Promemoria', [pluginUi.row('🚫', 'Limite:', `${MAX_REMINDERS_PER_USER} promemoria attivi per utente`)]))
  }

  const item = scheduleReminder(this, m, reminderText, delay, key, items)
  return m.reply(pluginUi.box('⏰ Promemoria', [
    pluginUi.row('✅', 'Creato:', `tra ${humanDelay(delay)}`),
    pluginUi.row('🆔', 'Codice:', item.id),
    pluginUi.row('📝', 'Messaggio:', reminderText)
  ]))
}

export default definePlugin(reminder, {
  name: 'tools-reminder',
  command: ['remind', 'reminder', 'ricordami'],
  category: 'tools',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Crea promemoria personali temporizzati',
  icon: '⏰',
  order: 7,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
