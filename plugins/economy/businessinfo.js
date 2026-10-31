import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function businessInfo(m, extra) {
  const profile = ensureUnityProfile(m.sender)
  const business = profile.businesses.find(item => item.id === extra.args[0]) || profile.businesses[0]
  if (!business) return m.reply(box('Info attivita', [row('ℹ️', 'Stato:', 'nessuna attivita')]))
  return m.reply(box('Info attivita', [row('🏢', 'Nome:', business.name), row('📊', 'Livello:', business.level), row('💰', 'Rendita:', `+${formatCoins(business.income)} UC`), row('👥', 'Dipendenti:', business.employees.length), row('🆔', 'ID:', business.id)]))
}

export default defineUnityLifePlugin(businessInfo, { name: 'unitylife-businessinfo', command: ['businessinfo', 'infoattivita'], category: 'economy', description: 'Mostra statistiche dell’attivita', icon: '📊', order: 39 })
