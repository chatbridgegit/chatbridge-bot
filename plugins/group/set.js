import { unlink, writeFile } from 'fs/promises'
import { fileTypeFromBuffer } from 'file-type'
import { extname, join, resolve, sep } from 'path'
import { pluginUi } from '../../lib/plugin-font.js'
import { ensureGroupState } from '../../lib/group-state.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { ensureStorageDirectory, storageRoot } from '../../lib/storage.js'

const mediaRoot = storageRoot
const settings = {
  welcome: {
    textKey: 'sWelcome',
    mediaKey: 'sWelcomeMedia',
    typeKey: 'sWelcomeMediaType',
    gifKey: 'sWelcomeIsGif',
    defaultText: 'Benvenuto @user in @group'
  },
  benvenuto: 'welcome',
  addio: {
    textKey: 'sBye',
    mediaKey: 'sByeMedia',
    typeKey: 'sByeMediaType',
    gifKey: 'sByeIsGif',
    defaultText: 'Arrivederci @user'
  },
  bye: 'addio'
}

function getSetting(value) {
  const setting = settings[String(value || '').toLowerCase()]
  return typeof setting === 'string' ? settings[setting] : setting
}

function isStoredMedia(filePath) {
  if (!filePath || typeof filePath !== 'string') return false
  const candidate = resolve(filePath)
  return candidate.startsWith(`${mediaRoot}${sep}`)
}

async function removeMedia(filePath) {
  if (isStoredMedia(filePath)) await unlink(filePath).catch(() => {})
}

function mediaSource(m) {
  const candidates = [m, m?.quoted]
  return candidates.find(candidate => (
    ['imageMessage', 'videoMessage'].includes(candidate?.mtype) &&
    typeof candidate?.download === 'function'
  )) || null
}

async function saveMedia(m, setting, source) {
  const buffer = await source.download()
  if (!buffer || !Buffer.isBuffer(buffer) || !buffer.length) throw new Error('media non scaricabile')
  if (buffer.length > 30 * 1024 * 1024) throw new Error('il media supera il limite di 30 MB')

  const detected = await fileTypeFromBuffer(buffer).catch(() => null)
  const sourceMime = String(source.msg?.mimetype || source.mimetype || '').toLowerCase()
  const mime = String(detected?.mime || sourceMime).toLowerCase()
  const sourceType = source.mtype === 'videoMessage' || mime.startsWith('video/')
  const isGif = source.msg?.gifPlayback === true || mime === 'image/gif' || detected?.ext === 'gif' || extname(source.msg?.fileName || '').toLowerCase() === '.gif'
  const isImage = mime.startsWith('image/')
  if (!isImage && !sourceType) throw new Error('sono supportati solo immagini, GIF e video MP4')

  const extension = detected?.ext || (isGif ? 'gif' : sourceType ? 'mp4' : 'jpg')
  const safeChat = m.chat.replace(/[^a-z0-9_-]/gi, '_')
  const category = setting.textKey === 'sWelcome' ? 'welcome' : 'bye'
  const directory = await ensureStorageDirectory(category)
  const filePath = join(directory, `group-event-${safeChat}-${Date.now()}.${extension}`)
  await writeFile(filePath, buffer)
  return {
    path: filePath,
    type: isGif || sourceType ? 'video' : 'image',
    isGif
  }
}

function usage() {
  return pluginUi.box('⚙️ Impostazioni Gruppo', [
    pluginUi.row('🎉', 'Benvenuto:', '.set welcome <testo>'),
    pluginUi.row('👋', 'Addio:', '.set addio <testo>'),
    pluginUi.row('🖼️', 'Media:', "allega un'immagine/GIF/MP4 oppure rispondi a un media"),
    pluginUi.row('🏷️', 'Tag:', '@user, @group, @desc')
  ])
}

async function setEvent(m, extra) {
  const input = String(extra?.text || '').trim()
  const [requested, ...textParts] = input.split(/\s+/).filter(Boolean)
  const setting = getSetting(requested)
  if (!setting) return m.reply(usage())

  const chat = ensureGroupState(global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {}))
  const text = textParts.join(' ').trim()
  const source = mediaSource(m)
  if (!text && !source) return m.reply(usage())

  let savedMedia = null
  if (source) {
    try {
      savedMedia = await saveMedia(m, setting, source)
    } catch (error) {
      return m.reply(pluginUi.box('⚠️ Media evento', [
        pluginUi.row('🚫', 'Stato:', error.message || 'media non valido'),
        pluginUi.row('ℹ️', 'Supporto:', 'immagine, GIF o MP4 fino a 30 MB')
      ]))
    }
  }

  const oldMedia = chat[setting.mediaKey]
  chat[setting.textKey] = text || chat[setting.textKey] || setting.defaultText
  await removeMedia(oldMedia)

  if (savedMedia) {
    chat[setting.mediaKey] = savedMedia.path
    chat[setting.typeKey] = savedMedia.type
    chat[setting.gifKey] = savedMedia.isGif
  } else {
    delete chat[setting.mediaKey]
    delete chat[setting.typeKey]
    delete chat[setting.gifKey]
  }

  global.markDbDirty?.()
  return m.reply(pluginUi.box(setting.textKey === 'sWelcome' ? '🎉 Benvenuto' : '👋 Addio', [
    pluginUi.row('✅', 'Stato:', 'impostazione salvata'),
    pluginUi.row('📝', 'Testo:', chat[setting.textKey]),
    pluginUi.row('🖼️', 'Media:', savedMedia ? (savedMedia.isGif ? 'GIF' : savedMedia.type) : 'nessuno')
  ]))
}

export default definePlugin(setEvent, {
  name: 'group-set-event',
  command: ['set'],
  customPrefix: /^\./,
  category: 'group',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Imposta testo e media di benvenuto o addio',
  icon: '⚙️',
  order: 84,
  permissions: { roles: ['admin', 'owner'] }
}, { group: true })
