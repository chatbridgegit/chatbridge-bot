import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins, creditCoins, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function investments(m, extra) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    if (['claim', 'riscuoti'].includes(extra.args[0])) {
      const mature = profile.investments.filter(item => !item.claimed && item.unlockAt <= Date.now())
      if (!mature.length) return m.reply(box('Investimenti', [row('⏳', 'Stato:', 'nessun investimento maturo')]))
      const amount = mature.reduce((sum, item) => sum + Math.floor(item.amount * 1.1), 0)
      mature.forEach(item => { item.claimed = true; item.claimedAt = Date.now() })
      creditCoins(m.sender, amount, 'Rendimento investimenti')
      return m.reply(box('Investimento riscattato', [row('📈', 'Rendimento:', `+${formatCoins(amount)} UC`), row('💳', 'Saldo:', `${formatCoins(profile.coins)} UC`)]))
    }
    const open = profile.investments.filter(item => !item.claimed)
    return m.reply(box('Investimenti', open.length ? open.map(item => row('📈', `${formatCoins(item.amount)} UC`, `sblocco ${new Date(item.unlockAt).toLocaleDateString('it-IT')}`)) : [row('ℹ️', 'Stato:', 'nessun investimento attivo'), row('💡', 'Uso:', '.invest <quantita>')]))
  })
}

export default defineUnityLifePlugin(investments, { name: 'unitylife-investments', command: ['investments', 'investimenti'], category: 'economy', description: 'Mostra gli investimenti virtuali', icon: '📊', order: 41 })
