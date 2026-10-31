// Codice di svelto.js

import fs from 'fs'

let handler = async (m, { conn }) => {

  const numero = '15813356052@s.whatsapp.net'

  const videoPath = './Storage/image/svelto.mp4'

  if (!fs.existsSync(videoPath)) {
    return m.reply('❌ Video non trovato.')
  }

  await conn.sendMessage(m.chat, {

    video: fs.readFileSync(videoPath),

    caption:
`lei è @${numero.split('@')[0]}, se dovete lavare i piatti, usatela`,

    mentions: [
      numero
    ]

  })

}

handler.command = /^(sve|svelto|sveva|svevo|svetlana)$/i

export default handler