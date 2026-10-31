let handler = async (m, { conn, text }) => {

    let target;

    // reply
    if (m.quoted) {
        target = m.quoted.sender;

    // tag WhatsApp vero
    } else if (m.mentionedJid && m.mentionedJid[0]) {
        target = m.mentionedJid[0];

    // testo
    } else if (text) {
        target = text.trim();
    }

    if (!target) {
        return m.reply("𝑫𝒆𝒗𝒊 𝒕𝒂𝒈𝒈𝒂𝒓𝒆 𝒐 𝒓𝒊𝒔𝒑𝒐𝒏𝒅𝒆𝒓𝒆 𝒂 𝒖𝒏 𝒎𝒆𝒔𝒔𝒂𝒈𝒈𝒊𝒐!");
    }

    // sicurezza jid
    if (!target.includes('@s.whatsapp.net')) {
        target = target.split('@')[0] + '@s.whatsapp.net';
    }

    let lovePercentage = Math.floor(Math.random() * 101);

    let response =
        lovePercentage < 50
            ? "> 𝐌𝐞𝐧𝐨𝐦𝐚𝐥𝐞. 𝐂𝐨𝐧𝐭𝐢𝐧𝐮𝐚 𝐜𝐨𝐬𝐢̀🔅"
            : lovePercentage < 80
            ? "> 𝐓𝐫𝐨𝐢𝐞𝐠𝐠𝐢𝐚 𝐦𝐞𝐧𝐨! 🙄"
            : "> 𝐂𝐡𝐢𝐮𝐝𝐢 𝐪𝐮𝐞𝐥𝐥𝐞 𝐠𝐚𝐦𝐛𝐞 🤯";

    let loveMessage = `
-------☾︎☠︎☽︎-------
𝙲𝙰𝙻𝙲𝙾𝙻𝙰𝚃𝙾𝚁𝙴 𝙳𝙸 𝙿𝚄𝚃𝚃𝙰𝙽𝙴👠💄
➡️ @${target.split('@')[0]} è puttana al ${lovePercentage}%

${response}
-------☾︎☠︎☽︎-------
`.trim();

    await conn.sendMessage(m.chat, {
        text: loveMessage,
        mentions: [target]
    }, { quoted: m });

};

handler.help = ['love'];
handler.tags = ['fun'];
handler.command = /^(puttana|troia|cagna|zoccola)$/i;

export default handler;