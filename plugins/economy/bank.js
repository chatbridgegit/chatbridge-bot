import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { collectPassiveIncome, ensureUnityProfile, formatCoins, netWorth } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function bank(m) {
  collectPassiveIncome(m.sender)
  const profile = ensureUnityProfile(m.sender)
  return m.reply(box('Banca UnityLife', [row('🏦', 'Saldo bancario:', `${formatCoins(profile.bank)} UC`), row('💳', 'Portafoglio:', `${formatCoins(profile.coins)} UC`), row('💰', 'Patrimonio:', `${formatCoins(netWorth(profile))} UC`), row('🔐', 'Sicurezza:', 'ledger UC attivo')]))
}

export default defineUnityLifePlugin(bank, { name: 'unitylife-bank', command: ['bank', 'banca'], category: 'economy', description: 'Mostra banca e patrimonio', icon: '🏦', order: 11 })
