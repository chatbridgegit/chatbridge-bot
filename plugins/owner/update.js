import { execFile } from 'child_process'
import { promisify } from 'util'
import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

const run = promisify(execFile)

async function update(m, extra) {
  if (extra.args[0] !== 'confirm') return m.reply(pluginUi.box('⬆️ Update', [pluginUi.row('⚠️', 'Conferma:', '.update confirm'), pluginUi.row('🛡️', 'Modalita:', 'git pull --ff-only')]))
  try {
    const result = await run('git', ['pull', '--ff-only'], { cwd: process.cwd(), windowsHide: true })
    return m.reply(pluginUi.box('⬆️ Update completato', [pluginUi.row('✅', 'Stato:', 'repository aggiornato'), pluginUi.row('📋', 'Output:', String(result.stdout || result.stderr || 'nessuna modifica').trim().slice(0, 1200))]))
  } catch (error) {
    return m.reply(pluginUi.box('⬆️ Update fallito', [pluginUi.row('❌', 'Stato:', String(error?.stderr || error?.message || 'git pull non riuscito').trim().slice(0, 1200))]))
  }
}

export default definePlugin(update, {
  name: 'owner-update',
  command: ['update'],
  category: 'owner',
  target: 'all',
  rowner: true,
  roles: ['owner'],
  description: 'Aggiorna il repository in modo fast-forward',
  icon: '⬆️',
  order: 20,
  permissions: { roles: ['owner'] }
})
