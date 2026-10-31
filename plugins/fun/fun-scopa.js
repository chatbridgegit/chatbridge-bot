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
            ? "> 𝐒𝐞𝐢 𝐮𝐧 𝐩𝐫𝐞𝐭𝐞 𝐨 𝐮𝐧𝐚 𝐬𝐮𝐨𝐫𝐚? 🥸"
            : lovePercentage < 80
            ? "> 𝐂𝐡𝐢𝐬𝐬𝐚̀ 𝐜𝐨𝐦𝐞 𝐟𝐢𝐧𝐢𝐫𝐚̀ 😏"
            : "> 𝐒𝐭𝐚𝐧𝐨𝐭𝐭𝐞 𝐟𝐚𝐫𝐞𝐭𝐞 𝐟𝐢𝐤𝐢-𝐟𝐢𝐤𝐢 😈";

    let loveMessage = `
-------☾︎ꨄ︎☽︎-------
𝙲𝙰𝙻𝙲𝙾𝙻𝙰𝚃𝙾𝚁𝙴 𝙳𝙸 𝚂𝙲𝙾𝙿𝙰𝚃𝙴💦😈
➡️ @${target.split('@')[0]} e te: ${lovePercentage}%

${response}
-------☾︎ꨄ︎☽︎-------
`.trim();

    await conn.sendMessage(m.chat, {
        text: loveMessage,
        mentions: [target]
    }, { quoted: m });

};

handler.help = ['scopa'];
handler.tags = ['fun'];
handler.command = /^(scopa)$/i;

export default handler;