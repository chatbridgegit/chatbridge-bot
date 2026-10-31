import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins, jobById } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function career(m) {
  const profile = ensureUnityProfile(m.sender)
  const job = jobById(profile.job)
  const threshold = profile.level * 500
  return m.reply(box('Carriera UnityLife', [row('💼', 'Professione:', job?.name || 'nessuna'), row('📈', 'Livello:', profile.level), row('⭐', 'XP:', `${formatCoins(profile.jobXp)} / ${formatCoins(threshold)}`), row('💰', 'Stipendio:', job ? `${formatCoins(job.salary + profile.level * 50)} UC` : 'n/d'), row('🔓', 'Cambio lavoro:', '.jobchange <id>')]))
}

export default defineUnityLifePlugin(career, { name: 'unitylife-career', command: ['career', 'carriera'], category: 'economy', description: 'Mostra la progressione professionale', icon: '📈', order: 32 })
