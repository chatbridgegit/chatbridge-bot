import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const travaPatterns = [
  'wa.me/settings', 'OhMyBruxo_bot', '@gutoxtazv9', '🤨? trava', 'mpk', '드림 가이', '𝐂𝐋͢𝐢𝚵𝐍͢𝐓',
  'dg_xeon', '👻 𞋯𝘽ɼ᷐᪷᷂᪹᪱પซٱٱ᷐᪷᷂᪹᪱ііИ›‹›𝗡᷐᷂᪹᪱ﻉɼɗ᷐᪷᷂᪹᪱ 💀', 'ᗷᖇᑘ᙭ᓍᗱᓰᘉᘜᓍᕲ',
  '@120363161387074144@g.us', '🤷🏻‍♂️ - FAZER O QUE SOU FODA - 🤷🏻‍♂️', '⟠ BRU͢XiiN CLiE͢NT', '¿ --- 𝐒𝐢𝐗 𝐁𝐮𝐆 --- ?',
  'Sr.Bruxo.Mp5', '𝚂𝚛𝙱𝚛𝚞𝚡𝚘𝙼𝚙𝟻', '𝆆𝆅🌟𝅿𝅿𝅿𝅿𝆆͟ • ͡ᖲ̡͟᷍Ʀ𝅿⩏ׂ✗ɨ𝅿⩎𝅿𝅿᷍❡͟០ᖱ ͜͡$͜͡ ៣ׂ͟᷍ϦȤ𝅿͟ɨׂ᷍⩎ • 𝅿𝅿𝆅𝆆͟͡🌟𝆅ثث׀',
  '@srbruxomp5', '⵰⃟👑᳞̼ᷘ᷅ᷣ᷁̀ ⃤𝔾𝕦𝕥𝕠̵̺̱᠊ⷮⷵⷨⷠⷯ⃟𝕚̹̹̹ຳ࿆𝕕̸ⷪⷭⷣ𝐳𝐢ᤩ⃝࿆𝐧͢Ｗ̶̸᭄͕࿆ⷼⷱⷳⷧⷡⷦⷹᷙ᳐ᷡ᷁ｅｂ⃢࿆͢⚡️ཽཽ႓⵰̹̹̹̹̹̹̹',
  '؂ن؃؄ٽ؂ن؃؄ٽ', '乙ħιᵃηⒷＵﻮᔕ', '𐏓꯭. ᬊ͜͡𝑹Σ𝑯𝑴𝑨𝑵ꫂ⃟🇵🇰', 'Ø‚Ù†ØƒØ„Ù½Ø‚Ù†ØƒØ„Ù½', 'ຮ₮ཞศV꙰ศ ๖ມG꙰ཀ͜͡✅⃟╮', 'S̸Y꙰̸S꙰̸T꙰̸E꙰̸M꙰̸'
]

function chatOf(m) {
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  if (typeof chat.antiTraba !== 'boolean') chat.antiTraba = true
  return chat
}

async function before(m, { conn, isAdmin, isBotAdmin } = {}) {
  const text = String(m.text || '')
  const rawMessage = m.message || {}
  const isTrava = travaPatterns.some(pattern => text.toLowerCase().includes(pattern.toLowerCase())) || /[\0\v]/.test(text) || !!rawMessage.buttonsMessage || !!rawMessage.listMessage || !!rawMessage.templateMessage || !!rawMessage.interactiveMessage
  if (!m?.isGroup || m.isAuthenticatedSelf || isAdmin || !isBotAdmin || !chatOf(m).antiTraba || !isTrava) return false
  m.commandBlocked = true
  const user = `@${m.sender.split('@')[0]}`
  await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: !!m.key.fromMe, id: m.key.id, participant: m.key.participant || m.senderPn || m.sender } }).catch(() => {})
  await conn.sendMessage(m.chat, { text: `𝐏𝐎𝐒𝐒𝐈𝐁𝐈𝐋𝐄 𝐖𝐀-𝐁𝐔𝐆 𝐑𝐈𝐋𝐄𝐕𝐀𝐓𝐎\n\n𝐖𝐀-𝐁𝐔𝐆 𝐄𝐋𝐋𝐈𝐌𝐈𝐍𝐀𝐓𝐎\n\n\n𝐁𝐘𝐄 𝐁𝐘𝐄: ${user}`, mentions: [m.sender] }).catch(() => {})
  await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {})
  return true
}

async function toggle(m, extra) {
  const chat = chatOf(m); const value = String(extra.text || '').trim().toLowerCase()
  if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('🧱 Antitraba', [pluginUi.row(chat.antiTraba ? '✅' : '❌', 'Stato:', chat.antiTraba ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antitraba on|off')]))
  chat.antiTraba = value === 'on'; global.markDbDirty?.()
  return m.reply(pluginUi.box('🧱 Antitraba', [pluginUi.row(chat.antiTraba ? '✅' : '❌', 'Stato:', chat.antiTraba ? 'attivato' : 'disattivato')]))
}

export default definePlugin(toggle, { name: 'feature-antitraba', command: 'antitraba', category: 'protection', target: 'group', roles: ['admin', 'owner'], description: 'Blocca testo ripetuto e anomalo', icon: '🧱', permissions: { roles: ['admin', 'owner'] } }, { group: true, before })
