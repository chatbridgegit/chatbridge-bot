import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, formatCoins } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function jobs(m) {
  return m.reply(box('Lavori disponibili', UNITY_CONFIG.jobs.map(job => row('💼', job.name, `${formatCoins(job.salary)} UC | ${job.xp} XP`))))
}

export default defineUnityLifePlugin(jobs, { name: 'unitylife-jobs', command: ['jobs', 'lavori'], category: 'economy', description: 'Elenca i lavori disponibili', icon: '💼', order: 28 })
