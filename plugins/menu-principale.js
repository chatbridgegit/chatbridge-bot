import { readFile } from 'fs/promises'
import { join } from 'path'
import { getPluginRegistry } from '../lib/plugin-registry.js'
import { pluginUi } from '../lib/plugin-font.js'
import { getMenuButtons, sendMenuMessage } from '../lib/menu-navigation.js'
import { definePlugin, formatRuntime, getBotConfig } from '../lib/plugin-utils.js'

async function mainMenu(m, extra) {
  const { name, version } = getBotConfig()
  const registry = getPluginRegistry()
  const entries = registry.entries.filter(entry => !entry.menu)
  const buttons = getMenuButtons('.menu-principale', extra)
  const header = [
    pluginUi.header(`🏠 ${name}`),
    pluginUi.row('❍', 'Name:', name),
    ...(version ? [pluginUi.row('❍', 'Version:', version)] : []),
    pluginUi.row('⏱️', 'Runtime:', formatRuntime()),
    pluginUi.row('🧩', 'Plugin attivi:', entries.length),
    pluginUi.footer()
  ].join('\n')
  const menus = [
    pluginUi.row('🎉', '.menu-divertimento', 'giochi e comandi divertenti'),
    pluginUi.row('🛠️', '.menu-tools', 'strumenti'),
    pluginUi.row('🛡️', '.menuprotezioni', 'protezione e automazioni del gruppo'),
    pluginUi.row('💠', '.menueconomia', 'economia e giochi con UC'),
    ...(extra?.isAdmin || extra?.isModerator || extra?.isOwner || extra?.isROwner
      ? [pluginUi.row('🛡️', '.menu-adminmod', 'comandi amministratore e moderatore')]
      : [])
  ]
  const sections = [
    pluginUi.box('🧭 MENU DISPONIBILI', menus),
    pluginUi.box('ℹ️ COMANDI RAPIDI', [
      pluginUi.row('⚡', '.ping', 'uptime e latenza reale'),
      pluginUi.row('👤', '.profilo', 'profilo, XP e portafoglio'),
      pluginUi.row('🏆', '.topcmd', 'top 10 comandi globali'),
      pluginUi.row('👑', '.owner', 'contatti degli owner')
    ])
  ]
  const text = [header, ...sections].join('\n\n')
  let image
  try {
    image = await readFile(join(process.cwd(), 'media', 'principale.jpeg'))
  } catch {}
  return sendMenuMessage(this, m, text, { image, buttons, footer: 'Seleziona un menu' })
}

export default definePlugin(mainMenu, {
  name: 'main-menu',
  command: ['menu-principale', 'menu-pringipale', 'menuprincipale', 'menu', 'mainmenu'],
  customPrefix: /^\./,
  category: 'system',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra il menu principale e i collegamenti del bot',
  icon: '🏠',
  order: 0,
  menu: true,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
