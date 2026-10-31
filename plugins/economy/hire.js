import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, formatCoins, getUserLabel, targetUser } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function hire(m, extra) {
  const profile = ensureUnityProfile(m.sender)
  const business = profile.businesses.find(item => item.id === extra.args[0]) || profile.businesses[0]
  const target = targetUser(m)
  if (!business || !target) return m.reply(box('Assumi dipendente', [row('ℹ️', 'Uso:', '.hire <businessId> @utente')]))
  if (business.employees.some(employee => employee.id === target)) return m.reply(box('Assumi dipendente', [row('ℹ️', 'Stato:', 'utente gia assunto')]))
  business.employees.push({ id: target, salary: Math.floor(business.income / 2), hiredAt: Date.now() })
  global.markDbDirty?.()
  return m.reply(box('Dipendente assunto', [row('✅', 'Utente:', getUserLabel(target)), row('🏢', 'Attivita:', business.name), row('💰', 'Stipendio:', `${formatCoins(Math.floor(business.income / 2))} UC`)]))
}

export default defineUnityLifePlugin(hire, { name: 'unitylife-hire', command: ['hire', 'assumi'], category: 'economy', description: 'Assume un dipendente', icon: '🤝', order: 36 })
