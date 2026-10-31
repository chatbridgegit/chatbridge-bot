import fs from 'fs/promises'
import path from 'path'
import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

function safePluginPath(input, root) {
  const name = String(input || '').trim().replace(/^[./\\]+/, '')
  if (!name || name.includes('..')) return null
  const file = path.resolve(root, name.endsWith('.js') ? name : `${name}.js`)
  return file.startsWith(path.resolve(root) + path.sep) ? file : null
}

async function save(m, extra) {
  if (!extra.args.length) {
    if (global.db?.write) await global.db.write()
    global.dbDirty = false
    return m.reply(pluginUi.box('💾 Database salvato', [pluginUi.row('✅', 'Stato:', 'dati persistenti scritti su database.json')]))
  }
  const root = extra.dirname || path.join(process.cwd(), 'plugins')
  const source = safePluginPath(extra.args.join(' '), root)
  if (!source) return m.reply(pluginUi.box('💾 Save Plugin', [pluginUi.row('ℹ️', 'Uso:', '.save <plugin>'), pluginUi.row('🛡️', 'Sicurezza:', 'percorso non valido')]))
  try {
    await fs.access(source)
    const backup = path.join(process.cwd(), 'backups', 'plugins', path.relative(root, source))
    await fs.mkdir(path.dirname(backup), { recursive: true })
    await fs.copyFile(source, `${backup}.bak`)
    return m.reply(pluginUi.box('💾 Plugin salvato', [pluginUi.row('✅', 'File:', path.relative(root, source)), pluginUi.row('📦', 'Backup:', path.relative(process.cwd(), `${backup}.bak`))]))
  } catch {
    return m.reply(pluginUi.box('💾 Save Plugin', [pluginUi.row('❌', 'Stato:', 'plugin non trovato')]))
  }
}

export default definePlugin(save, {
  name: 'owner-save',
  command: ['save'],
  category: 'owner',
  target: 'all',
  owner: true,
  roles: ['owner'],
  description: 'Salva database o crea un backup plugin',
  icon: '💾',
  order: 13,
  permissions: { roles: ['owner'] }
})
