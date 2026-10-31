// Codice di fun-pompinara.js

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

    let segheAlGiorno = Math.floor(Math.random() * 21);

    let segheWord = segheAlGiorno === 1 ? '𝐜𝐚𝐳𝐳𝐨' : '𝐜𝐚𝐳𝐳𝐢';

    let response =
        segheAlGiorno === 0
            ? "> 𝑳𝒂 𝑽𝒆𝒓𝒈𝒊𝒏𝒆 𝑴𝒂𝒓𝒊𝒂 👸🏻"
            : segheAlGiorno <= 6
            ? "> 𝒃𝒐𝒄𝒄𝒂 𝒄𝒖𝒍𝒐 𝒇𝒊𝒈𝒂 😂"
            : segheAlGiorno <= 11
            ? "> 𝒍𝒂 𝒕𝒖𝒂 𝒃𝒐𝒄𝒄𝒂 𝒆̀ 𝒖𝒏 𝒑𝒂𝒓𝒄𝒉𝒆𝒈𝒈𝒊𝒐 💩"
            : "> 𝑺𝒆 𝒕𝒊 𝒅𝒊𝒄𝒐𝒏𝒐 𝒅𝒊 𝒔𝒑𝒖𝒕𝒂𝒓𝒆 𝒕𝒊 𝒐𝒇𝒇𝒆𝒏𝒅𝒊 💀";

    let segaioloMessage = `
◥ ━━━━━ 👄 ━━━━━ ◤
*𝐕𝐞𝐝𝐢𝐚𝐦𝐨 𝐪𝐮𝐚𝐧𝐭𝐨 𝐞̀ 𝐩𝐨𝐦𝐩𝐢𝐧𝐚𝐫𝐚*

➡️ @${target.split('@')[0]} 𝐬𝐮𝐜𝐜𝐡𝐢𝐚 ${segheAlGiorno} ${segheWord} 𝐚𝐥 𝐠𝐢𝐨𝐫𝐧𝐨

${response}
◥ ━━━━━ 👄 ━━━━━ ◤
`.trim();

    await conn.sendMessage(m.chat, {
        text: segaioloMessage,
        mentions: [target]
    }, { quoted: m });

};

handler.help = ['segaiolo'];
handler.tags = ['fun'];
handler.command = /^(pompinara)$/i;

export default handler;
//bubu