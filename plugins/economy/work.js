import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, cooldownRemaining, creditCoins, ensureUnityProfile, formatCoins, formatDuration, jobById, levelFromXp, setCooldown, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function work(m) {
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    const job = jobById(profile.job)
    if (!job) return m.reply(box('Lavoro', [row('⚠️', 'Stato:', 'scegli prima .jobchange <id>')]))
    const wait = cooldownRemaining(profile, 'work', UNITY_CONFIG.cooldowns.work)
    if (wait) return m.reply(box('Turno non disponibile', [row('⏳', 'Riprova tra:', formatDuration(wait))]))
    const earned = job.salary + profile.level * 50 + Math.floor(Math.random() * 80)
    profile.jobXp += job.xp
    profile.level = levelFromXp(profile.jobXp)
    setCooldown(profile, 'work')
    creditCoins(m.sender, earned, `Stipendio ${job.name}`)
    return m.reply(box('Turno completato', [row('💼', 'Lavoro:', job.name), row('💠', 'Guadagno:', `+${formatCoins(earned)} UC`), row('⭐', 'XP:', `+${job.xp}`), row('📈', 'Livello:', profile.level)]))
  })
}

export default defineUnityLifePlugin(work, { name: 'unitylife-work', command: ['work', 'lavora'], category: 'economy', description: 'Lavora per ottenere UC e XP', icon: '⚒️', order: 30 })
