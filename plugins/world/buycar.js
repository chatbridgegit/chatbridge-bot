import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, carById, debitCoins, ensureUnityProfile, formatCoins, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function buyCar(m, extra) {
  const car = carById(extra.args[0])
  if (!car) return m.reply(box('Compra veicolo', [row('ℹ️', 'Uso:', '.buycar <id>'), row('📚', 'ID:', UNITY_CONFIG.cars.map(item => item.id).join(', '))]))
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    debitCoins(m.sender, car.price, `Acquisto ${car.name}`)
    profile.vehicles.push({ ...car, value: car.price, purchasedAt: Date.now() })
    profile.stats.purchases++
    global.markDbDirty?.()
    return m.reply(box('Veicolo acquistato', [row('✅', 'Veicolo:', car.name), row('🚘', 'Categoria:', car.category), row('💸', 'Costo:', `${formatCoins(car.price)} UC`)]))
  })
}

export default defineUnityLifePlugin(buyCar, { name: 'unitylife-buycar', command: ['buycar', 'comprauto'], category: 'world', description: 'Acquista un veicolo con UC', icon: '🛒', order: 20 })
