let handler = async (m, { conn, text }) => {

    let target;

    // reply
    if (m.quoted) {
        target = m.quoted.sender;

    // tag WhatsApp reale
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

    let size = Math.floor(Math.random() * 100);
    const frames = [
        '🫣',
        '🫣👀',
        '🫣👀💦',
        '🫣👀💦📏'
    ];
    const ANIMATION_DELAY = 450;

    const msg = await conn.sendMessage(m.chat, { text: frames[0] }, { quoted: m });

    for (let i = 1; i < frames.length; i++) {
        await new Promise(r => setTimeout(r, ANIMATION_DELAY));
        await conn.sendMessage(m.chat, {
            edit: msg.key,
            text: frames[i]
        }).catch(() => {});
    }

    let love = `
-------☾︎☠︎☽-------
𝙲𝙰𝙻𝙲𝙾𝙻𝙰𝚃𝙾𝚁𝙴 𝙳𝙸 𝙵𝙸𝙶𝙰🥔
➡️ @${target.split('@')[0]} ha la figa spalancata di ${size} cm
-------☾︎☠︎☽-------
`.trim();

    await conn.sendMessage(m.chat, {
        edit: msg.key,
        text: love,
        mentions: [target]
    }).catch(() => {});

};

handler.command = /^(figa)$/i;

export default handler;