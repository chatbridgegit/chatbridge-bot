import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function property(m, extra) {
  const profile = ensureUnityProfile(m.sender)
  const item = profile.properties.find(value => value.id === extra.args[0] || value.type === extra.args[0])
  if (!item) return m.reply(box('Dettagli proprieta', [row('ℹ️', 'Uso:', '.property <id>'), row('⚠️', 'Stato:', 'proprieta non trovata')]))
  return m.reply(box('Dettagli proprieta', [row('🏠', 'Nome:', item.name), row('💰', 'Valore:', `${formatCoins(item.value)} UC`), row('📈', 'Rendita:', `+${formatCoins(item.income)} UC`), row('🆔', 'ID:', item.id)]))
}

export default defineUnityLifePlugin(property, { name: 'unitylife-property', command: ['property'], category: 'world', description: 'Mostra i dettagli di una proprieta', icon: '🏠', order: 14 })
