let handler = async (m, { conn, text }) => {

    let target;

    // 1. se è reply
    if (m.quoted) {
        target = m.quoted.sender;

    // 2. se c'è un tag nel messaggio
    } else if (m.mentionedJid && m.mentionedJid[0]) {
        target = m.mentionedJid[0];

    // 3. fallback testo
    } else if (text) {
        let mention = text.match(/@(\d+)/);
        if (mention) {
            target = mention[1] + "@s.whatsapp.net";
        }
    }

    if (!target) {
        return m.reply("𝑫𝒆𝒗𝒊 𝒕𝒂𝒈𝒈𝒂𝒓𝒆 𝒐 𝒄𝒊𝒕𝒂𝒓𝒆 𝒖𝒏𝒂 𝒑𝒆𝒓𝒔𝒐𝒏𝒂!");
    }

    let lovePercentage = Math.floor(Math.random() * 101);

    let response =
        lovePercentage < 50
            ? "> 𝐒𝐞𝐢 𝐮𝐧 𝐛𝐢𝐚𝐧𝐜𝐨 👶🏻"
            : lovePercentage < 80
            ? "> 𝐒𝐞𝐢 𝐦𝐮𝐥𝐚𝐭𝐭𝐨?👦🏾"
            : "> 𝐍𝐢𝐠𝐠𝐚🧔🏿";

    let loveMessage = `
-------☾︎☠︎︎︎☽︎-------
𝙲𝙰𝙻𝙲𝙾𝙻𝙰𝚃𝙾𝚁𝙴 𝙳𝙸 𝙽𝙴𝙶𝚁𝙴𝚉𝚉𝙰
➡️ @${target.split('@')[0]} 𝚎̀ 𝚗𝚎𝚐𝚛𝚘/𝚊 𝚍𝚎𝚕: ${lovePercentage}%
${response}
-------☾︎☠︎︎︎☽︎-------
`.trim();

    await conn.sendMessage(m.chat, {
        text: loveMessage,
        mentions: [target]
    }, { quoted: m });

};

handler.help = ['love'];
handler.tags = ['fun'];
handler.command = /^(negro|negra|nigga)$/i;

export default handler;