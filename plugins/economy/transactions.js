import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function transactions(m) {
  const profile = ensureUnityProfile(m.sender)
  const rows = profile.transactions.slice(0, 8).map(transaction => row(transaction.amount >= 0 ? '📈' : '📉', transaction.reason, `${transaction.amount >= 0 ? '+' : '-'}${formatCoins(Math.abs(transaction.amount))} UC`))
  return m.reply(box('Cronologia UC', rows.length ? rows : [row('ℹ️', 'Stato:', 'nessuna transazione registrata')]))
}

export default defineUnityLifePlugin(transactions, { name: 'unitylife-transactions', command: ['transactions', 'transazioni'], category: 'economy', description: 'Mostra la cronologia UC', icon: '📜', order: 16 })
