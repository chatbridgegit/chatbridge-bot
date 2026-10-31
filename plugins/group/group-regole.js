import { pluginUi } from '../../lib/plugin-font.js'
import {
  definePlugin,
  denyRole,
  getGroupMetadata,
  hasRole
} from '../../lib/plugin-utils.js'
import { markDatabaseDirty } from '../../lib/group-state.js'

async function regole(m, extra) {
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  const text = String(extra.text || '').trim()

  if (text) {
    if (!hasRole(extra, ['admin', 'mod', 'owner'])) return denyRole(m, this)
    chat.rules = text
    markDatabaseDirty()
    return m.reply(pluginUi.box('📜 Regole Gruppo', [
      pluginUi.row('✅', 'Stato:', 'regole aggiornate'),
      pluginUi.row('📜', 'Testo:', text)
    ]))
  }

  const rules = chat.rules || chat.regole || metadata.desc || 'Nessuna regola configurata.'
  return m.reply(pluginUi.box('📜 Regole Gruppo', [
    pluginUi.row('📜', 'Regole:', rules)
  ]))
}

export default definePlugin(regole, {
  name: 'group-rules',
  command: ['regole'],
  category: 'group',
  target: 'group',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra o aggiorna le regole del gruppo',
  icon: '📜',
  order: 10,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
}, { group: true })
