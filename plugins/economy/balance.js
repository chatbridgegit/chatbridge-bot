import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { collectPassiveIncome, ensureUnityProfile, formatCoins, netWorth } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function balance(m) {
  collectPassiveIncome(m.sender)
  const profile = ensureUnityProfile(m.sender)
  return m.reply(box('Wallet', [row('💳', 'Portafoglio:', `${formatCoins(profile.coins)} UC`), row('🏦', 'Banca:', `${formatCoins(profile.bank)} UC`), row('💎', 'Patrimonio:', `${formatCoins(netWorth(profile))} UC`)]))
}

export default defineUnityLifePlugin(balance, { name: 'unitylife-balance', command: ['balance', 'saldo'], category: 'economy', description: 'Mostra il portafoglio UC', icon: '💳', order: 10 })
