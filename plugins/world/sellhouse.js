import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { creditCoins, ensureUnityProfile, formatCoins, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function sellHouse(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const index = extra.args[0] ? profile.properties.findIndex(item => item.id === extra.args[0] || item.type === extra.args[0]) : 0
    const property = profile.properties[index]
    if (!property) return m.reply(box('Vendi casa', [row('⚠️', 'Stato:', 'nessuna proprieta da vendere')]))
    const value = Math.floor(property.value * 0.7)
    profile.properties.splice(index, 1)
    creditCoins(m.sender, value, `Vendita ${property.name}`)
    return m.reply(box('Casa venduta', [row('🏠', 'Proprieta:', property.name), row('💠', 'Rimborso:', `+${formatCoins(value)} UC`), row('ℹ️', 'Rimborso:', '70% del valore')]))
  })
}

export default defineUnityLifePlugin(sellHouse, { name: 'unitylife-sellhouse', command: ['sellhouse', 'vendicasa'], category: 'world', description: 'Vende una casa posseduta', icon: '🏷️', order: 17 })
