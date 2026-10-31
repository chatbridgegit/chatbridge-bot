import { definePlugin } from '../../lib/plugin-utils.js'
import { sticker } from '../../lib/sticker.js'
import uploadFile from '../../lib/uploadFile.js'
import uploadImage from '../../lib/uploadImage.js'
import { webp2png } from '../../lib/webp2mp4.js'

import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
ffmpeg.setFfmpegPath(ffmpegStatic)

async function stickerPlugin(m, { args }) {
  let stiker = false

  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''

    if (/webp|image|video/g.test(mime)) {
      const img = await q.download?.()
      if (!img) return

      if (!global.support) {
        global.support = {
          ffmpeg: true, ffprobe: true, ffmpegWebp: true,
          convert: true, magick: false, gm: false, find: false
        }
      }

      const pack = global.packname || ''
      const author = global.author || ''

      try {
        stiker = await sticker(img, false, pack, author)
      } catch {
        let out
        try {
          if (/webp/g.test(mime)) out = await webp2png(img)
          else if (/image/g.test(mime)) out = await uploadImage(img)
          else if (/video/g.test(mime)) out = await uploadFile(img)

          if (typeof out !== 'string') out = await uploadImage(img)

          stiker = await sticker(false, out, pack, author)
        } catch {
          stiker = false
        }
      }
    } else if (args[0]) {
      if (isUrl(args[0])) {
        const pack = global.packname || ''
        const author = global.author || ''
        stiker = await sticker(false, args[0], pack, author)
      } else return
    } else return

  } catch {
    stiker = false
  }

  if (stiker) {
    if (typeof this.sendFile === 'function') {
      return await this.sendFile(m.chat, stiker, 'sticker.webp', '', m, false)
    } else if (typeof this.sendMessage === 'function') {
      return await this.sendMessage(m.chat, { sticker: stiker }, { quoted: m })
    }
  }
}

const isUrl = (text) => {
  return text.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/gi)
}

export default definePlugin(stickerPlugin, {
  name: 'tools-sticker',
  command: ['s', 'sticker'],
  category: 'tools',
  target: 'tools',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Converte immagini, video o link in sticker',
  icon: '🎨',
  order: 1,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})