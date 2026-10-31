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
            ? "> 𝐒𝐞𝐢 𝐪𝐮𝐚𝐬𝐢 𝐬𝐚𝐧𝐨/𝐚 🫠"
            : lovePercentage < 80
            ? "> 𝐇𝐚𝐢 𝐠𝐢𝐚 𝐥𝐚 104?🫨"
            : "> 𝐂𝐮𝐫𝐚𝐭𝐢 𝐦𝐚𝐥𝐚𝐭𝐨 🤡";

    let loveMessage = `
-------☾︎✿︎☽︎-------
𝙲𝙰𝙻𝙲𝙾𝙻𝙰𝚃𝙾𝚁𝙴 𝙳𝙸 104 ♿️
➡️ @${target.split('@')[0]} 𝚎̀ 𝚑𝚊𝚗𝚍𝚒𝚌𝚊𝚙𝚙𝚊𝚝𝚘 𝚍𝚎𝚕: ${lovePercentage}%
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
handler.command = /^(104|disabile)$/i;

export default handler;