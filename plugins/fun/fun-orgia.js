let toM = (a) => '@' + a.split('@')[0];

function handler(m, { groupMetadata, conn }) {

    let ps = groupMetadata.participants
        .map(v => v.jid)
        .filter(id => id !== conn.user.jid);

    if (ps.length < 6) {
        return m.reply("𝐏𝐚𝐫𝐭𝐞𝐜𝐢𝐩𝐚𝐧𝐭𝐢 𝐢𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭𝐢 𝐩𝐞𝐫 𝐢𝐥 𝐠𝐢𝐨𝐜𝐨.");
    }

    let shuffled = ps.sort(() => Math.random() - 0.5);

    let inculano = shuffled.slice(0, 2);
    let inculati = shuffled.slice(2, 4);
    let spettatori = shuffled.slice(4, 6);

    // sicurezza (evita crash se gruppo piccolo)
    if (spettatori.length < 2) {
        return m.reply("𝐍𝐨𝐧 𝐜𝐢 𝐬𝐨𝐧𝐨 𝐚𝐛𝐛𝐚𝐬𝐭𝐚𝐧𝐳𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐞 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.");
    }

    let message = `💦⛓️ *𝕆ℝ𝔾𝕀𝔸 𝔻𝔼𝕃 𝕄𝕆𝕄𝔼ℕ𝕋𝕆* ⛓️💦\n\n`;
    message += `----------♕︎----------\n👑 ${toM(inculano[0])} 𝐞 ${toM(inculano[1])} *𝐢𝐧𝐜𝐮𝐥𝐞𝐫𝐚𝐧𝐧𝐨*.\n`;
    message += `----------☠︎︎----------\n💀 ${toM(inculati[0])} 𝐞 ${toM(inculati[1])} *𝐯𝐞𝐫𝐫𝐚𝐧𝐧𝐨 𝐢𝐧𝐜𝐮𝐥𝐚𝐭𝐢*.\n`;
    message += `----------シ︎----------\n😏 ${toM(spettatori[0])} 𝐞 ${toM(spettatori[1])} *𝐬𝐩𝐞𝐭𝐭𝐚𝐭𝐨𝐫𝐢*.\n\n`;
    message += `> 𝐁𝐮𝐨𝐧 𝐝𝐢𝐯𝐞𝐫𝐭𝐢𝐦𝐞𝐧𝐭𝐨😈`;

    conn.sendMessage(m.chat, {
        text: message,
        mentions: [...inculano, ...inculati, ...spettatori]
    }, { quoted: m });

}

handler.help = ['orgia'];
handler.tags = ['fun'];
handler.command = /^orgia$/i;
handler.group = true;

export default handler;