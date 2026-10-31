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
            ? "> 𝐂𝐡𝐞 𝐜𝐞𝐬𝐬𝐨/𝐚.🤮"
            : lovePercentage < 80
            ? "> 𝐂'𝐞̀ 𝐝𝐢 𝐦𝐞𝐠𝐥𝐢𝐨.🙃"
            : "> 𝐂𝐡𝐞 𝐬𝐜𝐡𝐢𝐚𝐧𝐭𝐨!🤩";

    let loveMessage = `
-------☾︎✿︎☽︎-------
𝙲𝙰𝙻𝙲𝙾𝙻𝙰𝚃𝙾𝚁𝙴 𝙳𝙸 𝚂𝙴𝚇𝙰𝙶𝙶𝙸𝙽𝙴🥵💦
➡️ @${target.split('@')[0]} 𝚎̀ 𝚜𝚎𝚡𝚢 𝚍𝚎𝚕: ${lovePercentage}%
${response}
-------☾︎✿︎☽︎-------
`.trim();

    await conn.sendMessage(m.chat, {
        text: loveMessage,
        mentions: [target]
    }, { quoted: m });

};

handler.help = ['love'];
handler.tags = ['fun'];
handler.command = /^(sexy)$/i;

export default handler;