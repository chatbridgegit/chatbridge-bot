let handler = async (m, { conn, text }) => {

    let target =
        m.quoted?.sender ||
        m.mentionedJid?.[0] ||
        text?.trim()

    if (!target) {
        return m.reply("𝑫𝒆𝒗𝒊 𝒕𝒂𝒈𝒈𝒂𝒓𝒆 𝒐 𝒓𝒊𝒔𝒑𝒐𝒏𝒅𝒆𝒓𝒆 𝒂 𝒖𝒏 𝒎𝒆𝒔𝒔𝒂𝒈𝒈𝒊𝒐!");
    }

    if (!target.includes('@s.whatsapp.net')) {
        target = target.split('@')[0] + '@s.whatsapp.net';
    }

    let percent = Math.floor(Math.random() * 101);

    let msg = `
-------☾︎☠︎☽-------︎
𝙲𝙰𝙻𝙲𝙾𝙻𝙰𝚃𝙾𝚁𝙴 𝙳𝙸 𝚃𝚁𝙰𝙽𝚂 🏳️‍🌈⚧️

➡️ @${target.split('@')[0]} è trans del: ${percent}%

-------☾︎☠︎☽-------︎
`.trim();

    await conn.sendMessage(m.chat, {
        text: msg,
        mentions: [target]
    }, { quoted: m });

};

handler.command = /^(trans)$/i;
export default handler;