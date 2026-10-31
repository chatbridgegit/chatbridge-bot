const menuButtons = [
  ['🏠 Principale', '.menu-principale'],
  ['🎉 Divertimento', '.menu-divertimento'],
  ['🛠️ Tools', '.menu-tools'],
  ['🛡️ Protezioni', '.menuprotezioni'],
  ['💠 Economia', '.menu-economia'],
  ['🛡️ Admin/Mod', '.menu-adminmod', 'admin'],
  ['👑 Owner', '.menuowner', 'owner']
]

export function getMenuButtons(current, extra = {}) {
  const normalize = command => String(command).toLowerCase().replace(/^\./, '').replace(/-/g, '')
  const currentCommand = normalize(current)
  const canSeeAdminMenu = extra.isAdmin || extra.isModerator || extra.isOwner || extra.isROwner
  const canSeeOwnerMenu = extra.isOwner || extra.isROwner

  return menuButtons
    .filter(([, command]) => normalize(command) !== currentCommand)
    .filter(([, , role]) => role !== 'admin' || canSeeAdminMenu)
    .filter(([, , role]) => role !== 'owner' || canSeeOwnerMenu)
    .map(([label, command]) => [label, command])
}

export async function sendMenuMessage(conn, m, text, { image = null, footer = 'ChatBridge', buttons = [] } = {}) {
  const message = {
    ...(image ? { image: Buffer.isBuffer(image) ? image : { url: image }, caption: text } : { text }),
    footer,
    buttons: buttons.map(([label, id]) => ({
      buttonId: id,
      buttonText: { displayText: label },
      type: 1
    })),
    viewOnce: true,
    ...(image ? { headerType: 4 } : {})
  }

  return conn.sendMessage(m.chat, message, { quoted: m })
}
