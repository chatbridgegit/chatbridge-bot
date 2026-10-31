import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, getUserLabel, targetUser } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function fire(m, extra) {
  const profile = ensureUnityProfile(m.sender)
  const business = profile.businesses.find(item => item.id === extra.args[0]) || profile.businesses[0]
  const target = targetUser(m)
  if (!business || !target) return m.reply(box('Licenzia dipendente', [row('ℹ️', 'Uso:', '.fire <businessId> @utente')]))
  const before = business.employees.length
  business.employees = business.employees.filter(employee => employee.id !== target)
  if (before === business.employees.length) return m.reply(box('Licenzia dipendente', [row('ℹ️', 'Stato:', 'dipendente non trovato')]))
  global.markDbDirty?.()
  return m.reply(box('Dipendente licenziato', [row('✅', 'Utente:', getUserLabel(target)), row('🏢', 'Attivita:', business.name)]))
}

export default defineUnityLifePlugin(fire, { name: 'unitylife-fire', command: ['fire', 'licenzia'], category: 'economy', description: 'Licenzia un dipendente', icon: '📤', order: 37 })
