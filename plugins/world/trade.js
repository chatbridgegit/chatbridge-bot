import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { addItem, ensureUnityProfile, getUserLabel, itemById, removeItem, targetUser, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🌍 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function trade(m, extra) {
  const target = targetUser(m)
  const itemId = extra.args.find(value => itemById(value))
  if (!target || target === m.sender || !itemId) return m.reply(box('Scambio', [row('ℹ️', 'Uso:', '.trade @utente <itemId>')]))
  return withEconomyLock(() => {
    const sender = ensureUnityProfile(m.sender)
    const receiver = ensureUnityProfile(target)
    removeItem(sender, itemId)
    addItem(receiver, itemId)
    global.markDbDirty?.()
    return m.reply(box('Scambio completato', [row('✅', 'Destinatario:', getUserLabel(target)), row('🎁', 'Oggetto:', itemById(itemId).name)]))
  })
}

export default defineUnityLifePlugin(trade, { name: 'unitylife-trade', command: ['trade', 'scambia'], category: 'world', description: 'Scambia oggetti con un utente', icon: '🔄', order: 28 })
