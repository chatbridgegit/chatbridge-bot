import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

async function topBestemmie(m) {
  const users = Object.entries(global.db?.data?.users || {})
    .map(([jid, user]) => ({ jid, count: Number(user?.blasphemy || 0) }))
    .filter(entry => Number.isFinite(entry.count) && entry.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 10)

  const rows = users.length
    ? users.map((entry, index) => pluginUi.row(
      index < 3 ? ['🥇', '🥈', '🥉'][index] : '▫️',
      `${index + 1}. @${entry.jid.split('@')[0]}`,
      `${entry.count} bestemmie`
    ))
    : [pluginUi.row('ℹ️', 'Stato:', 'nessun conteggio registrato')]

  return m.reply(pluginUi.box('🏆 Top Bestemmie', rows), null, { mentions: users.map(entry => entry.jid) })
}

export default definePlugin(topBestemmie, {
  name: 'info-top-bestemmie',
  command: 'topbestemmie',
  category: 'info',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra la classifica delle bestemmie',
  icon: '🏆',
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
