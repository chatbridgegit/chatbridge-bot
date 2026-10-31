import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

function escape(value) {
  return value.replace(/[|\\{}()[\]^$+*?.\-]/g, '\\$&')
}

async function prefix(m, extra) {
  const value = String(extra.args[0] || '').trim()
  if (!value || value.length > 3 || /[\s\n\r]/.test(value)) return m.reply(pluginUi.box('🔣 Prefisso', [pluginUi.row('ℹ️', 'Uso:', '.prefix <carattere>'), pluginUi.row('📚', 'Esempi:', '.prefix . | .prefix !')]))
  global.prefix = new RegExp(`^${escape(value)}`)
  global.db.data.system = global.db.data.system || {}
  global.db.data.system.prefix = value
  global.markDbDirty?.()
  return m.reply(pluginUi.box('🔣 Prefisso aggiornato', [pluginUi.row('✅', 'Nuovo prefisso:', value), pluginUi.row('ℹ️', 'Nota:', 'modifica applicata al runtime corrente')]))
}

export default definePlugin(prefix, {
  name: 'owner-prefix',
  command: ['prefix'],
  category: 'owner',
  target: 'all',
  owner: true,
  roles: ['owner'],
  description: 'Imposta il prefisso dei comandi',
  icon: '🔣',
  order: 16,
  permissions: { roles: ['owner'] }
})
