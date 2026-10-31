import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function locations(m) {
  return m.reply(box('Zone UnityLife', UNITY_CONFIG.zones.map(zone => row('📍', zone.name, zone.description))))
}

export default defineUnityLifePlugin(locations, { name: 'unitylife-locations', command: ['locations', 'zone'], category: 'world', description: 'Mostra tutte le zone disponibili', icon: '🗺️', order: 11 })
