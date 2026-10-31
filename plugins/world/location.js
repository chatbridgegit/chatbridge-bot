import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, ensureUnityProfile } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function location(m, extra) {
  const profile = ensureUnityProfile(m.sender)
  const selected = extra.args.length ? UNITY_CONFIG.zones.find(zone => zone.id === extra.args[0].toLowerCase() || zone.name.toLowerCase() === extra.args.join(' ').toLowerCase()) : null
  if (selected) { profile.location = selected.id; global.markDbDirty?.() }
  const current = UNITY_CONFIG.zones.find(zone => zone.id === profile.location) || UNITY_CONFIG.zones[0]
  return m.reply(box('Zona attuale', [row('📍', 'Luogo:', current.name), row('ℹ️', 'Descrizione:', current.description), row('🗺️', 'Cambio zona:', '.location <id>')]))
}

export default defineUnityLifePlugin(location, { name: 'unitylife-location', command: ['location', 'zona'], category: 'world', description: 'Mostra o cambia la zona attuale', icon: '📍', order: 12 })
