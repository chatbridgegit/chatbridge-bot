import { readFile } from 'fs/promises'
import { join } from 'path'
import { pluginUi } from '../lib/plugin-font.js'
import { getPluginRegistry } from '../lib/plugin-registry.js'
import { getMenuButtons, sendMenuMessage } from '../lib/menu-navigation.js'
import { definePlugin, formatRuntime, getBotConfig } from '../lib/plugin-utils.js'

function commandLabel(entry) {
  return entry.command.map(cmd => `.${cmd}`).join(' / ')
}

async function toolsMenu(m, extra) {
  const { name, version } = getBotConfig()
  const registry = getPluginRegistry()

  const entries = registry.entries
    .filter(
      entry =>
        entry.category === 'tools' &&
        !entry.menu
    )
    .sort((a, b) =>
      (a.order || 999) - (b.order || 999)
    )

  const section = pluginUi.box(
    '🛠️ TOOLS',
    entries.map(entry =>
      pluginUi.row(
        entry.icon || '⚙️',
        commandLabel(entry),
        entry.description
          ? `- ${entry.description}`
          : ''
      )
    )
  )

  const header = [
    pluginUi.header(`🛠️ ${name} Tools`),
    pluginUi.row('❍', 'Name:', name),
    ...(version
      ? [pluginUi.row('❍', 'Version:', version)]
      : []),
    pluginUi.row('⏱️', 'Runtime:', formatRuntime()),
    pluginUi.row('🧩', 'Plugin:', `${entries.length}`),
    pluginUi.footer()
  ].join('\n')

  const text = [header, section].join('\n\n')

  let image

  try {
    image = await readFile(
      join(process.cwd(), 'media', 'principale.jpeg')
    )
  } catch {}

  return sendMenuMessage(
    this,
    m,
    text,
    {
      image,
      buttons: getMenuButtons('.menu-tools', extra),
      footer: 'Menu Tools'
    }
  )
}

export default definePlugin(toolsMenu, {
  name: 'tools-menu',
  command: [
    'menufunzioni',
    'menu-funzioni',
    'menu-tools',
    'menutools'
  ],
  customPrefix: /^\./,
  category: 'system',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra tutti i comandi Tools',
  icon: '🛠️',
  order: 10,
  menu: true,
  permissions: {
    roles: ['user', 'mod', 'admin', 'owner']
  }
})
