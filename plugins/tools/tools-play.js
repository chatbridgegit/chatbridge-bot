import { definePlugin } from '../../lib/plugin-utils.js'
import yts from 'yt-search'
import axios from 'axios'

const API_BASE = 'https://api.chatunity.it/download/play'
const API_KEY = process.env.CHATUNITY_API_KEY || ''
const API_ORIGIN = 'https://api.chatunity.it'

function cleanFileName(name = 'file') {
  return String(name)
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .slice(0, 80) || 'file'
}

function isYouTubeUrl(text) {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(text)
}

function normalizeYtUrl(text) {
  try {
    if (!isYouTubeUrl(text)) return null

    const url = new URL(text)

    if (url.hostname.toLowerCase().includes('youtu.be')) {
      const id = url.pathname.replace(/^\//, '').trim()
      return id ? `https://www.youtube.com/watch?v=${id}` : null
    }

    return url.toString()
  } catch {
    return null
  }
}

async function resolveVideo(text) {
  if (isYouTubeUrl(text)) {
    const url = normalizeYtUrl(text)
    if (!url) return { vid: null, url: null }

    try {
      const result = await yts(url)
      const vid = result?.videos?.[0] || null

      return {
        vid,
        url: vid?.url || url
      }
    } catch {
      return {
        vid: null,
        url
      }
    }
  }

  const result = await yts(text)
  const vid = result?.videos?.[0] || null

  return {
    vid,
    url: vid?.url || null
  }
}

function apiHeaders() {
  const headers = {
    Accept: 'application/json'
  }

  if (API_KEY) {
    headers.Authorization = `Bearer ${API_KEY}`
  }

  return headers
}

async function downloadFromApi(query, format = 'mp3') {
  const metadataUrl = new URL(API_BASE)

  metadataUrl.searchParams.set('query', query)
  metadataUrl.searchParams.set('format', format)

  const metadataResponse = await axios.get(metadataUrl.toString(), {
    timeout: 300000,
    maxRedirects: 5,
    headers: apiHeaders()
  })

  const metadata = metadataResponse.data

  if (!metadata?.success || !metadata?.downloadUrl) {
    throw new Error(
      metadata?.message ||
      metadata?.error ||
      'Risposta API senza downloadUrl'
    )
  }

  const fileUrl = new URL(metadata.downloadUrl, API_ORIGIN).toString()

  const fileResponse = await axios.get(fileUrl, {
    responseType: 'arraybuffer',
    timeout: 300000,
    maxRedirects: 5,
    headers: {
      ...apiHeaders(),
      Accept: format === 'mp3'
        ? 'audio/mpeg'
        : 'video/mp4'
    }
  })

  const contentType = String(
    fileResponse.headers['content-type'] || ''
  )

  const data = Buffer.from(fileResponse.data)

  if (!data.length) {
    throw new Error('File vuoto ricevuto dall API')
  }

  if (
    contentType.includes('application/json') ||
    contentType.includes('text/html')
  ) {
    throw new Error(
      'L API ha restituito JSON/HTML invece del file multimediale'
    )
  }

  return data
}

async function play(m, { args, command, usedPrefix }) {
  const text = args.join(' ').trim()

  const commandName = String(command || '').toLowerCase()

  const prefix =
    usedPrefix ||
    global.prefissoComandi ||
    global.prefix ||
    '.'

  const isAudioCmd = commandName === 'playaud'
  const isVideoCmd = commandName === 'playvid'

  if (!text) {
    return this.sendMessage(
      m.chat,
      {
        text: `💡 Scrivi: ${prefix}${command} nome canzone oppure URL YouTube`
      },
      { quoted: m }
    )
  }

  try {
    const resolved = await resolveVideo(text)

    const vid = resolved.vid
    const url = resolved.url

    if (!url) {
      return this.sendMessage(
        m.chat,
        { text: '⚠️ Risultato non trovato.' },
        { quoted: m }
      )
    }

    if (commandName === 'play') {
      const title = vid?.title || text
      const thumb =
        vid?.thumbnail ||
        'https://picsum.photos/seed/chatbridgeplay/720/405'

      const views = vid?.views
        ? Number(vid.views).toLocaleString('it-IT')
        : 'N/D'

      const duration = vid?.timestamp || 'N/D'

      return this.sendMessage(
        m.chat,
        {
          image: { url: thumb },
          caption: `╭━━━〔 🎧 PLAY 〕━━━⬣
┃ 📌 Titolo: ${title}
┃ ⏱️ Durata: ${duration}
┃ 👀 Views: ${views}
╰━━━━━━━━━━━━━━⬣

Scegli il formato:`,
          footer: 'ChatBridge Downloader',
          buttons: [
            {
              buttonId: `${prefix}playaud ${url}`,
              buttonText: {
                displayText: '🎵 Audio MP3'
              },
              type: 1
            },
            {
              buttonId: `${prefix}playvid ${url}`,
              buttonText: {
                displayText: '🎬 Video MP4'
              },
              type: 1
            }
          ],
          headerType: 4
        },
        { quoted: m }
      )
    }

    await this.sendMessage(
      m.chat,
      { text: '⏳ Download avviato. Puoi continuare a usare il bot.' },
      { quoted: m }
    )

    // Il download resta fuori dal commandQueue: le richieste successive non aspettano l'API.
    void (async () => {
      try {
        await this.sendMessage(m.chat, {
          react: {
            text: '⚡',
            key: m.key
          }
        })

        const mediaBuffer = await downloadFromApi(
          url,
          isAudioCmd ? 'mp3' : 'mp4'
        )

        if (isAudioCmd) {
          await this.sendMessage(
            m.chat,
            {
              audio: mediaBuffer,
              mimetype: 'audio/mpeg',
              fileName: `${cleanFileName(vid?.title || 'audio')}.mp3`,
              ptt: false
            },
            { quoted: m }
          )
        }

        if (isVideoCmd) {
          await this.sendMessage(
            m.chat,
            {
              video: mediaBuffer,
              mimetype: 'video/mp4',
              fileName: `${cleanFileName(vid?.title || 'video')}.mp4`,
              caption: `✅ Scaricato: ${vid?.title || 'video'}`
            },
            { quoted: m }
          )
        }

        await this.sendMessage(m.chat, {
          react: {
            text: '✅',
            key: m.key
          }
        })
      } catch (error) {
        console.error(
          '[play error]',
          error?.response?.data ||
          error?.message ||
          error
        )

        let message = error?.message || 'Server non raggiungibile.'
        if (error?.response?.status === 401) message = 'Chiave API non valida.'
        else if (error?.response?.status === 413) message = 'File troppo grande.'
        else if (error?.response?.status === 404) message = 'Endpoint Play non trovato.'
        else if (error?.response?.status === 502) message = 'API temporaneamente non raggiungibile.'
        else if (error?.code === 'ECONNABORTED') message = 'Timeout API: il download ha impiegato troppo tempo.'

        await this.sendMessage(
          m.chat,
          { text: `🚀 Play error: ${message}` },
          { quoted: m }
        ).catch(() => {})
      }
    })()
    return
  } catch (error) {
    console.error(
      '[play error]',
      error?.response?.data ||
      error?.message ||
      error
    )

    let message =
      error?.message ||
      'Server non raggiungibile.'

    if (error?.response?.status === 401) {
      message = 'Chiave API non valida.'
    } else if (error?.response?.status === 413) {
      message = 'File troppo grande.'
    } else if (error?.response?.status === 404) {
      message = 'Endpoint Play non trovato.'
    } else if (error?.response?.status === 502) {
      message = 'API temporaneamente non raggiungibile.'
    } else if (error?.code === 'ECONNABORTED') {
      message =
        'Timeout API: il download ha impiegato troppo tempo.'
    }

    await this.sendMessage(
      m.chat,
      {
        text: `🚀 Play error: ${message}`
      },
      { quoted: m }
    )
  }
}

export default definePlugin(play, {
  name: 'play',
  command: ['play', 'playaud', 'playvid'],
  category: 'tools',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Scarica audio MP3 o video MP4 da YouTube',
  icon: '🎵',
  order: 1,
  permissions: {
    roles: ['user', 'mod', 'admin', 'owner']
  }
})
