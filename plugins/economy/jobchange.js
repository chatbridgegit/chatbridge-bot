import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins, jobById } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function jobchange(m) {
  const id = String(m.text || '').trim().split(/\s+/)[1]
  const selected = jobById(id)
  if (!selected) return m.reply(box('Cambio lavoro', [row('ℹ️', 'Uso:', '.jobchange <id>'), row('📚', 'Esempio:', '.jobchange developer')]))
  const profile = ensureUnityProfile(m.sender)
  profile.job = selected.id
  profile.jobXp = 0
  profile.level = 1
  global.markDbDirty?.()
  return m.reply(box('Professione scelta', [row('✅', 'Lavoro:', selected.name), row('💰', 'Stipendio base:', `${formatCoins(selected.salary)} UC`), row('ℹ️', 'Prossimo passo:', '.work')]))
}

export default defineUnityLifePlugin(jobchange, { name: 'unitylife-jobchange', command: ['jobchange', 'cambiolavoro'], category: 'economy', description: 'Sceglie o cambia professione', icon: '🔁', order: 31 })
