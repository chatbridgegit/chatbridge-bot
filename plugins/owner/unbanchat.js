import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

async function unbanchat(m) {
	if (!m.isGroup) {
		return m.reply(pluginUi.box('✅ Unban Chat', [
			pluginUi.row('ℹ️', 'Uso:', 'usa .unbanchat nel gruppo da ripristinare')
		]))
	}

	const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
	chat.isBanned = false
	chat.bannedAt = 0
	chat.bannedBy = null
	global.markDbDirty?.()

	return m.reply(pluginUi.box('✅ Chat ripristinata', [
		pluginUi.row('✅', 'Stato:', 'comandi riabilitati')
	]))
}

export default definePlugin(unbanchat, {
	name: 'owner-unbanchat',
	command: ['unbanchat'],
	category: 'owner',
	target: 'group',
	owner: true,
	roles: ['owner'],
	description: 'Riabilita i comandi del bot in un gruppo',
	icon: '✅',
	order: 13,
	permissions: { roles: ['owner'] }
}, { group: true })
