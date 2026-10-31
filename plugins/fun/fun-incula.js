function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

import { performance } from 'perf_hooks'

let handler = async (m, { conn, text }) => {

  let target =
    m.quoted?.sender ||
    m.mentionedJid?.[0] ||
    text?.trim()

  if (!target) {
    return conn.reply(m.chat, `𝐓𝐚𝐠𝐠𝐚 𝐜𝐡𝐢 𝐯𝐮𝐨𝐢 𝐢𝐧𝐜𝐮𝐥𝐚𝐫𝐞.`, m)
  }

  if (!target.includes('@s.whatsapp.net')) {
    target = target.split('@')[0] + '@s.whatsapp.net'
  }

  const frames = [
    "● █▀█▄  Ɑ͞ ̶͞ ̶͞ ̶͞ لں͞",
    "୧ ̶͞● █▀█▄ لں͞",
    "● █▀█▄  Ɑ͞ ̶͞ ̶͞ ̶͞ لں͞",
    "୧ ̶͞● █▀█▄ لں͞", 
    "● █▀█▄Ɑ͞ ̶͞ ̶͞ ̶͞ لں͞", 

  ]
  const ANIMATION_DELAY = 450

  const msg = await conn.sendMessage(m.chat, { text: frames[0] }, { quoted: m })

  for (let i = 1; i < frames.length; i++) {
    await new Promise(r => setTimeout(r, ANIMATION_DELAY))
    await conn.sendMessage(m.chat, {
      edit: msg.key,
      text: frames[i]
    }).catch(() => {})
  }

  await conn.sendMessage(m.chat, {
    edit: msg.key,
    text: `
 @${target.split('@')[0]} 𝐥'𝐡𝐚 𝐩𝐫𝐞𝐬𝐨 𝐧𝐞𝐥 𝐜𝐮𝐥𝐨 𝐝𝐚 @${m.sender.split('@')[0]} 

> @${target.split('@')[0]} 𝒉𝒂𝒊 𝒈𝒐𝒅𝒖𝒕𝒐? 😏
    `.trim(),
    mentions: [m.sender, target]
  }).catch(() => {})

}

handler.help = ['sega @utente']
handler.tags = ['fun']
handler.command = /^(incula)$/i

export default handler