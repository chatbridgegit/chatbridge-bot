import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'
import { getGroupAuthorization, getIdentityResolver } from '../../lib/whatsapp-identity.js'

const ANTIPORNO_WINDOW = 5000
const ANTIPORNO_CONFIDENCE = 0.75
const ANTIPORNO_MAX_VIOLATIONS = 3

global.antipornoProcessed = global.antipornoProcessed || new Set()

function getMediaEmoji(mtype) {
  return mtype === 'imageMessage' ? '🖼️' : mtype === 'stickerMessage' ? '🎭' : '📎'
}

function getJidUser(jid) {
  return typeof jid === 'string' ? jid.split('@')[0].split(':')[0] : ''
}

function getViolationState(chat, sender) {
  if (!chat.antipornoViolations || typeof chat.antipornoViolations !== 'object') chat.antipornoViolations = {}
  if (!chat.antipornoViolations[sender] || typeof chat.antipornoViolations[sender] !== 'object') chat.antipornoViolations[sender] = { count: 0, lastAt: 0 }
  return chat.antipornoViolations[sender]
}

async function getGroupParticipant(conn, chatId, identity) {
  const metadata = await conn.groupMetadata(chatId).catch(() => null)
  const metadataTimestamp = global.groupMetaCache?.get?.(chatId)?.timestamp
  const authorization = getGroupAuthorization(
    identity,
    metadata?.participants,
    getIdentityResolver(conn),
    {
      metadataAvailable: !!metadata,
      metadataAge: Number.isFinite(metadataTimestamp) ? Date.now() - metadataTimestamp : 0
    }
  )
  return {
    participant: authorization.participant,
    verified: authorization.verified,
    isAdmin: authorization.isAdmin
  }
}

async function analyzeWithNyckel(buffer) {
  const axios = await import('axios')
  const cheerio = await import('cheerio')
  const { Blob, FormData } = await import('formdata-node')
  const { FormDataEncoder } = await import('form-data-encoder')
  const { Readable } = await import('stream')
  if (buffer.length < 1000 || buffer.length > 10 * 1024 * 1024) throw new Error(`Buffer invalido: ${buffer.length} bytes`)

  const headers = {
    authority: 'www.nyckel.com', origin: 'https://www.nyckel.com', referer: 'https://www.nyckel.com/pretrained-classifiers/nsfw-identifier',
    'user-agent': 'Postify/1.0.0', 'x-requested-with': 'XMLHttpRequest', 'content-type': 'multipart/form-data'
  }
  const res = await axios.default.get('https://www.nyckel.com/pretrained-classifiers/nsfw-identifier', { headers })
  const $ = cheerio.load(res.data)
  const src = $('script[src*="embed-image.js"]').attr('src')
  const functionId = src?.match(/[?&]id=([^&]+)/)?.[1]
  if (!functionId) throw new Error('No Function ID')

  const form = new FormData()
  form.append('file', new Blob([buffer], { type: 'image/jpeg' }), 'image.jpg')
  const encoder = new FormDataEncoder(form)
  const bodyStream = Readable.from(encoder.encode())
  const response = await axios.default.post(`https://www.nyckel.com/v1/functions/${functionId}/invoke`, bodyStream, {
    headers: { ...headers, ...encoder.headers, 'content-length': encoder.headers['content-length'] }, timeout: 30000
  })
  return { isPorn: response.data.labelName === 'Porn', confidence: response.data.confidence || 0 }
}

async function prepareAnalysisBuffer(m, buffer) {
  if (m.mtype !== 'stickerMessage') return buffer
  try {
    const sharp = (await import('sharp')).default
    return await sharp(buffer).jpeg({ quality: 90 }).resize(512, 512, { fit: 'inside' }).toBuffer()
  } catch {
    return buffer
  }
}

function chatOf(m) {
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  if (typeof chat.antiporno !== 'boolean') chat.antiporno = false
  return chat
}

async function all(m) {
  if (!m?.isGroup || !m?.key?.id || (m.mtype !== 'imageMessage' && m.mtype !== 'stickerMessage') || !chatOf(m).antiporno) return
  const marker = `ANTIPORNO_${m.key.id}`
  if (global.antipornoProcessed.has(marker)) return
  global.antipornoProcessed.add(marker)

  try {
    const buffer = await m.download()
    if (!buffer?.length) return
    const analysisBuffer = await prepareAnalysisBuffer(m, buffer)
    if (analysisBuffer.length < 1000) return
    const result = await analyzeWithNyckel(analysisBuffer)
    if (!result.isPorn || result.confidence <= ANTIPORNO_CONFIDENCE) return

    const chat = global.db.data.chats[m.chat]
    const senderKey = m.senderPn || m.sender
    const violationState = getViolationState(chat, senderKey)
    violationState.count += 1
    violationState.lastAt = Date.now()
    global.markDbDirty?.()
    const detectionCount = violationState.count
    const key = { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.sender }
    let deleteSuccess = false
    try {
      await this.sendMessage(m.chat, { delete: key })
      deleteSuccess = true
    } catch {}

    let removalText = `⚠️ Rilevamento *${detectionCount}/${ANTIPORNO_MAX_VIOLATIONS}*.`
    if (detectionCount >= ANTIPORNO_MAX_VIOLATIONS) {
      const targetAuthorization = await getGroupParticipant(this, m.chat, m.identity)
      if (!targetAuthorization.verified) {
        removalText = '⚠️ Ruolo non verificabile in questo momento, nessuna rimozione automatica.'
      } else if (targetAuthorization.isAdmin) {
        removalText = '⚠️ Limite raggiunto, ma l\'utente è admin e non posso rimuoverlo automaticamente.'
      } else {
        try {
          await this.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
          delete chat.antipornoViolations[senderKey]
          global.markDbDirty?.()
          removalText = '⛔ Utente rimosso dal gruppo dopo 3 rilevamenti.'
        } catch {
          removalText = '⚠️ Limite raggiunto, ma non sono riuscito a rimuovere l\'utente dal gruppo.'
        }
      }
    }

    await this.sendMessage(m.chat, {
      text: `🚫 *MATERIALE PORNOGRAFICO RILEVATO*\n\n📊 ${(result.confidence * 100).toFixed(1)}%\n👤 @${m.sender.split('@')[0]}\n📎 ${getMediaEmoji(m.mtype)}\n📌 ${removalText}\n\n${deleteSuccess ? '✅ ELIMINATO' : '❌ BOT NON ADMIN?\n\n> Developed by ChatBridge'}`,
      mentions: [m.sender]
    })
    m.commandBlocked = true
  } catch (error) {
    console.error('Antiporno:', error.message)
  } finally {
    setTimeout(() => global.antipornoProcessed.delete(marker), ANTIPORNO_WINDOW)
  }
}

async function toggle(m, extra) {
  const chat = chatOf(m)
  const value = String(extra.text || '').trim().toLowerCase()
  if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('🔞 Antiporno', [pluginUi.row(chat.antiporno ? '✅' : '❌', 'Stato:', chat.antiporno ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.antiporno on|off')]))
  chat.antiporno = value === 'on'
  global.markDbDirty?.()
  return m.reply(pluginUi.box('🔞 Antiporno', [pluginUi.row(chat.antiporno ? '✅' : '❌', 'Stato:', chat.antiporno ? 'attivato' : 'disattivato')]))
}

export default definePlugin(toggle, { name: 'feature-antiporno', command: 'antiporno', category: 'moderation', target: 'group', roles: ['admin', 'owner'], description: 'Blocca contenuti espliciti', icon: '🔞', permissions: { roles: ['admin', 'owner'] } }, { group: true, all })
