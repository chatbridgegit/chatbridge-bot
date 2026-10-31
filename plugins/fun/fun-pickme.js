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

    let pickMePercentage = Math.floor(Math.random() * 101);

    let response =
        pickMePercentage < 30
            ? "> 𝑺𝒆𝒊 𝒂𝒄𝒄𝒆𝒕𝒕𝒂𝒃𝒊𝒍𝒆 😶"
            : pickMePercentage < 65
            ? "> 𝑻𝒊 𝒕𝒆𝒏𝒈𝒐 𝒅'𝒐𝒄𝒄𝒉𝒊𝒐 🧐"
            : pickMePercentage <= 80
            ? "> 𝑻𝒊 𝒔𝒕𝒐 𝒗𝒆𝒏𝒆𝒏𝒅𝒐 𝒂 𝒑𝒓𝒆𝒏𝒅𝒆𝒓𝒆 🖕🏼"
            : "> 𝑶𝒓𝒂 𝒍𝒆 𝒑𝒓𝒆𝒏𝒅𝒊 👿";

    let pickMeMessage = `
⪻───── 𓆩🤡𓆪 ─────⪼
*𝑪𝑨𝑳𝑪𝑶𝑳𝑨𝑻𝑶𝑹𝑬 𝑫𝑰 𝑷𝑰𝑪𝑲-𝑴𝑬*

➡️ @${target.split('@')[0]} è una pick-me del ${pickMePercentage}%

${response}
⪻───── 𓆩🤡𓆪 ─────⪼
`.trim();

    await conn.sendMessage(m.chat, {
        text: pickMeMessage,
        mentions: [target]
    }, { quoted: m });

};

handler.help = ['pickme'];
handler.tags = ['fun'];
handler.command = /^(pickme)$/i;

export default handler;