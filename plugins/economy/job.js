import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins, jobById } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function job(m) {
  const profile = ensureUnityProfile(m.sender)
  const selected = jobById(String(m.text || '').trim().split(/\s+/)[1])
  if (selected) {
    profile.job = selected.id
    profile.jobXp = 0
    profile.level = 1
    global.markDbDirty?.()
  }
  const current = jobById(profile.job)
  return m.reply(box('Lavoro attuale', current ? [row('💼', 'Professione:', current.name), row('⭐', 'Livello:', profile.level), row('📈', 'XP:', `${formatCoins(profile.jobXp)} XP`)] : [row('⚠️', 'Stato:', 'nessun lavoro scelto'), row('ℹ️', 'Uso:', '.jobchange developer')]))
}

export default defineUnityLifePlugin(job, { name: 'unitylife-job', command: ['job', 'lavoro'], category: 'economy', description: 'Mostra il lavoro attuale', icon: '🧑‍💼', order: 29 })
