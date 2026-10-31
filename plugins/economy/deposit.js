import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { formatCoins, moveToBank, parseAmount, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function deposit(m, extra) {
  const amount = parseAmount(extra.args[0])
  if (!amount) return m.reply(box('Deposito', [row('ℹ️', 'Uso:', '.deposit <quantita>')]))
  return withEconomyLock(() => {
    const profile = moveToBank(m.sender, amount)
    return m.reply(box('Deposito completato', [row('✅', 'Movimento:', `${formatCoins(amount)} UC`), row('💳', 'Portafoglio:', `${formatCoins(profile.coins)} UC`), row('🏦', 'Banca:', `${formatCoins(profile.bank)} UC`)]))
  })
}

export default defineUnityLifePlugin(deposit, { name: 'unitylife-deposit', command: ['deposit', 'deposita'], category: 'economy', description: 'Deposita UC in banca', icon: '📥', order: 12 })
