import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { addItem, carById, debitCoins, ensureUnityProfile, formatCoins, houseById, itemById, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function buy(m, extra) {
  if (extra.args[0] === 'casa') { const house = houseById(extra.args[1]); if (!house) return m.reply(box('Compra casa', [row('ℹ️', 'Uso:', '.compra casa <id>')])); return withEconomyLock(() => { const profile = ensureUnityProfile(m.sender); debitCoins(m.sender, house.price, `Acquisto ${house.name}`); profile.properties.push({ ...house, type: house.id, value: house.price, purchasedAt: Date.now() }); profile.stats.purchases++; global.markDbDirty?.(); return m.reply(box('Casa acquistata', [row('✅', 'Proprieta:', house.name), row('💸', 'Costo:', `${formatCoins(house.price)} UC`)])) }) }
  if (extra.args[0] === 'auto') { const car = carById(extra.args[1]); if (!car) return m.reply(box('Compra auto', [row('ℹ️', 'Uso:', '.compra auto <id>')])); return withEconomyLock(() => { const profile = ensureUnityProfile(m.sender); debitCoins(m.sender, car.price, `Acquisto ${car.name}`); profile.vehicles.push({ ...car, value: car.price, purchasedAt: Date.now() }); profile.stats.purchases++; global.markDbDirty?.(); return m.reply(box('Auto acquistata', [row('✅', 'Veicolo:', car.name), row('💸', 'Costo:', `${formatCoins(car.price)} UC`)])) }) }
  const item = itemById(extra.args[0])
  if (!item) return m.reply(box('Compra oggetto', [row('ℹ️', 'Uso:', '.buy <itemId>'), row('💡', 'Catalogo:', '.shop')]))
  return withEconomyLock(() => { const profile = ensureUnityProfile(m.sender); debitCoins(m.sender, item.price, `Acquisto ${item.name}`); addItem(profile, item.id); profile.stats.purchases++; global.markDbDirty?.(); return m.reply(box('Acquisto completato', [row('✅', 'Oggetto:', item.name), row('💸', 'Costo:', `${formatCoins(item.price)} UC`), row('🎒', 'Quantita:', profile.inventory[item.id])])) })
}

export default defineUnityLifePlugin(buy, { name: 'unitylife-buy', command: ['buy', 'compra'], category: 'world', description: 'Acquista oggetti, case o auto', icon: '🛍️', order: 24 })
