import { addExif } from '../../lib/sticker.js'
import { definePlugin } from '../../lib/plugin-utils.js'

async function watermarkSticker(m, { conn, text }) {
  if (!m.quoted) throw 'rispondi a uno sticker'

  let stickerBuffer = false

  try {
    let [packname, ...author] = text.split('|')
    author = author.join('|')

    const mime = m.quoted.mimetype || ''
    if (!/webp/.test(mime)) throw 'rispondi a uno sticker'

    const image = await m.quoted.download()
    if (!image) throw 'rispondi a uno sticker'

    stickerBuffer = await addExif(image, packname || '', author || '')
  } catch (error) {
    console.error(error)
    if (Buffer.isBuffer(error)) stickerBuffer = error
  }

  if (stickerBuffer) {
    return conn.sendFile(
      m.chat,
      stickerBuffer,
      'wm.webp',
      '',
      m,
      false,
      { asSticker: true }
    )
  }

  throw 'errore'
}

export default definePlugin(watermarkSticker, {
  name: 'tools-wm',
  command: ['wm'],
  category: 'tools',
  target: 'tools',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'ambia nome sticker',
  icon: '🏷️',
  order: 1,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})