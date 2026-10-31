// Codice di fun-sborra.js

//crediti: Onix, di Riad
let handler = async (m, { conn, participants }) => {
    if (m.isAuthenticatedSelf) return;

    let chat = global.db.data.chats[m.chat] || {};
    if (chat.antisbura) return;

    let sender = m.sender;
    let groupMembers = participants.map(p => p.id).filter(id => id !== sender && id !== conn.user.jid);

    if (groupMembers.length === 0) {
        return m.reply("Non ci sono abbastanza membri nel gruppo per eseguire questo comando!");
    }

    let randomUser = groupMembers[Math.floor(Math.random() * groupMembers.length)];

    let message = `> 𝐌𝐨𝐦𝐞𝐧𝐭𝐨 𝐬𝐛𝐨𝐫𝐫𝐚𝐭𝐚 𝐝𝐢 @${sender.split('@')[0]} 😏 \n @${sender.split('@')[0]} 𝐬𝐭𝐚 𝐬𝐛𝐨𝐫𝐫𝐚𝐧𝐝𝐨 𝐧𝐞𝐥𝐥𝐚 𝐛𝐨𝐜𝐜𝐚 𝐝𝐢  @${randomUser.split('@')[0]}  💦 \n`;

    // Bottone per la lista warn
    const buttons = [
        { buttonId: '.sborr', buttonText: { displayText: '𝐒𝐛𝐨𝐫𝐫𝐚 𝐝𝐢 𝐧𝐮𝐨𝐯𝐨 😏' }, type: 1 }
    ];

    await conn.sendMessage(m.chat, {
        text: message,
        mentions: [sender, randomUser],
        buttons: buttons,
        headerType: 1
    }, { quoted: m });
}

handler.customPrefix = /sborr|sburr/i;
handler.command = new RegExp
handler.botAdmin = true;
handler.fail = null
export default handler;
