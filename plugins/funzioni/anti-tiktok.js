import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const pattern = /(?:vm|vt)\.tiktok\.com|(?:www\.)?tiktok\.com\//i

function textOf(m) {
  const raw = m.message || {}
  return [m.text, raw.conversation, raw.extendedTextMessage?.text, raw.imageMessage?.caption, raw.videoMessage?.caption, raw.documentMessage?.caption]
    .filter(value => typeof value === 'string').join(' ').replace(/[\u200b\u200c\u200d\uFEFF]/g, '')
}

function chatOf(m) {
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  if (typeof chat.antitiktok !== 'boolean') chat.antitiktok = false
  return chat
}

async function before(m, { conn, isAdmin, isBotAdmin } = {}) {
  if (!m?.isGroup || m.isAuthenticatedSelf || isAdmin || !pattern.test(textOf(m))) return false
  const chat = chatOf(m)
  if (!chat.antitiktok || !isBotAdmin) return false
  m.commandBlocked = true
  const user = global.db.data.users[m.sender] || (global.db.data.users[m.sender] = {})
  user.warn = (user.warn || 0) + 1
  global.markDbDirty?.()

  await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: !!m.key.fromMe, id: m.key.id, participant: m.key.participant || m.senderPn || m.sender } }).catch(() => {})
  if (user.warn >= 3) {
    await conn.sendMessage(m.chat, { text: `⛔ 𝐔𝐓𝐄𝐍𝐓𝐄 𝐑𝐈𝐌𝐎𝐒𝐒𝐎 𝐃𝐎𝐏𝐎 𝟑 𝐀𝐕𝐕𝐄𝐑𝐓𝐈𝐌𝐄𝐍𝐓𝐈: @${m.sender.split('@')[0]}`, mentions: [m.sender] }).catch(() => {})
    try {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
      user.warn = 0
      global.markDbDirty?.()
    } catch {}
    global.markDbDirty?.()
  } else {
    await conn.sendMessage(m.chat, { text: `⚠ 𝐋𝐈𝐍𝐊 𝐓𝐈𝐊 𝐓𝐎𝐊 𝐍𝐎𝐍 𝐒𝐎𝐍𝐎 𝐂𝐎𝐍𝐒𝐄𝐍𝐓𝐈𝐓𝐈\n\n@${m.sender.split('@')[0]}\n\n*${user.warn}/3* ° 𝐀𝐕𝐕𝐄𝐑𝐓𝐈𝐌𝐄𝐍𝐓𝐎`, mentions: [m.sender] }).catch(() => {})
  }
  return true
}

async function toggle(m, extra) {
  const chat = chatOf(m)
  const value = String(extra.text || '').trim().toLowerCase()
  if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('🎵 AntiTiktok', [pluginUi.row(chat.antitiktok ? '✅' : '❌', 'Stato:', chat.antitiktok ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antilinktiktok on|off')]))
  chat.antitiktok = value === 'on'
  global.markDbDirty?.()
  return m.reply(pluginUi.box('🎵 AntiTiktok', [pluginUi.row(chat.antitiktok ? '✅' : '❌', 'Stato:', chat.antitiktok ? 'attivato' : 'disattivato')]))
}

export default definePlugin(toggle, {
  name: 'feature-antilinktiktok', command: ['antilinktiktok', 'antitiktok'], category: 'protection', target: 'group',
  roles: ['admin', 'owner'], description: 'Blocca i link TikTok', icon: '🎵', permissions: { roles: ['admin', 'owner'] }
}, { group: true, before })
