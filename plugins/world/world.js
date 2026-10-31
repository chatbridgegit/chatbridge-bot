import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function world(m) {
  return m.reply(box('UnityLife World', [row('🏙️', 'Zone:', `${UNITY_CONFIG.zones.length} disponibili`), row('🏠', 'Proprieta:', `${UNITY_CONFIG.houses.length} modelli`), row('🚗', 'Veicoli:', `${UNITY_CONFIG.cars.length} categorie`), row('🛒', 'Marketplace:', `${UNITY_CONFIG.items.length} oggetti`), row('🎉', 'Eventi:', 'configurabili dagli amministratori'), row('🕵️', 'Missioni:', `${UNITY_CONFIG.missions.length} percorsi attivi`)]))
}

export default defineUnityLifePlugin(world, { name: 'unitylife-world', command: ['world', 'mondo'], category: 'world', description: 'Mostra il mondo virtuale UnityLife', icon: '🌍', order: 10 })
