import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { ensureUnityProfile, getUserLabel } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function arena(m) {
  const users = Object.keys(global.db.data.users || {}).map(id => ({ id, wins: ensureUnityProfile(id).stats.pvpWins || 0 })).filter(item => item.wins).sort((a, b) => b.wins - a.wins).slice(0, 10)
  return m.reply(box('Arena PvP', users.length ? users.map((item, index) => row('⚔️', `${index + 1}. ${getUserLabel(item.id)}`, `${item.wins} vittorie`)) : [row('ℹ️', 'Stato:', 'nessuna vittoria registrata')]))
}

export default defineUnityLifePlugin(arena, { name: 'unitylife-arena', command: ['arena'], category: 'games', description: 'Mostra la classifica dell’arena PvP', icon: '🏟️', order: 32 })
