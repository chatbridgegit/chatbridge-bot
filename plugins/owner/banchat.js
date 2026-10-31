import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

async function banchat(m) {
	if (!m.isGroup) {
		return m.reply(pluginUi.box('⛔ Ban Chat', [
			pluginUi.row('ℹ️', 'Uso:', 'usa .banchat nel gruppo da bloccare')
		]))
	}

	const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
	chat.isBanned = true
	chat.bannedAt = Date.now()
	chat.bannedBy = m.sender
	global.markDbDirty?.()

	return m.reply(pluginUi.box('⛔ Chat bloccata', [
		pluginUi.row('✅', 'Stato:', 'comandi disabilitati per tutti'),
		pluginUi.row('🔓', 'Ripristino:', '.unbanchat')
	]))
}

export default definePlugin(banchat, {
	name: 'owner-banchat',
	command: ['banchat'],
	category: 'owner',
	target: 'group',
	owner: true,
	roles: ['owner'],
	description: 'Disabilita i comandi del bot in un gruppo',
	icon: '⛔',
	order: 12,
	permissions: { roles: ['owner'] }
}, { group: true })
