import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { collectPassiveIncome, ensureUnityProfile, formatCoins, netWorth } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function networth(m) {
  collectPassiveIncome(m.sender)
  const profile = ensureUnityProfile(m.sender)
  return m.reply(box('Patrimonio complessivo', [row('💎', 'Totale:', `${formatCoins(netWorth(profile))} UC`), row('💳', 'Wallet:', `${formatCoins(profile.coins)} UC`), row('🏦', 'Banca:', `${formatCoins(profile.bank)} UC`), row('🏠', 'Proprieta:', profile.properties.length), row('🚗', 'Veicoli:', profile.vehicles.length), row('🏢', 'Business:', profile.businesses.length)]))
}

export default defineUnityLifePlugin(networth, { name: 'unitylife-networth', command: ['networth', 'patrimonio'], category: 'economy', description: 'Mostra il patrimonio complessivo', icon: '💎', order: 17 })
