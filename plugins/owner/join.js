import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

async function join(m, extra) {
  const link = String(extra.args[0] || '').trim()
  const code = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/i)?.[1]
  if (!code || typeof this.groupAcceptInvite !== 'function') return m.reply(pluginUi.box('🔗 Join', [pluginUi.row('ℹ️', 'Uso:', '.join https://chat.whatsapp.com/<codice>'), pluginUi.row('❌', 'Stato:', 'link WhatsApp non valido')]))
  try {
    const group = await this.groupAcceptInvite(code)
    return m.reply(pluginUi.box('🔗 Gruppo raggiunto', [pluginUi.row('✅', 'Stato:', 'il bot è entrato nel gruppo'), pluginUi.row('🆔', 'ID:', group || 'non disponibile')]))
  } catch (error) {
    return m.reply(pluginUi.box('🔗 Join', [pluginUi.row('❌', 'Stato:', error?.message || 'impossibile entrare nel gruppo')]))
  }
}

export default definePlugin(join, {
  name: 'owner-join',
  command: ['join'],
  category: 'owner',
  target: 'all',
  owner: true,
  roles: ['owner'],
  description: 'Fa entrare il bot in un gruppo',
  icon: '🔗',
  order: 14,
  permissions: { roles: ['owner'] }
})
