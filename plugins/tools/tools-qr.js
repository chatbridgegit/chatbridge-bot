import QRCode from 'qrcode'
import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const MAX_PAYLOAD_LENGTH = 2048

function getPayload(text, args) {
  return String(text || args?.join(' ') || '').trim()
}

async function qr(m, { text, args, usedPrefix, command }) {
  const payload = getPayload(text, args)
  if (!payload) {
    return m.reply(pluginUi.box('🔳 QR Code', [
      pluginUi.row('ℹ️', 'Uso:', `${usedPrefix}${command} <testo o link>`),
      pluginUi.row('✨', 'Esempio:', `${usedPrefix}${command} https://chatunity.it`)
    ]))
  }

  if (payload.length > MAX_PAYLOAD_LENGTH) {
    return m.reply(pluginUi.box('⚠️ QR Code', [
      pluginUi.row('🚫', 'Limite:', `${MAX_PAYLOAD_LENGTH} caratteri massimi`)
    ]))
  }

  try {
    const image = await QRCode.toBuffer(payload, {
      type: 'png',
      width: 768,
      margin: 2,
      errorCorrectionLevel: 'M'
    })

    return this.sendMessage(m.chat, {
      image,
      caption: pluginUi.box('🔳 QR Code', [
        pluginUi.row('📦', 'Contenuto:', payload.length > 120 ? `${payload.slice(0, 117)}...` : payload),
        pluginUi.row('🛡️', 'Affidabilità:', 'Media')
      ])
    }, { quoted: m })
  } catch (error) {
    console.error('[tools-qr]', error)
    return m.reply(pluginUi.box('⚠️ QR Code', [
      pluginUi.row('🚫', 'Stato:', 'Impossibile generare il QR code')
    ]))
  }
}

export default definePlugin(qr, {
  name: 'tools-qr',
  command: ['qr', 'qrcode'],
  category: 'tools',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Genera un QR code da testo, link o dati',
  icon: '🔳',
  order: 3,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
