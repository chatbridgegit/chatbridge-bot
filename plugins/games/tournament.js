import { pluginUi } from '../../lib/plugin-font.js'
import { defineUnityLifePlugin } from '../../lib/plugin-command.js'
import { getUserLabel, withEconomyLock } from '../../lib/uc-engine.js'

const box = (title, rows) => pluginUi.box(`🎮 ${title}`, rows)
const row = (icon, label, value) => pluginUi.row(icon, label, value == null ? '' : String(value))

async function tournament(m, extra) {
  return withEconomyLock(() => {
    const state = global.db.data.unityLife
    state.tournament = state.tournament || { entries: {}, season: 1 }
    if (extra.args[0] === 'iscriviti') {
      state.tournament.entries[m.sender] = state.tournament.entries[m.sender] || { wins: 0, joinedAt: Date.now() }
      global.markDbDirty?.()
      return m.reply(box('Torneo UnityLife', [row('✅', 'Stato:', 'iscrizione completata'), row('🏆', 'Stagione:', state.tournament.season)]))
    }
    const entries = Object.entries(state.tournament.entries).sort((a, b) => b[1].wins - a[1].wins).slice(0, 10)
    return m.reply(box('Classifica torneo', [...entries.map((entry, index) => row('🏆', `${index + 1}. ${getUserLabel(entry[0])}`, `${entry[1].wins} vittorie`)), row('🎁', 'Premi:', '1° 10.000 UC | 2° 5.000 UC | 3° 2.500 UC'), ...(entries.length ? [] : [row('ℹ️', 'Uso:', '.tournament iscriviti')])]))
  })
}

export default defineUnityLifePlugin(tournament, { name: 'unitylife-tournament', command: ['tournament', 'torneo'], category: 'games', description: 'Gestisce il torneo PvP', icon: '🏆', order: 34 })
