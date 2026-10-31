import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { collectPassiveIncome, ensureUnityProfile, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function properties(m, extra) {
  collectPassiveIncome(m.sender)
  const profile = ensureUnityProfile(m.sender)
  if (extra.args[0]) {
    const property = profile.properties.find(item => item.id === extra.args[0] || item.type === extra.args[0])
    if (!property) return m.reply(box('Proprieta', [row('⚠️', 'Stato:', 'proprieta non trovata')]))
    return m.reply(box('Dettagli proprieta', [row('🏠', 'Nome:', property.name), row('💰', 'Valore:', `${formatCoins(property.value)} UC`), row('📈', 'Rendita:', `+${formatCoins(property.income)} UC`), row('🆔', 'ID:', property.id)]))
  }
  return m.reply(box('Le mie proprieta', profile.properties.length ? profile.properties.map(item => row('🏠', item.name, `${formatCoins(item.value)} UC | +${formatCoins(item.income)} UC`)) : [row('ℹ️', 'Stato:', 'nessuna proprieta'), row('💡', 'Catalogo:', '.houses')]))
}

export default defineUnityLifePlugin(properties, { name: 'unitylife-properties', command: ['properties', 'proprieta'], category: 'world', description: 'Mostra proprieta possedute', icon: '🏠', order: 13 })
