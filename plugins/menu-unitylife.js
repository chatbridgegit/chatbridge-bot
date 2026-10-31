import { readFile } from 'fs/promises'
import { join } from 'path'
import { pluginUi } from '../lib/plugin-font.js'
import { getPluginRegistry } from '../lib/plugin-registry.js'
import { getMenuButtons, sendMenuMessage } from '../lib/menu-navigation.js'
import { definePlugin, formatRuntime, getBotConfig } from '../lib/plugin-utils.js'

const categoryTitles = {
  economy: '💠 ECONOMY UC',
  games: '🎮 GAMES UC',
  world: '🌍 WORLD UNITYLIFE'
}

function commandLabel(entry) {
  const commands = entry.command.map(command => `.${command}`)
  return commands.join(' / ')
}

async function unityLifeMenu(m, extra) {
  const { name, version } = getBotConfig()
  const registry = getPluginRegistry()
  const entries = registry.entries.filter(entry =>
    ['economy', 'games', 'world'].includes(entry.category) &&
    !entry.menu &&
    !(entry.category === 'games' && entry.primaryCommand === 'arena')
  )
  const sections = Object.keys(categoryTitles)
    .map(category => {
      const categoryEntries = entries.filter(entry => entry.category === category)
      if (!categoryEntries.length) return ''
      return pluginUi.box(categoryTitles[category], categoryEntries.map(entry => pluginUi.row(
        entry.icon,
        commandLabel(entry),
        entry.description ? `- ${entry.description}` : ''
      )))
    })
    .filter(Boolean)

  const header = [
    pluginUi.header(`💠 ${name} UnityLife`),
    pluginUi.row('❍', 'Name:', name),
    ...(version ? [pluginUi.row('❍', 'Version:', version)] : []),
    pluginUi.row('⏱️', 'Runtime:', formatRuntime()),
    pluginUi.row('🧩', 'Plugin attivi:', `${entries.length}`),
    pluginUi.footer()
  ].join('\n')

  const text = [header, ...sections].join('\n\n')
  let image
  try {
    image = await readFile(join(process.cwd(), 'media', 'principale.jpeg'))
  } catch {}
  return sendMenuMessage(this, m, text, { image, buttons: getMenuButtons('.menu-economia', extra), footer: 'Menu economia' })
}

export default definePlugin(unityLifeMenu, {
  name: 'unitylife-menu',
  command: ['unitylife', 'menuunitylife', 'menu-economia', 'menueconomia', 'menu-unitylife'],
  customPrefix: /^\./,
  category: 'system',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra i comandi UnityLife attualmente caricati',
  icon: '💠',
  order: 3,
  menu: true,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
