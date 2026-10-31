import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, ensureUnityProfile, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function business(m, extra) {
  if (extra.args[0] === 'disponibili') return m.reply(box('Attivita disponibili', UNITY_CONFIG.businessTypes.map(item => row('🏢', item.name, `${formatCoins(item.price)} UC | +${formatCoins(item.income)} UC`))))
  const profile = ensureUnityProfile(m.sender)
  return m.reply(box('Le mie attivita', profile.businesses.length ? profile.businesses.map(item => row('🏢', item.name, `livello ${item.level} | +${formatCoins(item.income)} UC`)) : [row('ℹ️', 'Stato:', 'nessuna attivita'), row('💡', 'Catalogo:', '.businesses')]))
}

export default defineUnityLifePlugin(business, { name: 'unitylife-business', command: ['business', 'attivita'], category: 'economy', description: 'Gestisce e mostra le attivita', icon: '🏢', order: 33 })
