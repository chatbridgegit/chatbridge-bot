import axios from 'axios'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { bold } from '../lib/bold.js'
import { definePlugin } from '../lib/plugin-utils.js'

const databasePath = path.join(process.cwd(), 'storage', 'file-json', 'lastfm_users.json')
const databaseDir = path.dirname(databasePath)

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true })
}

const getDB = () => {
  try {
    if (!fs.existsSync(databasePath)) return {}
    return JSON.parse(fs.readFileSync(databasePath, 'utf-8'))
  } catch {
    return {}
  }
}

const saveDB = data => {
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2))
}

const LASTFM_API_KEY = process.env.LASTFM_API_KEY || 'ec57ba14a3e88ccaaadec22295f7a39a'
const DEFAULT_COVER = path.join(process.cwd(), 'media', 'unimmagine.jpg')
const PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f'
const LIST_SIZE = 10
const COMPARE_COMMANDS = ['taste', 'compare', 'compatibilita', 'commonartists']

const validPeriodsMap = {
  sempre: 'overall',
  settimana: '7day',
  mese: '1month',
  '3mesi': '3month',
  '6mesi': '6month',
  anno: '12month'
}

async function apiCall(method, params = {}) {
  try {
    const query = new URLSearchParams({
      method,
      api_key: LASTFM_API_KEY,
      format: 'json',
      ...params
    })
    const res = await axios.get(`https://ws.audioscrobbler.com/2.0/?${query}`, { timeout: 10000 })
    if (res.data?.error) return { error: res.data.error, message: res.data.message }
    return res.data
  } catch (e) {
    return {
      error: e.response?.status || 'Unknown',
      message: e.response?.data?.message || e.message
    }
  }
}

function getDefaultCover() {
  if (fs.existsSync(DEFAULT_COVER)) {
    const ext = path.extname(DEFAULT_COVER).toLowerCase()
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
    return `data:${mime};base64,${fs.readFileSync(DEFAULT_COVER).toString('base64')}`
  }
  const fallbackPath = path.join(process.cwd(), 'baguette.jpg')
  if (fs.existsSync(fallbackPath)) {
    return `data:image/jpeg;base64,${fs.readFileSync(fallbackPath).toString('base64')}`
  }
  return 'https://placehold.co/600x600/png'
}

function toImage(cover) {
  if (typeof cover === 'string' && cover.startsWith('data:')) {
    return Buffer.from(cover.split(',')[1], 'base64')
  }
  return { url: cover || DEFAULT_COVER }
}

function pickCover(images) {
  const sizes = ['mega', 'extralarge', 'large', 'medium', 'small']
  if (!Array.isArray(images)) return null
  for (const size of sizes) {
    const cover = images.find(i => i.size === size)?.['#text']
    if (cover && cover.trim() !== '' && !cover.includes(PLACEHOLDER_HASH)) return cover
  }
  return null
}

async function fetchCover(lastFmImages, query, isArtist = false) {
  const direct = pickCover(lastFmImages)
  if (direct) return direct

  if (!lastFmImages || lastFmImages.length === 0) {
    const method = isArtist ? 'artist.getinfo' : 'track.getinfo'
    const params = isArtist
      ? { artist: query }
      : { track: query.split(' ').slice(1).join(' '), artist: query.split(' ')[0] }
    const info = await apiCall(method, params)
    if (!info.error) {
      const images = isArtist ? info.artist?.image : info.track?.album?.image || info.track?.image
      const found = pickCover(images)
      if (found) return found
    }
  }

  return getDefaultCover()
}

const escapeXml = str => String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const cut = (str, max) => {
  const value = String(str ?? '')
  return value.length > max ? `${value.substring(0, max)}...` : value
}

async function generateGlassCard({ coverUrl, trackName, artistName, userPlaycount, globalPlaycount, listeners, username, isNowPlaying }) {
  let coverBuffer
  try {
    if (String(coverUrl).startsWith('data:')) {
      coverBuffer = Buffer.from(String(coverUrl).split(',')[1], 'base64')
    } else {
      const response = await axios.get(coverUrl, { responseType: 'arraybuffer', timeout: 5000 })
      coverBuffer = Buffer.from(response.data)
    }
    await sharp(coverBuffer).metadata()
  } catch {
    coverBuffer = await sharp({
      create: { width: 400, height: 400, channels: 3, background: { r: 30, g: 30, b: 40 } }
    }).png().toBuffer()
  }

  const bgBuffer = await sharp(coverBuffer)
    .resize(1200, 700, { fit: 'cover' })
    .blur(45)
    .modulate({ brightness: 0.28, saturation: 1.5 })
    .toBuffer()

  const roundedCover = await sharp(coverBuffer)
    .resize(420, 420, { fit: 'cover' })
    .composite([{
      input: Buffer.from('<svg width="420" height="420" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="420" height="420" rx="28" ry="28"/></svg>'),
      blend: 'dest-in'
    }])
    .png()
    .toBuffer()

  const coverBase64 = `data:image/png;base64,${roundedCover.toString('base64')}`
  const statusText = isNowPlaying ? '● ORA IN ASCOLTO' : '● ULTIMO ASCOLTATO'

  const svg = `
  <svg width="1200" height="700" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.16)"/>
        <stop offset="100%" stop-color="rgba(255, 255, 255, 0.04)"/>
      </linearGradient>
      <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.12)"/>
        <stop offset="100%" stop-color="rgba(255, 255, 255, 0.03)"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.45"/>
      </filter>
    </defs>

    <style>
      .title { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; 
        font-weight: 700; 
        font-size: 38px; 
        fill: #ffffff; 
        letter-spacing: -0.8px;
      }
      .artist { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif; 
        font-weight: 500; 
        font-size: 24px; 
        fill: #94a3b8; 
      }
      .status { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif; 
        font-weight: 700; 
        font-size: 13px; 
        fill: #ff4757; 
        letter-spacing: 2px; 
      }
      .label { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif; 
        font-weight: 600; 
        font-size: 11px; 
        fill: #64748b; 
        letter-spacing: 1.2px; 
      }
      .value { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; 
        font-weight: 700; 
        font-size: 24px; 
        fill: #ffffff; 
      }
      .user { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; 
        font-weight: 700; 
        font-size: 24px; 
        fill: #4ade80; 
      }
    </style>

    <rect x="60" y="60" width="1080" height="580" rx="40" ry="40" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="1.5" />

    <g filter="url(#shadow)">
      <image href="${coverBase64}" x="110" y="100" width="420" height="420" />
    </g>

    <text x="580" y="135" class="status">${statusText}</text>
    <text x="580" y="195" class="title">${escapeXml(cut(trackName, 24))}</text>
    <text x="580" y="238" class="artist">${escapeXml(cut(artistName, 28))}</text>

    <rect x="580" y="280" width="245" height="105" rx="22" ry="22" fill="url(#boxGrad)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
    <text x="610" y="320" class="label">I TUOI ASCOLTI</text>
    <text x="610" y="360" class="value">${escapeXml(userPlaycount)}</text>

    <rect x="845" y="280" width="245" height="105" rx="22" ry="22" fill="url(#boxGrad)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
    <text x="875" y="320" class="label">ASCOLTI GLOBALI</text>
    <text x="875" y="360" class="value">${escapeXml(globalPlaycount)}</text>

    <rect x="580" y="405" width="245" height="105" rx="22" ry="22" fill="url(#boxGrad)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
    <text x="610" y="445" class="label">UTENTE</text>
    <text x="610" y="485" class="user">@${escapeXml(cut(username, 14))}</text>

    <rect x="845" y="405" width="245" height="105" rx="22" ry="22" fill="url(#boxGrad)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
    <text x="875" y="445" class="label">ASCOLTATORI</text>
    <text x="875" y="485" class="value">${escapeXml(listeners)}</text>
  </svg>
  `

  return sharp(bgBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer()
}

function resolveTargetJid(m, target) {
  const mentioned = m.mentionedJid?.[0]
  if (mentioned) return mentioned
  const raw = String(target || '').trim()
  if (/@(s\.whatsapp\.net|lid)$/.test(raw)) return raw
  const digits = raw.replace(/\D/g, '')
  return digits ? `${digits}@s.whatsapp.net` : null
}

function handleFire(targetJid, senderJid, trackName, conn, m) {
  if (targetJid === senderJid) {
    conn.sendMessage(m.chat, { text: bold('❌ Non puoi metterti 🔥 da solo') }, { quoted: m })
    return false
  }

  if (!global.db.data.users[targetJid]) global.db.data.users[targetJid] = {}
  const target = global.db.data.users[targetJid]
  target.fuochi = (target.fuochi || 0) + 1

  conn.sendMessage(m.chat, {
    text: `🔥 @${senderJid.split('@')[0]} ha messo 🔥 a *"${trackName}"* di @${targetJid.split('@')[0]}\n❤️ Like totali: *${target.fuochi}*`,
    mentions: [senderJid, targetJid]
  }, { quoted: m })

  return true
}

function handleFireTop(conn, m) {
  const users = Object.entries(global.db.data.users || {})
    .filter(([, user]) => Number(user.fuochi) > 0)
    .sort(([, a], [, b]) => Number(b.fuochi) - Number(a.fuochi))
    .slice(0, 10)

  if (!users.length) return m.reply(bold('❌ Nessuno ha ancora ricevuto like.'))

  const medals = ['🥇', '🥈', '🥉']
  const lines = users.map(([jid, user], index) => {
    const position = medals[index] || `${index + 1}.`
    return `${position} @${jid.split('@')[0]} — *${Number(user.fuochi)} like*`
  })

  return conn.sendMessage(m.chat, {
    text: `🏆 *Classifica Like / Cur*\n\n${lines.join('\n')}`,
    mentions: users.map(([jid]) => jid)
  }, { quoted: m })
}

async function weeklyRange(user) {
  const res = await apiCall('user.getweeklychartlist', { user })
  if (res.error) return { failure: `❌ Errore Last.fm: ${res.message}` }
  const charts = res.weeklychartlist?.chart || []
  if (!charts.length) return { failure: '❌ Nessuna chart settimanale trovata.' }
  const latest = charts[charts.length - 1]
  const from = parseInt(latest.from)
  const to = parseInt(latest.to)
  return {
    from,
    to,
    label: `${new Date(from * 1000).toLocaleDateString('it-IT')} - ${new Date(to * 1000).toLocaleDateString('it-IT')}`
  }
}

const formatNumber = value => parseInt(value || 0).toLocaleString('it-IT')
const trimTitle = (name, index) => `${index + 1}. ${cut(name, 50)}`

const handler = async (m, { conn, usedPrefix, command, text }) => {
  const db = getDB()

  if (['topfire', 'classificafuoco', 'classificafire', 'toplike', 'topcur'].includes(command)) {
    return handleFireTop(conn, m)
  }

  if (command === 'fire') {
    const [target, ...rest] = text.split('|')
    const track = rest.join('|').trim()
    if (!target?.trim() || !track) {
      return m.reply(bold(`❌ Uso: ${usedPrefix}fire @utente|nome brano`))
    }
    const targetJid = resolveTargetJid(m, target)
    if (!targetJid) return m.reply(bold('❌ Utente non valido.'))
    handleFire(targetJid, m.sender, track, conn, m)
    return
  }

  if (['setuser', 'impostauser', 'lastfmset'].includes(command)) {
    const username = text.trim()
    if (!username) return m.reply(bold(`❌ Uso: ${usedPrefix}${command} <username>`))
    db[m.sender] = username
    saveDB(db)
    return m.reply(bold(`✅ Username *${username}* collegato al tuo account!`))
  }

  if (!LASTFM_API_KEY) return m.reply(bold('❌ Errore: API Key Last.fm mancante.'))

  const log = (...args) => console.log('[tools-cur]', command, ...args)

  const run = async fn => {
    const started = Date.now()
    log('avvio')
    try {
      await conn.sendPresenceUpdate('composing', m.chat).catch(() => {})
      return await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout dopo 40s')), 40000))
      ])
    } catch (e) {
      console.error(`[tools-cur] ${command} fallito:`, e)
      const msg = bold(`❌ Errore ${command}: ${e.message}`)
      try {
        return await m.reply(msg)
      } catch {
        return conn.sendMessage(m.chat, { text: msg }).catch(() => {})
      }
    } finally {
      log(`fine in ${Date.now() - started}ms`)
      await conn.sendPresenceUpdate('paused', m.chat).catch(() => {})
    }
  }

  const sendListResponse = async (header, cards) => {
    let listText = `${header}\n\n`
    cards.forEach((item, index) => {
      listText += `*${index + 1}.* ${item.title.replace(/^\d+\.\s/, '')}\n`
      if (item.body) {
        listText += item.body.split('\n').map(line => `_${line}_`).join('\n') + '\n'
      }
      listText += '\n'
    })
    return conn.sendMessage(m.chat, {
      image: toImage(cards[0]?.cover),
      caption: listText.trim()
    }, { quoted: m })
  }

  if (COMPARE_COMMANDS.includes(command)) {
    return run(async () => {
      const words = text.trim().split(/\s+/).filter(Boolean)
      let user1 = db[m.sender]
      let user2

      if (m.mentionedJid?.length) {
        user2 = db[m.mentionedJid[0]]
        if (!user2) return m.reply(bold("⚠️ L'utente taggato non ha registrato il suo username Last.fm."))
      } else if (words.length >= 2) {
        user1 = words[0]
        user2 = words[1]
      } else if (words.length === 1) {
        user2 = words[0]
      }

      if (!user1) return m.reply(bold(`⚠️ Registrati con: *${usedPrefix}setuser <username>*`))
      if (!user2) return m.reply(bold(`❌ Uso: ${usedPrefix}${command} <username2> o tagga un utente registrato.`))

      const res1 = await apiCall('user.gettopartists', { user: user1, limit: 50, period: 'overall' })
      if (res1.error) return m.reply(bold(`❌ Errore Last.fm per ${user1}: ${res1.message}`))
      const res2 = await apiCall('user.gettopartists', { user: user2, limit: 50, period: 'overall' })
      if (res2.error) return m.reply(bold(`❌ Errore Last.fm per ${user2}: ${res2.message}`))

      const toMap = res => new Map((res.topartists?.artist || []).map(a => [
        a.name.toLowerCase(),
        { name: a.name, playcount: parseInt(a.playcount) || 0 }
      ]))
      const map1 = toMap(res1)
      const map2 = toMap(res2)
      const common = [...map1.keys()].filter(key => map2.has(key))

      if (command === 'commonartists') {
        if (!common.length) return m.reply(bold('❌ Nessun artista in comune trovato.'))
        common.sort((a, b) => (map2.get(b).playcount + map1.get(b).playcount) - (map2.get(a).playcount + map1.get(a).playcount))
        const cards = await Promise.all(common.slice(0, LIST_SIZE).map(async (key, index) => {
          const artistName = map1.get(key).name
          const info = await apiCall('artist.getinfo', { artist: artistName })
          const cover = info.error ? getDefaultCover() : await fetchCover(info.artist?.image, artistName, true)
          return { cover, title: `${index + 1}. ${artistName}`, body: '' }
        }))
        return sendListResponse(`🎤 *Artisti in Comune tra @${user1} e @${user2}* (Top ${LIST_SIZE})`, cards)
      }

      const all = new Set([...map1.keys(), ...map2.keys()])
      const vec1 = []
      const vec2 = []
      for (const key of all) {
        vec1.push(map1.get(key)?.playcount || 0)
        vec2.push(map2.get(key)?.playcount || 0)
      }
      const dot = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0)
      const norm1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0))
      const norm2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0))
      const score = norm1 === 0 || norm2 === 0 ? 0 : (dot / (norm1 * norm2)) * 100

      common.sort((a, b) => Math.min(map1.get(b).playcount, map2.get(b).playcount) - Math.min(map1.get(a).playcount, map2.get(a).playcount))
      const shared = common.slice(0, 10).map(key => map1.get(key).name)
      const level = score > 80 ? 'Alta' : score > 50 ? 'Media' : 'Bassa'

      const caption = bold(`🔍 *Compatibilità musicale*
👥 @${user1} e @${user2}
📊 Compatibilità: ${score.toFixed(2)}%
📈 Livello: ${level}
🎤 Artisti condivisi: ${common.length}${shared.length ? `\n🎶 In comune: ${shared.slice(0, 5).join(', ')}` : ''}`)

      return conn.sendMessage(m.chat, { text: caption }, { quoted: m })
    })
  }

  const targetUser = m.mentionedJid?.length ? m.mentionedJid[0] : m.sender
  const user = db[targetUser]
  if (!user) {
    return m.reply(bold(`⚠️ ${targetUser === m.sender ? 'Registrati' : "L'utente taggato non ha registrato il suo username"} con: *${usedPrefix}setuser <username>*`))
  }

  if (['cur', 'attuale', 'nowplaying', 'ciccione'].includes(command)) {
    return run(async () => {
      const res = await apiCall('user.getrecenttracks', { user, limit: 1 })
      log('recenti', res.error ? `errore ${res.message}` : 'ok')
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))

      const rawTrack = res.recenttracks?.track
      const track = Array.isArray(rawTrack) ? rawTrack[0] : rawTrack
      if (!track) return m.reply(bold('❌ Nessun brano trovato.'))

      const artistName = track.artist?.['#text'] || track.artist?.name || ''
      const info = await apiCall('track.getInfo', { artist: artistName, track: track.name, username: user })
      log('info brano', info.error ? `errore ${info.message}` : 'ok')
      const trackData = info.error ? {} : info.track || {}
      const cover = await fetchCover(track.image, `${artistName} ${track.name}`)
      log('copertina pronta')
      const isNowPlaying = track['@attr']?.nowplaying === 'true'

      const cardBuffer = await generateGlassCard({
        coverUrl: cover,
        trackName: track.name,
        artistName,
        userPlaycount: Number(trackData.userplaycount || 0).toLocaleString('it-IT'),
        globalPlaycount: Number(trackData.playcount || 0).toLocaleString('it-IT'),
        listeners: Number(trackData.listeners || 0).toLocaleString('it-IT'),
        username: user,
        isNowPlaying
      })
      log('card generata', `${cardBuffer.length} byte`)

      await conn.sendMessage(m.chat, { image: cardBuffer, caption: '' }, { quoted: m })
      log('card inviata')

      const buttons = [
        { buttonId: `${usedPrefix}fire ${targetUser}|${track.name}`, buttonText: { displayText: '🔥' }, type: 1 },
        { buttonId: `${usedPrefix}playaud ${track.name} ${artistName}`, buttonText: { displayText: '🎵 Audio' }, type: 1 },
        { buttonId: `${usedPrefix}playvid ${track.name} ${artistName}`, buttonText: { displayText: '📽️ Video' }, type: 1 }
      ]
      try {
        await conn.sendMessage(m.chat, { text: '🎧 Azioni rapide', footer: ' ', buttons, headerType: 1 }, { quoted: m })
        log('bottoni inviati')
      } catch (e) {
        log('bottoni non inviati:', e.message)
      }
    })
  }

  if (['lastfm', 'profilolastfm', 'lfmprofile'].includes(command)) {
    return run(async () => {
      const res = await apiCall('user.getinfo', { user })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const info = res.user || {}
      const cover = await fetchCover(info.image, user)
      const registered = info.registered?.unixtime
        ? new Date(parseInt(info.registered.unixtime) * 1000).toLocaleDateString('it-IT')
        : 'N/A'
      const age = info.age > 0 ? info.age : 'N/A'
      const gender = info.gender === 'm' ? 'Maschio' : info.gender === 'f' ? 'Femmina' : 'N/A'
      const subscriber = info.subscriber === '1' ? 'Sì' : 'No'

      const caption = bold(`👤 *Profilo Last.fm di ${info.name || user}*
👤 Nome: ${info.realname || info.name || user}
🌍 Paese: ${info.country || 'N/A'}
🎂 Età: ${age}
⚧ Genere: ${gender}
📅 Iscritto dal: ${registered}
🎧 Ascolti totali: ${formatNumber(info.playcount)}
⭐ Subscriber: ${subscriber}
📚 Playlist: ${info.playlists || 0}`)

      return conn.sendMessage(m.chat, { image: toImage(cover), caption }, { quoted: m })
    })
  }

  if (['recent', 'recenti', 'lasttracks'].includes(command)) {
    return run(async () => {
      const res = await apiCall('user.getrecenttracks', { user, limit: LIST_SIZE })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const tracks = [].concat(res.recenttracks?.track || [])
      if (!tracks.length) return m.reply(bold('❌ Nessuna traccia recente trovata.'))

      const cards = await Promise.all(tracks.map(async (track, index) => {
        const artistName = track.artist?.['#text'] || ''
        const cover = await fetchCover(track.image, `${artistName} ${track.name}`)
        const now = track['@attr']?.nowplaying === 'true' ? ' (In Riproduzione)' : ''
        return { cover, title: `${trimTitle(track.name, index)}${now}`, body: `👤 ${artistName}` }
      }))
      return sendListResponse(`🎵 *Tracce Recenti per @${user}*`, cards)
    })
  }

  if (['lovedtracks', 'preferiti', 'favorites'].includes(command)) {
    return run(async () => {
      const res = await apiCall('user.getlovedtracks', { user, limit: LIST_SIZE })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const tracks = [].concat(res.lovedtracks?.track || [])
      if (!tracks.length) return m.reply(bold('❌ Nessuna traccia preferita trovata.'))

      const cards = await Promise.all(tracks.map(async (track, index) => ({
        cover: await fetchCover(track.image, `${track.artist.name} ${track.name}`),
        title: trimTitle(track.name, index),
        body: `👤 ${track.artist.name}`
      })))
      return sendListResponse(`❤️ *Tracce Preferite per @${user}*`, cards)
    })
  }

  if (['friends', 'amici', 'lfmfriends'].includes(command)) {
    return run(async () => {
      const res = await apiCall('user.getfriends', { user, limit: LIST_SIZE })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const friends = [].concat(res.friends?.user || [])
      if (!friends.length) return m.reply(bold('❌ Nessun amico trovato.'))

      const cards = await Promise.all(friends.map(async (friend, index) => {
        const registered = friend.registered?.unixtime
          ? new Date(parseInt(friend.registered.unixtime) * 1000).toLocaleDateString('it-IT')
          : 'N/A'
        return {
          cover: await fetchCover(friend.image, friend.name),
          title: trimTitle(friend.name, index),
          body: `Iscritto dal: ${registered}`
        }
      }))
      return sendListResponse(`👥 *Amici di @${user}*`, cards)
    })
  }

  if (['toptags', 'topgenres'].includes(command)) {
    return run(async () => {
      const res = await apiCall('user.gettoptags', { user, limit: LIST_SIZE })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const tags = [].concat(res.toptags?.tag || [])
      if (!tags.length) return m.reply(bold('❌ Nessun tag trovato.'))

      const cover = getDefaultCover()
      const cards = tags.map((tag, index) => ({
        cover,
        title: trimTitle(tag.name, index),
        body: `Conteggio: ${formatNumber(tag.count)}`
      }))
      return sendListResponse(`🏷️ *Top Tag per @${user}*`, cards)
    })
  }

  if (command === 'personaltags') {
    return run(async () => {
      const [tag, type] = text.trim().toLowerCase().split(/\s+/)
      if (!tag || !type) return m.reply(bold(`❌ Uso: ${usedPrefix}${command} <tag> <artist|album|track>`))
      if (!['artist', 'album', 'track'].includes(type)) return m.reply(bold('❌ Tipo non valido: artist, album, track'))

      const res = await apiCall('user.getpersonaltags', { user, tag, taggingtype: type, limit: LIST_SIZE })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const items = [].concat(res.taggings?.[`${type}s`]?.[type] || [])
      if (!items.length) return m.reply(bold('❌ Nessun elemento trovato.'))

      const isArtist = type === 'artist'
      const cards = await Promise.all(items.map(async (item, index) => {
        const queryName = isArtist ? item.name : `${item.artist.name} ${item.name}`
        return {
          cover: await fetchCover(item.image, queryName, isArtist),
          title: trimTitle(item.name, index),
          body: isArtist ? '' : `👤 ${item.artist.name}`
        }
      }))
      const title = `${tag.charAt(0).toUpperCase() + tag.slice(1)} ${type.charAt(0).toUpperCase() + type.slice(1)}`
      return sendListResponse(`🏷️ *${title} per @${user}*`, cards)
    })
  }

  if (['weeklyartists', 'weeklyartisti'].includes(command)) {
    return run(async () => {
      const range = await weeklyRange(user)
      if (range.failure) return m.reply(bold(range.failure))
      const res = await apiCall('user.getweeklyartistchart', { user, from: range.from, to: range.to })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const artists = [].concat(res.weeklyartistchart?.artist || []).slice(0, LIST_SIZE)
      if (!artists.length) return m.reply(bold('❌ Nessun artista trovato.'))

      const cards = await Promise.all(artists.map(async (artist, index) => ({
        cover: await fetchCover(artist.image, artist.name, true),
        title: trimTitle(artist.name, index),
        body: `▶️ ${formatNumber(artist.playcount)} ascolti`
      })))
      return sendListResponse(`🎤 *Top Artisti Settimanali per @${user} (${range.label})*`, cards)
    })
  }

  if (command === 'weeklyalbums') {
    return run(async () => {
      const range = await weeklyRange(user)
      if (range.failure) return m.reply(bold(range.failure))
      const res = await apiCall('user.getweeklyalbumchart', { user, from: range.from, to: range.to })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const albums = [].concat(res.weeklyalbumchart?.album || []).slice(0, LIST_SIZE)
      if (!albums.length) return m.reply(bold('❌ Nessun album trovato.'))

      const cards = await Promise.all(albums.map(async (album, index) => {
        const artistName = album.artist?.['#text'] || ''
        return {
          cover: await fetchCover(album.image, `${artistName} ${album.name}`),
          title: trimTitle(album.name, index),
          body: `👤 ${artistName}\n▶️ ${formatNumber(album.playcount)} ascolti`
        }
      }))
      return sendListResponse(`📀 *Top Album Settimanali per @${user} (${range.label})*`, cards)
    })
  }

  if (['weeklytracks', 'weeklycanzoni'].includes(command)) {
    return run(async () => {
      const range = await weeklyRange(user)
      if (range.failure) return m.reply(bold(range.failure))
      const res = await apiCall('user.getweeklytrackchart', { user, from: range.from, to: range.to })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const tracks = [].concat(res.weeklytrackchart?.track || []).slice(0, LIST_SIZE)
      if (!tracks.length) return m.reply(bold('❌ Nessuna canzone trovata.'))

      const cards = await Promise.all(tracks.map(async (track, index) => {
        const artistName = track.artist?.['#text'] || ''
        return {
          cover: await fetchCover(track.image, `${artistName} ${track.name}`),
          title: trimTitle(track.name, index),
          body: `👤 ${artistName}\n▶️ ${formatNumber(track.playcount)} ascolti`
        }
      }))
      return sendListResponse(`🎵 *Top Canzoni Settimanali per @${user} (${range.label})*`, cards)
    })
  }

  if (['topalbums', 'topalbum'].includes(command)) {
    return run(async () => {
      const periodInput = text.trim().toLowerCase() || 'mese'
      const period = validPeriodsMap[periodInput]
      if (!period) return m.reply(bold(`❌ Periodo non valido. Usa: ${Object.keys(validPeriodsMap).join(', ')}`))

      const res = await apiCall('user.gettopalbums', { user, limit: LIST_SIZE, period })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const albums = [].concat(res.topalbums?.album || [])
      if (!albums.length) return m.reply(bold('❌ Nessun album trovato.'))

      const cards = await Promise.all(albums.map(async (album, index) => ({
        cover: await fetchCover(album.image, `${album.artist.name} ${album.name}`),
        title: trimTitle(album.name, index),
        body: `👤 ${album.artist.name}\n▶️ ${formatNumber(album.playcount)} ascolti`
      })))
      return sendListResponse(`📀 *Top Album per @${user} (${periodInput})*`, cards)
    })
  }

  if (['toptracks', 'topcanzoni'].includes(command)) {
    return run(async () => {
      const periodInput = text.trim().toLowerCase() || 'mese'
      const period = validPeriodsMap[periodInput]
      if (!period) return m.reply(bold(`❌ Periodo non valido. Usa: ${Object.keys(validPeriodsMap).join(', ')}`))

      const res = await apiCall('user.gettoptracks', { user, limit: LIST_SIZE, period })
      if (res.error) return m.reply(bold(`❌ Errore Last.fm: ${res.message}`))
      const tracks = [].concat(res.toptracks?.track || [])
      if (!tracks.length) return m.reply(bold('❌ Nessuna canzone trovata.'))

      const cards = await Promise.all(tracks.map(async (track, index) => ({
        cover: await fetchCover(track.image, `${track.artist.name} ${track.name}`),
        title: trimTitle(track.name, index),
        body: `👤 ${track.artist.name}\n▶️ ${formatNumber(track.playcount)} ascolti`
      })))
      return sendListResponse(`🎵 *Top Canzoni per @${user} (${periodInput})*`, cards)
    })
  }
}

export default definePlugin(handler, {
  name: 'tools-cur',
  command: [
    'setuser', 'impostauser', 'lastfmset',
    'cur', 'attuale', 'nowplaying', 'ciccione',
    'lastfm', 'profilolastfm', 'lfmprofile',
    'recent', 'recenti', 'lasttracks',
    'lovedtracks', 'preferiti', 'favorites',
    'friends', 'amici', 'lfmfriends',
    'toptags', 'topgenres',
    'personaltags',
    'weeklyartists', 'weeklyartisti',
    'weeklyalbums',
    'weeklytracks', 'weeklycanzoni',
    'topalbums', 'topalbum',
    'toptracks', 'topcanzoni',
    'taste', 'compare', 'compatibilita',
    'commonartists', 'fire', 'topfire', 'classificafuoco', 'classificafire', 'toplike', 'topcur'
  ],
  category: 'tools',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Comandi Last.fm: ora in ascolto, profilo, classifiche e compatibilità musicale',
  icon: '🎧',
  order: 2
})