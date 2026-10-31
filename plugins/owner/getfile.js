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

async function getfile(m, extra) {
  const root = extra.dirname || path.join(process.cwd(), 'plugins')
  const file = safePluginPath(extra.args.join(' '), root)
  if (!file) return m.reply(pluginUi.box('📥 Get File', [pluginUi.row('ℹ️', 'Uso:', '.getfile <plugin>'), pluginUi.row('🛡️', 'Sicurezza:', 'sono consentiti solo file dentro plugins')]))
  try {
    const data = await fs.readFile(file)
    return this.sendMessage(m.chat, { document: data, mimetype: 'text/javascript', fileName: path.basename(file), caption: `📥 ${path.relative(root, file)}` }, { quoted: m })
  } catch {
    return m.reply(pluginUi.box('📥 Get File', [pluginUi.row('❌', 'Stato:', 'plugin non trovato')]))
  }
}

export default definePlugin(getfile, {
  name: 'owner-getfile',
  command: ['getfile'],
  category: 'owner',
  target: 'all',
  owner: true,
  roles: ['owner'],
  description: 'Invia il codice sorgente di un plugin',
  icon: '📥',
  order: 12,
  permissions: { roles: ['owner'] }
})
