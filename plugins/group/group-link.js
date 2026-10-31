import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, getGroupMetadata } from '../../lib/plugin-utils.js'

async function linkGruppo(m, extra) {
  if (typeof this.groupInviteCode !== 'function') {
    return m.reply(pluginUi.box('⚠️ Link Gruppo', [
      pluginUi.row('🚫', 'Stato:', 'API link gruppo non disponibile')
    ]))
  }
  const code = await this.groupInviteCode(m.chat)
  if (!code) {
    return m.reply(pluginUi.box('⚠️ Link Gruppo', [
      pluginUi.row('🚫', 'Stato:', 'WhatsApp non ha restituito un link valido')
    ]))
  }
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const link = `https://chat.whatsapp.com/${code}`

  return this.sendButton(m.chat, pluginUi.box('🔗 Link Gruppo', [
    pluginUi.row('👥', 'Gruppo:', metadata.subject || m.chat),
    pluginUi.row('🔗', 'Link:', link)
  ]), 'Link di invito del gruppo', null, [], [
    ['Copia link', link]
  ], [], [], m)
}

export default definePlugin(linkGruppo, {
  name: 'group-link',
  command: ['linkgruppo','link'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Mostra e permette di copiare il link di invito del gruppo',
  icon: '🔗',
  order: 20,
  permissions: { roles: ['mod', 'admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
