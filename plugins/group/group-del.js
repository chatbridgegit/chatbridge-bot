import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import {
  deleteMessage,
  getRecentMessageKeys,
  groupState,
  recordAction
} from '../../lib/group-moderation.js'

async function del(m, extra) {
  const chat = groupState(m.chat)
  const requested = String(extra.text || '').trim()
  const number = requested ? Number(requested.split(/\s+/)[0]) : 0
  const keys = []

  if (m.quoted?.key?.id) keys.push(m.quoted.key)
  else if (Number.isInteger(number) && number > 0) {
    if (number > 100) {
      return m.reply(pluginUi.box('⚠️ Elimina', [
        pluginUi.row('ℹ️', 'Limite:', 'puoi eliminare al massimo 100 messaggi per volta')
      ]))
    }
    keys.push(...getRecentMessageKeys(this, m.chat, number + 1).filter(key => key.id !== m.id).slice(0, number))
  } else {
    return m.reply(pluginUi.box('⚠️ Elimina', [
      pluginUi.row('ℹ️', 'Uso:', '.del rispondi a un messaggio oppure .del <numero>')
    ]))
  }

  let deleted = 0
  for (const key of keys) {
    try {
      if (await deleteMessage(this, m.chat, key)) deleted++
    } catch {}
  }

  recordAction(chat, m.senderPn || m.sender, 'delete')
  return m.reply(pluginUi.box('🗑️ Elimina', [
    pluginUi.row('✅', 'Messaggi eliminati:', String(deleted)),
    ...(deleted === 0 ? [pluginUi.row('⚠️', 'Stato:', 'nessun messaggio eliminabile trovato')] : [])
  ]))
}

export default definePlugin(del, {
  name: 'group-delete',
  command: ['del', 'elimina'],
  category: 'group',
  target: 'group',
  roles: ['mod', 'admin', 'owner'],
  description: 'Elimina un messaggio o gli ultimi messaggi',
  icon: '🗑️',
  order: 75,
  permissions: { roles: ['mod', 'admin', 'owner'], botAdmin: true }
}, { group: true, botAdmin: true })
