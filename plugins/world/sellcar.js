import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, formatCoins, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function sellCar(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const index = extra.args[0] ? profile.vehicles.findIndex(item => item.id === extra.args[0]) : 0
    const vehicle = profile.vehicles[index]
    if (!vehicle) return m.reply(box('Vendi veicolo', [row('⚠️', 'Stato:', 'nessun veicolo da vendere')]))
    const value = Math.floor(vehicle.value * 0.7)
    profile.vehicles.splice(index, 1)
    creditCoins(m.sender, value, `Vendita ${vehicle.name}`)
    return m.reply(box('Veicolo venduto', [row('🚗', 'Veicolo:', vehicle.name), row('💠', 'Rimborso:', `+${formatCoins(value)} UC`)]))
  })
}

export default defineUnityLifePlugin(sellCar, { name: 'unitylife-sellcar', command: ['sellcar', 'vendiauto'], category: 'world', description: 'Vende un veicolo posseduto', icon: '💱', order: 21 })
