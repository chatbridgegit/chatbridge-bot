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
            ? "> 𝐓𝐢 𝐭𝐞𝐧𝐠𝐨 𝐝'𝐨𝐜𝐜𝐡𝐢𝐨 🧐"
            : lovePercentage < 80
            ? "> 𝐅𝐚𝐢 𝐬𝐜𝐡𝐢𝐟𝐨 🤢"
            : "> 𝐕𝐞𝐧𝐠𝐨 𝐚 𝐝𝐚𝐫𝐭𝐢 𝐥𝐚 𝐜𝐚𝐜𝐜𝐢𝐚 ☠️";

    let loveMessage = `
-------☾︎✿︎☽︎-------
𝙲𝙰𝙻𝙲𝙾𝙻𝙰𝚃𝙾𝚁𝙴 𝙳𝙸 𝙵𝚁𝙾𝙲𝙸 🏳️‍🌈
➡️ @${target.split('@')[0]} 𝚎̀ 𝚏𝚛𝚘𝚌𝚒𝚘 𝚍𝚎𝚕: ${lovePercentage}%
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
handler.command = /^(frocio|gay)$/i;

export default handler;