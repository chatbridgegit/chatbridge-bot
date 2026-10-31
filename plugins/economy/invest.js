import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { debitCoins, ensureUnityProfile, formatCoins, parseAmount, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function invest(m, extra) {
  const amount = parseAmount(extra.args[0])
  if (!amount || amount < 100) return m.reply(box('Investimento', [row('ℹ️', 'Uso:', '.invest <quantita>'), row('💡', 'Minimo:', '100 UC | durata 7 giorni')]))
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    debitCoins(m.sender, amount, 'Investimento UnityLife')
    profile.investments.push({ amount, createdAt: Date.now(), unlockAt: Date.now() + 7 * 24 * 60 * 60 * 1000, claimed: false })
    profile.stats.investments++
    global.markDbDirty?.()
    return m.reply(box('Investimento creato', [row('✅', 'Capitale:', `${formatCoins(amount)} UC`), row('📈', 'Rendimento previsto:', `${formatCoins(Math.floor(amount * 1.1))} UC`), row('🔓', 'Sblocco:', 'tra 7 giorni')]))
  })
}

export default defineUnityLifePlugin(invest, { name: 'unitylife-invest', command: ['invest', 'investi'], category: 'economy', description: 'Crea un investimento virtuale', icon: '📊', order: 40 })
