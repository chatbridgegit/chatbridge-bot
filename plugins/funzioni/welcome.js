import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

function chatOf(m) { const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {}); if (typeof chat.welcome !== 'boolean') chat.welcome = true; return chat }
async function toggle(m, extra) { const chat = chatOf(m); const value = String(extra.text || '').trim().toLowerCase(); if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('🎉 Benvenuto', [pluginUi.row(chat.welcome ? '✅' : '❌', 'Stato:', chat.welcome ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.welcome on|off')])); chat.welcome = value === 'on'; global.markDbDirty?.(); return m.reply(pluginUi.box('🎉 Benvenuto', [pluginUi.row(chat.welcome ? '✅' : '❌', 'Stato:', chat.welcome ? 'attivato' : 'disattivato')])) }
export default definePlugin(toggle, { name: 'feature-welcome', command: 'welcome', category: 'automation', target: 'group', roles: ['admin', 'owner'], description: 'Gestisce i messaggi di benvenuto', icon: '🎉', permissions: { roles: ['admin', 'owner'] } }, { group: true })
