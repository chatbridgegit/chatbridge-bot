import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function streak(m) {
  const profile = ensureUnityProfile(m.sender)
  return m.reply(box('Serie daily', [row('🔥', 'Serie attuale:', `${profile.streak} giorni`), row('📅', 'Ultimo daily:', profile.lastDaily ? new Date(profile.lastDaily).toLocaleDateString('it-IT') : 'mai'), row('💡', 'Consiglio:', '.daily ogni giorno')]))
}

export default defineUnityLifePlugin(streak, { name: 'unitylife-streak', command: ['streak', 'serie'], category: 'economy', description: 'Mostra la serie daily', icon: '🔥', order: 23 })
