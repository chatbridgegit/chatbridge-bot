import { pluginUi } from '../../lib/plugin-font.js'
import { getPluginRegistry } from '../../lib/plugin-registry.js'
import { definePlugin } from '../../lib/plugin-utils.js'

function topCommands() {
  const stats = global.db?.data?.stats || {}
  const commandStats = stats.commands
  const registry = getPluginRegistry()
  const excludedCommands = new Set(['ping'])

  for (const entry of registry.entries) {
    if (entry.menu || entry.command.includes('ping')) {
      for (const command of entry.command) excludedCommands.add(command)
    }
  }

  if (commandStats && typeof commandStats === 'object' && !Array.isArray(commandStats)) {
    return Object.entries(commandStats)
      .map(([command, total]) => ({ command, total: Number(total) }))
      .filter(entry => entry.command && !excludedCommands.has(entry.command.toLowerCase()) && Number.isFinite(entry.total) && entry.total > 0)
      .sort((left, right) => right.total - left.total || left.command.localeCompare(right.command))
      .slice(0, 10)
  }

  return registry.entries
    .filter(entry => !entry.menu && !excludedCommands.has(entry.primaryCommand))
    .map(entry => ({
      command: entry.primaryCommand,
      total: Number(stats[entry.key]?.total || 0)
    }))
    .filter(entry => entry.total > 0)
    .sort((left, right) => right.total - left.total || left.command.localeCompare(right.command))
    .slice(0, 10)
}

async function infoTopCommands(m) {
  const entries = topCommands()
  const rows = entries.length
    ? entries.map((entry, index) => pluginUi.row(
      index < 3 ? ['🥇', '🥈', '🥉'][index] : '▫️',
      `${index + 1}. .${entry.command}`,
      `${entry.total} utilizzi`
    ))
    : [pluginUi.row('ℹ️', 'Stato:', 'nessun comando registrato')]

  return m.reply(pluginUi.box('🏆 Top 10 Comandi Globali', rows))
}

export default definePlugin(infoTopCommands, {
  name: 'info-top-cmd',
  command: ['topcmd', 'topcomandi', 'top-commands'],
  customPrefix: /^\./,
  category: 'info',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra i 10 comandi piu usati globalmente',
  icon: '🏆',
  order: 4,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
