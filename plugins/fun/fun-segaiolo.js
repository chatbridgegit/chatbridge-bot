let handler = async (m, { conn, text }) => {

    let target;

    // reply
    if (m.quoted) {
        target = m.quoted.sender;

    // tag vero WhatsApp
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

    let segheAlGiorno = Math.floor(Math.random() * 16);

    let segheWord = segheAlGiorno === 1 ? '𝐬𝐞𝐠𝐚' : '𝐬𝐞𝐠𝐡𝐞';

    let response =
        segheAlGiorno === 0
            ? "> 𝑽𝒆𝒓𝒐 𝒖𝒐𝒎𝒐 🗿"
            : segheAlGiorno <= 3
            ? "> 𝑳𝒂 𝒔𝒕𝒓𝒂𝒅𝒂 𝒅𝒆𝒍 𝒔𝒆𝑔𝒂𝒊𝒐𝒍𝒐 😖"
            : segheAlGiorno <= 10
            ? "> 𝑪𝒉𝒆 𝒔𝒆𝒈𝒂𝒊𝒐𝒍𝒐 💩"
            : "> 𝑺𝒆𝒊 𝒑𝒆𝒈𝒈𝒊𝒐 𝒅𝒊 𝑹𝒖𝒔𝒔𝒐 💀";

    let segaioloMessage = `
◥ ━━━━━ ッ ━━━━━ ◤
*𝐎𝐠𝐠𝐢 𝐬𝐜𝐨𝐩𝐫𝐢𝐚𝐦𝐨 𝐬𝐞 𝐞̀ 𝐮𝐧 𝐬𝐞𝐠𝐚𝐢𝐨𝐥𝐨*

➡️ @${target.split('@')[0]} 𝐬𝐢 𝐟𝐚 ${segheAlGiorno} ${segheWord} 𝐚𝐥 𝐠𝐢𝐨𝐫𝐧𝐨

${response}
◥ ━━━━━ ッ ━━━━━ ◤
`.trim();

    await conn.sendMessage(m.chat, {
        text: segaioloMessage,
        mentions: [target]
    }, { quoted: m });

};

handler.help = ['segaiolo'];
handler.tags = ['fun'];
handler.command = /^(segaiolo)$/i;

export default handler;