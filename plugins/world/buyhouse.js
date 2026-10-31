import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, debitCoins, ensureUnityProfile, formatCoins, houseById, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function buyHouse(m, extra) {
  const house = houseById(extra.args[0])
  if (!house) return m.reply(box('Compra casa', [row('ℹ️', 'Uso:', '.buyhouse <id>'), row('📚', 'ID:', UNITY_CONFIG.houses.map(item => item.id).join(', '))]))
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    if (profile.properties.some(item => item.type === house.id)) throw new Error('Possiedi gia questa proprieta.')
    debitCoins(m.sender, house.price, `Acquisto ${house.name}`)
    profile.properties.push({ ...house, type: house.id, value: house.price, purchasedAt: Date.now() })
    profile.stats.purchases++
    global.markDbDirty?.()
    return m.reply(box('Casa acquistata', [row('✅', 'Proprieta:', house.name), row('💸', 'Costo:', `${formatCoins(house.price)} UC`), row('📈', 'Rendita:', `+${formatCoins(house.income)} UC`)]))
  })
}

export default defineUnityLifePlugin(buyHouse, { name: 'unitylife-buyhouse', command: ['buyhouse'], category: 'world', description: 'Acquista una casa con UC', icon: '🔑', order: 16 })
