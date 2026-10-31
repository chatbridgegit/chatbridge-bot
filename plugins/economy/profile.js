import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { collectPassiveIncome, ensureUnityProfile, formatCoins, getUserLabel, jobById, netWorth } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function profile(m) {
  collectPassiveIncome(m.sender)
  const data = ensureUnityProfile(m.sender)
  return m.reply(box('Profilo economico', [row('👤', 'Utente:', getUserLabel(m.sender)), row('💳', 'Wallet:', `${formatCoins(data.coins)} UC`), row('🏦', 'Banca:', `${formatCoins(data.bank)} UC`), row('💎', 'Patrimonio:', `${formatCoins(netWorth(data))} UC`), row('💼', 'Lavoro:', jobById(data.job)?.name || 'nessuno'), row('📈', 'Livello:', data.level), row('📊', 'Investimenti:', data.investments.filter(item => !item.claimed).length), row('🎒', 'Oggetti:', Object.values(data.inventory).reduce((sum, count) => sum + count, 0)), row('🏆', 'Achievement:', data.achievements.length)]))
}

export default defineUnityLifePlugin(profile, { name: 'unitylife-profile', command: ['profile'], category: 'economy', description: 'Mostra il profilo economico', icon: '👤', order: 18 })
