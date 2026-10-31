import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { formatCoins, itemById } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function item(m, extra) {
  const found = itemById(extra.args[0])
  if (!found) return m.reply(box('Oggetto', [row('ℹ️', 'Uso:', '.item <itemId>')]))
  return m.reply(box('Dettagli oggetto', [row('🛒', 'Nome:', found.name), row('🏷️', 'Tipo:', found.type), row('💰', 'Valore:', `${formatCoins(found.price)} UC`), row('🆔', 'ID:', found.id)]))
}

export default defineUnityLifePlugin(item, { name: 'unitylife-item', command: ['item', 'oggetto'], category: 'world', description: 'Mostra informazioni su un oggetto', icon: '🔎', order: 27 })
