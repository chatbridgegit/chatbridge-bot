let handler = async (m, { conn, text }) => {

    let target;

    if (m.quoted) {
        target = m.quoted.sender;

    } else if (m.mentionedJid && m.mentionedJid[0]) {
        target = m.mentionedJid[0];

    } else if (text) {
        target = text.trim();
    }

    if (!target) {
        return m.reply("𝑫𝒆𝒗𝒊 𝒕𝒂𝒈𝒈𝒂𝒓𝒆 𝒐 𝒄𝒊𝒕𝒂𝒓𝒆 𝒖𝒏𝒂 𝒑𝒆𝒓𝒔𝒐𝒏𝒂!");
    }

    // sicurezza: se non è jid completo lo corregge
    if (!target.includes('@s.whatsapp.net')) {
        target = target.split('@')[0] + '@s.whatsapp.net';
    }

    let size = Math.floor(Math.random() * 100);

    let love = `
-------☾︎☠︎☽-------
𝙲𝙰𝙻𝙲𝙾𝙻𝙰𝚃𝙾𝚁𝙴 𝙳𝙸 𝙲𝙰𝚉𝚉𝙾 🍆
➡️ @${target.split('@')[0]} ha il cazzo lungo ${size} cm
-------☾︎☠︎☽-------
`.trim();

    await conn.sendMessage(m.chat, {
        text: love,
        mentions: [target]
    }, { quoted: m });

};

handler.command = /^(cazzo)$/i;

export default handler;