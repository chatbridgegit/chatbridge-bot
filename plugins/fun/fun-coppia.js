import { definePlugin } from '../../lib/plugin-utils.js'

let toM = (a) => '@' + a.split('@')[0];

function handler(m, { groupMetadata, conn }) {

    let ps = groupMetadata.participants
        .map(v => v.id || v.jid)
        .filter(id => id && id !== (conn.user?.jid || conn.user?.id));

    if (ps.length < 4) {
        return m.reply("𝐏𝐚𝐫𝐭𝐞𝐜𝐢𝐩𝐚𝐧𝐭𝐢 𝐢𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭𝐢.");
    }

    let shuffled = ps.sort(() => Math.random() - 0.5);

    let coppia = shuffled.slice(0, 2);
    let geloso = shuffled[2];
    let amante = shuffled[3];

    let message = `💘 *𝘾𝙊𝙋𝙋𝙄𝘼 𝘿𝙀𝙇 𝙂𝙄𝙊𝙍𝙉𝙊* 💘\n\n`;
    
    message += `╭────────────⬣\n`;
    message += `${toM(coppia[0])} 𝐞 ${toM(coppia[1])}`;
    message += ` *𝐬𝐢 𝐬𝐨𝐧𝐨 𝐟𝐢𝐝𝐚𝐧𝐳𝐚𝐭𝐢!* 💍\n`;
    message += `╰────────────⬣\n\n`;

    message += `➤ ${toM(geloso)} *𝐞̀ 𝐠𝐞𝐥𝐨𝐬𝐨.* 🫢\n`;
    message += `➤ ${toM(amante)} *𝐞̀ 𝐢𝐥 𝐩𝐨𝐬𝐬𝐢𝐛𝐢𝐥𝐞 𝐚𝐦𝐚𝐧𝐭𝐞.*😏`;

    conn.sendMessage(m.chat, {
        text: message,
        mentions: [...coppia, geloso, amante]
    }, { quoted: m });

}

export default definePlugin(handler, {
  name: 'fun-coppia',
  command: ['coppia'],
  category: 'fun',
  target: 'group',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Estrae una coppia casuale tra i partecipanti',
  icon: '💘',
  order: 7,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
}, { group: true });