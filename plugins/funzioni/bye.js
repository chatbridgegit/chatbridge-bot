import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

function chatOf(m) { const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {}); if (typeof chat.bye !== 'boolean') chat.bye = true; return chat }
async function toggle(m, extra) { const chat = chatOf(m); const value = String(extra.text || '').trim().toLowerCase(); if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('👋 Addio', [pluginUi.row(chat.bye ? '✅' : '❌', 'Stato:', chat.bye ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.bye on|off')])); chat.bye = value === 'on'; global.markDbDirty?.(); return m.reply(pluginUi.box('👋 Addio', [pluginUi.row(chat.bye ? '✅' : '❌', 'Stato:', chat.bye ? 'attivato' : 'disattivato')])) }
export default definePlugin(toggle, { name: 'feature-bye', command: 'bye', category: 'automation', target: 'group', roles: ['admin', 'owner'], description: 'Gestisce i messaggi di uscita', icon: '👋', permissions: { roles: ['admin', 'owner'] } }, { group: true })
