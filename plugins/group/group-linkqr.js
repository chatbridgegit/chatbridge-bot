import QRCode from 'qrcode'
import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'

async function linkQr(m, extra) {
  if (typeof this.groupInviteCode !== 'function') {
    return m.reply(pluginUi.box('⚠️ QR Gruppo', [
      pluginUi.row('🚫', 'Stato:', 'API link gruppo non disponibile')
    ]))
  }
  const code = await this.groupInviteCode(m.chat)
  if (!code) {
    return m.reply(pluginUi.box('⚠️ QR Gruppo', [
      pluginUi.row('🚫', 'Stato:', 'WhatsApp non ha restituito un link valido')
    ]))
  }
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const link = `https://chat.whatsapp.com/${code}`
  const qr = await QRCode.toBuffer(link, {
    type: 'png',
    width: 768,
    margin: 2,
    errorCorrectionLevel: 'M'
  })

  return this.sendMessage(m.chat, {
    image: qr,
    caption: pluginUi.box('🔳 QR Gruppo', [
      pluginUi.row('👥', 'Gruppo:', metadata.subject || m.chat),
      pluginUi.row('🔗', 'Link:', link)
    ])
  }, { quoted: m })
}

export default definePlugin(linkQr, {
  name: 'group-link-qr',
  command: ['linkqr'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Genera il QR del link di invito',
  icon: '🔳',
  order: 30,
  permissions: { roles: ['mod', 'admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
