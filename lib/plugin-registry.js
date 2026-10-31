function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}

export function getPluginMetadata(plugin, key = '') {
  const source = plugin?.metadata && typeof plugin.metadata === 'object'
    ? plugin.metadata
    : plugin || {}
  const commands = asArray(source.command).map(command => String(command).toLowerCase())
  const aliases = asArray(source.aliases).map(alias => String(alias).toLowerCase())
  const allCommands = [...new Set([...commands, ...aliases])]
  const permissions = source.permissions && typeof source.permissions === 'object'
    ? source.permissions
    : {}
  const roles = asArray(source.roles || permissions.roles).map(role => String(role).toLowerCase())

  return {
    key,
    name: String(source.name || key || commands[0] || 'plugin'),
    command: allCommands,
    aliases,
    primaryCommand: commands[0] || allCommands[0] || '',
    category: String(source.category || 'other'),
    target: String(source.target || 'all'),
    roles,
    permissions,
    menu: source.menu === true,
    description: String(source.description || ''),
    icon: source.icon || '▫️',
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : 1000,
    plugin
  }
}

export function buildPluginRegistry(plugins = global.plugins || {}) {
  const entries = Object.entries(plugins)
    .filter(([, plugin]) => plugin && !plugin.disabled)
    .map(([key, plugin]) => getPluginMetadata(plugin, key))
    .filter(entry => entry.command.length > 0)
    .sort((left, right) => left.order - right.order || left.primaryCommand.localeCompare(right.primaryCommand))

  const byCommand = new Map()
  const categories = new Map()

  for (const entry of entries) {
    for (const command of entry.command) byCommand.set(command, entry)
    if (!categories.has(entry.category)) categories.set(entry.category, [])
    categories.get(entry.category).push(entry)
  }

  return { entries, byCommand, categories }
}

export function getPluginRegistry(plugins = global.plugins || {}) {
  const registry = buildPluginRegistry(plugins)
  global.pluginRegistry = registry
  return registry
}

export function pluginRolesAllowed(roles, { isROwner, isOwner, isMods, isAdmin, isModerator } = {}) {
  const allowedRoles = asArray(roles).map(role => String(role).toLowerCase())
  if (!allowedRoles.length) return true
  if (allowedRoles.includes('owner') && (isROwner || isOwner)) return true
  if (allowedRoles.includes('mod') && (isMods || isModerator)) return true
  if (allowedRoles.includes('admin') && isAdmin) return true
  return allowedRoles.includes('user')
}
