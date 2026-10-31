import { readFile } from 'fs/promises'
import { join } from 'path'
import { pluginUi } from '../../lib/plugin-font.js'
import { getPluginRegistry } from '../../lib/plugin-registry.js'
import { getMenuButtons, sendMenuMessage } from '../../lib/menu-navigation.js'
import { definePlugin, formatRuntime, getBotConfig } from '../../lib/plugin-utils.js'

function label(entry, prefix) {
  return entry.command.map(command => `${prefix}${command}`).join(' / ')
}

async function ownerMenu(m) {
  const { name, version } = getBotConfig()
  const entries = getPluginRegistry().entries.filter(entry => entry.category === 'owner' && !entry.menu)
  const prefix = global.db?.data?.system?.prefix || '.'
  const header = [
    pluginUi.header(`👑 ${name} Owner`),
    pluginUi.row('❍', 'Name:', name),
    ...(version ? [pluginUi.row('❍', 'Version:', version)] : []),
    pluginUi.row('⏱️', 'Runtime:', formatRuntime()),
    pluginUi.row('🧩', 'Plugin attivi:', entries.length),
    pluginUi.footer()
  ].join('\n')
  const rows = entries.map(entry => pluginUi.row(entry.icon, label(entry, prefix), entry.description ? `- ${entry.description}` : ''))
  const text = [header, pluginUi.box('👑 MENU OWNER', rows)].join('\n\n')
  let image
  try {
    image = await readFile(join(process.cwd(), 'media', 'principale.jpeg'))
  } catch {}
  return sendMenuMessage(this, m, text, { image, buttons: getMenuButtons('.menuowner', { isOwner: true }), footer: 'Menu owner' })
}

export default definePlugin(ownerMenu, {
  name: 'owner-menu',
  command: ['ownermenu', 'menuowner'],
  category: 'system',
  target: 'all',
  owner: true,
  roles: ['owner'],
  description: 'Mostra i comandi owner caricati',
  icon: '👑',
  order: 0,
  menu: true,
  permissions: { roles: ['owner'] }
})
