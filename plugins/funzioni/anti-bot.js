import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

let puliti = []

function rilevaDispositivoCheck(msgID = '') {
  if (!msgID) return 'sconosciuto'
  if (/^[a-zA-Z]+-[a-fA-F0-9]+$/.test(msgID)) return 'bot'
  if (msgID.startsWith('false_') || msgID.startsWith('true_')) return 'web'
  if (msgID.startsWith('3EB0') && /^[A-Z0-9]+$/.test(msgID)) return 'webbot'
  if (msgID.includes(':')) return 'desktop'
  if (/^[A-F0-9]{32}$/i.test(msgID)) return 'android'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msgID)) return 'ios'
  if (/^[A-Z0-9]{20,25}$/i.test(msgID) && !msgID.startsWith('3EB0')) return 'ios'
  if (msgID.startsWith('3EB0')) return 'android_old'
  return 'sconosciuto'
}

function chatOf(m) {
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  if (typeof chat.antibot !== 'boolean') chat.antibot = false
  return chat
}

async function before(m, { conn, isAdmin, isOwner, isSam, isBotAdmin } = {}) {
  if (m.isBaileys && m.isAuthenticatedSelf) return true
  const chat = chatOf(m)
  if (!m?.isGroup || !chat.antibot || !m.sender || !m.key?.id) return false
  if (isAdmin || isOwner || isSam || m.fromMe || m.isAuthenticatedSelf) return false

  const msgID = m.key?.id
  const device = rilevaDispositivoCheck(msgID)
  const sospettiDispositivi = ['bot', 'web', 'webbot']
  if (!sospettiDispositivi.includes(device)) return false

  let metadata = {}
  try {
    metadata = await conn.groupMetadata(m.chat)
  } catch {
    return false
  }

  const botNumber = conn.user.jid
  const autorizzati = [botNumber, metadata.owner, ...(metadata.participants?.filter(p => p.admin).map(p => p.id) || []), ...puliti]
  if (autorizzati.includes(m.sender)) return false

  if (!isBotAdmin) {
    await conn.sendMessage(m.chat, {
      text: pluginUi.box('🛑 AntiBot', [
        pluginUi.row('⚠️', 'Rilevato:', `Utente sospetto (@${m.sender.split('@')[0]}) con dispositivo ${device.toUpperCase()}`),
        pluginUi.row('❌', 'Azione:', 'Impossibile rimuovere, non sono amministratore.')
      ]),
      mentions: [m.sender]
    }).catch(() => {})
    return true
  }

  try {
    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
    await conn.sendMessage(m.chat, {
      text: pluginUi.box('🛑 AntiBot', [
        pluginUi.row('👤', 'Utente:', `@${m.sender.split('@')[0]}`),
        pluginUi.row('🛠️', 'Dispositivo:', device.toUpperCase()),
        pluginUi.row('✅', 'Stato:', 'Rimosso con successo')
      ]),
      mentions: [m.sender]
    }).catch(() => {})
  } catch (error) {
    console.error('Errore gestione antibot:', error)
  }

  return true
}

async function toggle(m, extra) {
  const chat = chatOf(m)
  const value = String(extra.text || '').trim().toLowerCase()
  if (!['on', 'off'].includes(value)) {
    return m.reply(pluginUi.box('🛑 AntiBot', [
      pluginUi.row(chat.antibot ? '✅' : '❌', 'Stato:', chat.antibot ? 'attivo' : 'disattivo'),
      pluginUi.row('ℹ️', 'Uso:', '.antibot on|off')
    ]))
  }
  chat.antibot = value === 'on'
  global.markDbDirty?.()
  return m.reply(pluginUi.box('🛑 AntiBot', [
    pluginUi.row(chat.antibot ? '✅' : '❌', 'Stato:', chat.antibot ? 'attivato' : 'disattivato')
  ]))
}

export default definePlugin(toggle, {
  name: 'feature-antibot',
  command: 'antibot',
  category: 'protection',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Rileva e rimuove bot o client sospetti dal gruppo',
  icon: '🛑',
  permissions: { roles: ['admin', 'owner'] }
}, { group: true, before })