import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

function chatOf(m) { const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {}); if (typeof chat.soloadmin !== 'boolean') chat.soloadmin = false; return chat }
async function toggle(m, extra) { const chat = chatOf(m); const value = String(extra.text || '').trim().toLowerCase(); if (!['on', 'off'].includes(value)) return m.reply(pluginUi.box('🛡️ Solo Admin', [pluginUi.row(chat.soloadmin ? '✅' : '❌', 'Stato:', chat.soloadmin ? 'attivo' : 'disattivo'), pluginUi.row('ℹ️', 'Uso:', '.soloadmin on|off')])); chat.soloadmin = value === 'on'; global.markDbDirty?.(); return m.reply(pluginUi.box('🛡️ Solo Admin', [pluginUi.row(chat.soloadmin ? '✅' : '❌', 'Stato:', chat.soloadmin ? 'attivato' : 'disattivato')])) }
export default definePlugin(toggle, { name: 'feature-soloadmin', command: 'soloadmin', category: 'access', target: 'group', roles: ['admin', 'owner'], description: 'Limita i comandi agli admin', icon: '🛡️', permissions: { roles: ['admin', 'owner'] } }, { group: true })
