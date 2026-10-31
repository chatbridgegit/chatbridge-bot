import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { collectPassiveIncome, ensureUnityProfile, formatCoins, jobById } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function salary(m) {
  collectPassiveIncome(m.sender)
  const profile = ensureUnityProfile(m.sender)
  const job = jobById(profile.job)
  const businessIncome = profile.businesses.reduce((sum, business) => sum + Number(business.income || 0), 0)
  return m.reply(box('Stipendio e rendite', [row('💼', 'Lavoro:', job ? `${formatCoins(job.salary + profile.level * 50)} UC` : 'nessuno'), row('🏢', 'Business:', `+${formatCoins(businessIncome)} UC`)]))
}

export default defineUnityLifePlugin(salary, { name: 'unitylife-salary', command: ['salary', 'stipendio'], category: 'economy', description: 'Mostra stipendio e rendite', icon: '💰', order: 38 })
