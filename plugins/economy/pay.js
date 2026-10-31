import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins, getUserLabel, parseAmount, targetUser, transferCoins, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function pay(m, extra) {
  const target = targetUser(m)
  const amount = parseAmount(extra.args.find(value => /^\d+$/.test(value)))
  if (!target || !amount) return m.reply(box('Pagamento', [row('ℹ️', 'Uso:', '.pay @utente <quantita>')]))
  return withEconomyLock(() => {
    transferCoins(m.sender, target, amount, 'Pagamento tra utenti')
    return m.reply(box('Pagamento inviato', [row('✅', 'Destinatario:', getUserLabel(target)), row('💸', 'Inviati:', `${formatCoins(amount)} UC`), row('💳', 'Saldo:', `${formatCoins(ensureUnityProfile(m.sender).coins)} UC`)]))
  })
}

export default defineUnityLifePlugin(pay, { name: 'unitylife-pay', command: ['pay', 'paga'], category: 'economy', description: 'Invia UC a un utente', icon: '💸', order: 14 })
