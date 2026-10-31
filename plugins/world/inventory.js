import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, itemById } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function inventory(m) {
  const profile = ensureUnityProfile(m.sender)
  const rows = Object.entries(profile.inventory).map(([id, quantity]) => row('🎒', itemById(id)?.name || id, `x${quantity}`))
  return m.reply(box('Inventario', rows.length ? rows : [row('ℹ️', 'Stato:', 'inventario vuoto'), row('🛒', 'Shop:', '.shop')]))
}

export default defineUnityLifePlugin(inventory, { name: 'unitylife-inventory', command: ['inventory', 'inventario'], category: 'world', description: 'Mostra gli oggetti posseduti', icon: '🎒', order: 26 })
