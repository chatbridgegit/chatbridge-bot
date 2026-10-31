import { readFile } from 'fs/promises'
import { join } from 'path'
import { pluginUi } from '../lib/plugin-font.js'
import { getPluginRegistry } from '../lib/plugin-registry.js'
import { getMenuButtons, sendMenuMessage } from '../lib/menu-navigation.js'
import {
  featureRows,
  groupFeatureDefinitions
} from '../lib/group-features.js'
import { definePlugin, formatRuntime, getBotConfig, getGroupMetadata } from '../lib/plugin-utils.js'
import { ensureGroupState } from '../lib/group-state.js'

const categoryTitles = {
  protection: '🛡️ PROTEZIONE',
  moderation: '⚖️ MODERAZIONE',
  automation: '⚙️ AUTOMAZIONE',
  access: '🔐 ACCESSO'
}

async function menuFunzioni(m, extra) {
  const { name, version } = getBotConfig()
  const metadata = await getGroupMetadata(this, m.chat, extra.groupMetadata)
  const chat = ensureGroupState(global.db.data.chats[m.chat])
  const header = [
    pluginUi.header(`🧩 ${name}`),
    pluginUi.row('❍', 'Name:', name),
    ...(version ? [pluginUi.row('❍', 'Version:', version)] : []),
    pluginUi.row('⏱️', 'Runtime:', formatRuntime()),
    pluginUi.row('👥', 'Gruppo:', metadata.subject || m.chat),
    pluginUi.footer()
  ].join('\n')

  const sections = [...new Set(groupFeatureDefinitions.map(definition => definition.category))]
    .map(category => {
      const definitions = groupFeatureDefinitions.filter(definition => definition.category === category)
      return pluginUi.box(categoryTitles[category] || category, featureRows(chat, definitions))
    })

  const toggle = getPluginRegistry().byCommand.get('funzione')
  const usage = pluginUi.box('🔧 Gestione Funzioni', [
    pluginUi.row('✅', 'Attiva:', '.on <nome>'),
    pluginUi.row('❌', 'Disattiva:', '.off <nome>'),
    pluginUi.row('ℹ️', 'Dettagli:', toggle?.description || 'gestione funzioni del gruppo')
  ])

  const text = [header, ...sections, usage].join('\n\n')
  let image
  try {
    image = await readFile(join(process.cwd(), 'media', 'principale.jpeg'))
  } catch {}
  return sendMenuMessage(this, m, text, { image, buttons: getMenuButtons('.menu-protezioni', extra), footer: 'Menu protezioni' })
}

export default definePlugin(menuFunzioni, {
  name: 'functions-menu',
  command: ['menu-protezioni', 'menuprotezioni'],
  category: 'system',
  target: 'group',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra lo stato delle funzioni del gruppo',
  icon: '🧩',
  order: 2,
  menu: true,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
}, { group: true })
