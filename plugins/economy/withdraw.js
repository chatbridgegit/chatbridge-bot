import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { formatCoins, parseAmount, withdrawFromBank, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function withdraw(m, extra) {
  const amount = parseAmount(extra.args[0])
  if (!amount) return m.reply(box('Prelievo', [row('ℹ️', 'Uso:', '.withdraw <quantita>')]))
  return withEconomyLock(() => {
    const profile = withdrawFromBank(m.sender, amount)
    return m.reply(box('Prelievo completato', [row('✅', 'Movimento:', `${formatCoins(amount)} UC`), row('💳', 'Portafoglio:', `${formatCoins(profile.coins)} UC`), row('🏦', 'Banca:', `${formatCoins(profile.bank)} UC`)]))
  })
}

export default defineUnityLifePlugin(withdraw, { name: 'unitylife-withdraw', command: ['withdraw', 'ritira'], category: 'economy', description: 'Preleva UC dalla banca', icon: '📤', order: 13 })
