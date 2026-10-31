import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { UNITY_CONFIG, businessById, debitCoins, ensureUnityProfile, formatCoins, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`💠 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function createBusiness(m, extra) {
  const type = businessById(extra.args[0])
  if (!type) return m.reply(box('Crea attivita', [row('ℹ️', 'Uso:', '.createbusiness <tipo> | <nome>'), row('📚', 'Tipi:', UNITY_CONFIG.businessTypes.map(item => item.id).join(', '))]))
  const name = extra.text.split('|').slice(1).join('|').trim() || type.name
  return withEconomyLock(() => {
    const profile = ensureUnityProfile(m.sender)
    debitCoins(m.sender, type.price, 'Creazione attivita')
    profile.businesses.push({ id: `${type.id}-${Date.now().toString(36)}`, type: type.id, name: name.slice(0, 40), level: 1, income: type.income, price: type.price, employees: [], createdAt: Date.now() })
    global.markDbDirty?.()
    return m.reply(box('Attivita creata', [row('✅', 'Nome:', name.slice(0, 40)), row('🏢', 'Tipo:', type.name), row('💸', 'Costo:', `${formatCoins(type.price)} UC`)]))
  })
}

export default defineUnityLifePlugin(createBusiness, { name: 'unitylife-createbusiness', command: ['createbusiness', 'creaattivita'], category: 'economy', description: 'Crea un’attivita virtuale', icon: '🏗️', order: 35 })
