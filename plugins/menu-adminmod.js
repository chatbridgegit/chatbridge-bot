import { readFile } from 'fs/promises'
import { join } from 'path'
import { pluginUi } from '../lib/plugin-font.js'
import { getPluginRegistry } from '../lib/plugin-registry.js'
import { getMenuButtons, sendMenuMessage } from '../lib/menu-navigation.js'
import { definePlugin, formatRuntime, getBotConfig } from '../lib/plugin-utils.js'

function commandRows(entries) {
  return entries.map(entry => pluginUi.row(
    entry.icon,
    entry.command.map(command => `.${command}`).join(' / '),
    entry.description ? `- ${entry.description}` : ''
  ))
}

async function adminModMenu(m, extra) {
  const { name, version } = getBotConfig()
  const entries = getPluginRegistry().entries.filter(entry =>
    !entry.menu &&
    entry.category !== 'owner' &&
    !entry.roles.includes('user') &&
    (entry.roles.includes('admin') || entry.roles.includes('mod'))
  )
  const adminEntries = entries.filter(entry =>
    entry.roles.includes('admin') && !entry.roles.includes('mod')
  )
  const moderatorEntries = entries.filter(entry => entry.roles.includes('mod'))
  const sections = [
    adminEntries.length
      ? pluginUi.box('🛡️ COMANDI SOLO ADMIN', commandRows(adminEntries))
      : '',
    moderatorEntries.length
      ? pluginUi.box('⚖️ COMANDI ADMIN E MOD', commandRows(moderatorEntries))
      : ''
  ].filter(Boolean)
  const header = [
    pluginUi.header(`🛡️ ${name} Admin/Mod`),
    pluginUi.row('❍', 'Name:', name),
    ...(version ? [pluginUi.row('❍', 'Version:', version)] : []),
    pluginUi.row('⏱️', 'Runtime:', formatRuntime()),
    pluginUi.row('🧩', 'Comandi:', `${adminEntries.length + moderatorEntries.length}`),
    pluginUi.footer()
  ].join('\n')
  const text = [header, ...sections].join('\n\n')
  let image
  try {
    image = await readFile(join(process.cwd(), 'media', 'principale.jpeg'))
  } catch {}
  return sendMenuMessage(this, m, text, {
    image,
    buttons: getMenuButtons('.menu-adminmod', extra),
    footer: 'Menu Admin/Mod'
  })
}

export default definePlugin(adminModMenu, {
  name: 'admin-mod-menu',
  command: ['menu-adminmod', 'menuadminmod', 'menu-admin'],
  customPrefix: /^\./,
  category: 'system',
  target: 'all',
  roles: ['mod', 'admin', 'owner'],
  description: 'Mostra i comandi disponibili ad amministratori e moderatori',
  icon: '🛡️',
  order: 4,
  menu: true,
  permissions: { roles: ['mod', 'admin', 'owner'] }
})
