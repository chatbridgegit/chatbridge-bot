import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { formatCoins, getUserLabel, parseAmount, targetUser, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function request(m, extra) {
  const target = targetUser(m)
  const amount = parseAmount(extra.args.find(value => /^\d+$/.test(value)))
  if (!target || !amount) return m.reply(box('Richiesta UC', [row('ℹ️', 'Uso:', '.request @utente <quantita>')]))
  return withEconomyLock(() => {
    const state = global.db.data.unityLife
    state.requests = Array.isArray(state.requests) ? state.requests : []
    state.requests.unshift({ from: m.sender, to: target, amount, at: Date.now(), status: 'pending' })
    state.requests = state.requests.slice(0, 100)
    global.markDbDirty?.()
    return m.reply(box('Richiesta UC', [row('📨', 'Destinatario:', getUserLabel(target)), row('💠', 'Quantita:', `${formatCoins(amount)} UC`), row('ℹ️', 'Nota:', 'il destinatario puo usare .pay')]))
  })
}

export default defineUnityLifePlugin(request, { name: 'unitylife-request', command: ['request', 'richiedi'], category: 'economy', description: 'Richiede UC a un utente', icon: '📨', order: 15 })
