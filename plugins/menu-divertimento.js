import { readFile } from 'fs/promises'
import { join } from 'path'
import { getPluginRegistry } from '../lib/plugin-registry.js'
import { pluginUi } from '../lib/plugin-font.js'
import { getMenuButtons, sendMenuMessage } from '../lib/menu-navigation.js'
import { definePlugin, formatRuntime, getBotConfig } from '../lib/plugin-utils.js'

const nameOnlyPluginCommands = [
  { file: 'fun sexaggine.js', commands: ['sexy'] },
  { file: 'Fun-domina.js', commands: ['domina'] },
  { file: 'fun-bussa.js', commands: ['bussa', 'picchia'] },
  { file: 'fun-cazzo.js', commands: ['cazzo'] },
  { file: 'fun-ditalino.js', commands: ['ditalino', 'sditalina'] },
  { file: 'fun-figa.js', commands: ['figa'] },
  { file: 'fun-incula.js', commands: ['incula'] },
  { file: 'fun-lecca.js', commands: ['lecca'] },
  { file: 'fun-orgia.js', commands: ['orgia'] },
  { file: 'fun-pompinara.js', commands: ['pompinara'] },
  { file: 'fun-scopa.js', commands: ['scopa'] },
  { file: 'fun-sega.js', commands: ['sega'] },
  { file: 'fun-segaiolo.js', commands: ['segaiolo'] }
]

async function funMenu(m, extra) {
  const { name, version } = getBotConfig()
  const registry = getPluginRegistry()
  const entries = registry.entries.filter(entry =>
    !entry.menu && (entry.category === 'fun' || (entry.category === 'games' && entry.primaryCommand === 'arena'))
  )

  const header = [
    pluginUi.header(`🎉 ${name} Divertimento`),
    pluginUi.row('❍', 'Name:', name),
    ...(version ? [pluginUi.row('❍', 'Version:', version)] : []),
    pluginUi.row('⏱️', 'Runtime:', formatRuntime()),
    pluginUi.footer()
  ].join('\n')

  const rows = entries.map(entry => pluginUi.row(
    entry.icon,
    entry.command.map(command => `.${command}`).join(' / '),
    entry.description ? `- ${entry.description}` : ''
  ))
  const loadedPluginFiles = new Set(Object.keys(global.plugins || {}).map(key =>
    key.replace(/\\/g, '/').toLowerCase()
  ))
  const nameOnlyRows = nameOnlyPluginCommands
    .filter(({ file }) => loadedPluginFiles.has(`fun/${file.toLowerCase()}`))
    .flatMap(({ commands }) => commands.map(command => pluginUi.row('▫️', `.${command}`)))
  const sections = [pluginUi.box('🎮 GIOCHI E DIVERTIMENTO', rows.length
    ? rows
    : [pluginUi.row('ℹ️', 'Nessun comando', 'Non ci sono plugin divertimento non legati all’economia.')])]
  if (nameOnlyRows.length) sections.push(pluginUi.box('🎲 ALTRI COMANDI', nameOnlyRows))
  const text = [header, ...sections].join('\n\n')
  let image
  try {
    image = await readFile(join(process.cwd(), 'media', 'principale.jpeg'))
  } catch {}
  return sendMenuMessage(this, m, text, { image, buttons: getMenuButtons('.menu-divertimento', extra), footer: 'Menu divertimento' })
}

export default definePlugin(funMenu, {
  name: 'fun-menu',
  command: ['menu-divertimento', 'menudivertimento', 'menu-gruppo', 'menugruppo'],
  category: 'system',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra giochi e comandi divertenti non legati all’economia',
  icon: '🎉',
  order: 1,
  menu: true,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
