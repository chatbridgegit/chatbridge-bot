import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, formatCoins, itemById, removeItem, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function sell(m, extra) {
  const item = itemById(extra.args[0])
  if (!item) return m.reply(box('Vendi oggetto', [row('ℹ️', 'Uso:', '.sell <itemId>'), row('🎒', 'Inventario:', '.inventory')]))
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    removeItem(profile, item.id)
    const value = Math.floor(item.price * 0.5)
    creditCoins(m.sender, value, `Vendita ${item.name}`)
    return m.reply(box('Oggetto venduto', [row('✅', 'Oggetto:', item.name), row('💠', 'Ricavo:', `+${formatCoins(value)} UC`)]))
  })
}

export default defineUnityLifePlugin(sell, { name: 'unitylife-sell', command: ['sell', 'vendi'], category: 'world', description: 'Vende oggetti dell’inventario', icon: '💱', order: 25 })
