// Codice di fun-remigrazione.js

// Codice di fun-remigrazione.js

let handler = async (m, { conn }) => {
  let sender = m.sender;
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    sender = m.mentionedJid[0];
  }

  else if (m.quoted) {
    sender = m.quoted.sender;
  }
  await conn.sendMessage(m.chat, {
    text: `🚣🏿 @${sender.split('@')[0]} 𝐬𝐭𝐚 𝐫𝐞𝐦𝐢𝐠𝐫𝐚𝐧𝐝𝐨 𝐢𝐧...`,
    mentions: [sender]
  }, { quoted: m });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const paesi = [
    {
      paese: '🇦🇱 𝐀𝐋𝐁𝐀𝐍𝐈𝐀 🇦🇱',
      descrizioni: [
        '𝐎𝐡 𝐧𝐨! 𝐋𝐚 𝐦𝐚𝐝𝐫𝐞 𝐩𝐚𝐭𝐫𝐢𝐚 𝐝𝐢 𝐍𝐚𝐬𝐭𝐲, 𝐩𝐫𝐞𝐩𝐚𝐫𝐚𝐭𝐢 𝐬𝐟𝐢𝐠𝐚𝐭𝐨',
        '𝐓𝐨𝐫𝐧𝐢 𝐚 𝐜𝐚𝐬𝐚 𝐜𝐨𝐦𝐞 𝐁𝐚𝐧𝐚𝐧𝐚𝐬𝐭𝐲?',
        '𝐒𝐞 𝐯𝐞𝐝𝐢 𝐮𝐧 𝐬𝐨𝐠𝐠𝐞𝐭𝐭𝐨 𝐦𝐚𝐧𝐠𝐢𝐚𝐛𝐚𝐧𝐚𝐧𝐞 𝐝𝐢 𝐧𝐨𝐦𝐞 𝐍𝐚𝐬𝐭𝐲, 𝐬𝐜𝐚𝐩𝐩𝐚!'
      ]
    },

    {
      paese: '🇷🇴 𝐑𝐎𝐌𝐀𝐍𝐈𝐀 🇷🇴',
      descrizioni: [
        '𝐓𝐨𝐫𝐧𝐢 𝐚 𝐫𝐮𝐛𝐚𝐫𝐞 𝐢𝐥 𝐫𝐚𝐦𝐞?',
        '𝐄𝐜𝐜𝐨 𝐛𝐫𝐚𝐯𝐨 𝐟𝐚𝐢 𝐥𝐨 𝐳𝐢𝐧𝐠𝐚𝐫𝐨 𝐧𝐞𝐥 𝐭𝐮𝐨 𝐩𝐚𝐞𝐬𝐞.',
      ]
    },

    {
      paese: '🇲🇦 𝐌𝐀𝐑𝐎𝐂𝐂𝐎 🇲🇦',
      descrizioni: [
        '𝐅𝐢𝐧𝐚𝐥𝐦𝐞𝐧𝐭𝐞 𝐭𝐨𝐫𝐧𝐞𝐫𝐚𝐢 𝐚 𝐦𝐚𝐧𝐠𝐢𝐚𝐫𝐞 𝐜𝐨𝐮𝐬-𝐜𝐨𝐮𝐬, 𝐜𝐨𝐧𝐭𝐞𝐧𝐭𝐨?',
        '9𝐚7𝐛𝐚 𝐦𝐨𝐤 𝐬𝐢𝐫 𝐭9𝐚𝐰𝐝.',
      ]
    },

    {
      paese: '💦 𝐂𝐀𝐒𝐀 𝐃𝐈 𝐍𝐈𝐊𝐘 💦',
      descrizioni: [
        '𝐕𝐮𝐨𝐢 𝐩𝐫𝐨𝐩𝐫𝐢𝐨 𝐠𝐢𝐨𝐜𝐚𝐫𝐞 𝐜𝐨𝐧 𝐥𝐚 𝐠𝐨𝐥𝐚 𝐝𝐢 𝐍𝐢𝐤𝐲 𝐞𝐡.',
        '𝐑𝐞𝐦𝐢𝐠𝐫𝐢 𝐚 𝐜𝐚𝐬𝐚 𝐬𝐮𝐚 𝐨 𝐬𝐨𝐥𝐨 𝐧𝐞𝐥 𝐬𝐮𝐨 𝐥𝐞𝐭𝐭𝐨? 😉',
        '𝐀𝐩𝐩𝐞𝐧𝐚 𝐚𝐫𝐫𝐢𝐯𝐢, 𝐫𝐢𝐦𝐚𝐧𝐝𝐚𝐥𝐚 𝐢𝐧 𝐭𝐞𝐫𝐫𝐨𝐥𝐚𝐧𝐝𝐢𝐚.'
      ]
    },

    {
      paese: '🇹🇷 𝐓𝐔𝐑𝐂𝐇𝐈𝐀🇹🇷',
      descrizioni: [
        '𝐎𝐫𝐚 𝐢𝐥 𝐤𝐞𝐛𝐚𝐛𝐛𝐚𝐫𝐨 𝐥𝐨 𝐟𝐚𝐫𝐚𝐢 𝐚 𝐜𝐚𝐬𝐚 𝐭𝐮𝐚 𝐭𝐫𝐨𝐢𝐚!',
      ]
    },

    {
      paese: '🇹🇭 𝐓𝐇𝐀𝐈𝐋𝐀𝐍𝐃𝐈𝐀 🇹🇭',
      descrizioni: [
        '𝐓𝐨𝐫𝐧𝐢 𝐢𝐧𝐬𝐢𝐞𝐦𝐞 𝐚 𝐃𝐞𝐝𝐞 𝐢𝐥 𝐝𝐚𝐝𝐨?',
        '𝐑𝐞𝐦𝐢𝐠𝐫𝐚𝐳𝐢𝐨𝐧𝐞 𝐩𝐞𝐫 𝐪𝐮𝐚𝐥𝐜𝐡𝐞 𝐥𝐚𝐝𝐲𝐛𝐨𝐲 𝐬𝐢𝐜𝐮𝐫𝐚𝐦𝐞𝐧𝐭𝐞',
        '𝐃𝐞𝐝𝐞 𝐝𝐨𝐝𝐨 𝐭𝐢 𝐚𝐬𝐩𝐞𝐭𝐭𝐚',
      ]
    },

    {
      paese: '🇬🇭 𝐆𝐇𝐀𝐍𝐀 🇬🇭',
      descrizioni: [
        '𝐋𝐚 𝐦𝐚𝐝𝐫𝐞 𝐩𝐚𝐭𝐫𝐢𝐚 𝐝𝐢 𝐂𝐚𝐫𝐥𝐚, 𝐬𝐢𝐜𝐮𝐫𝐨 𝐝𝐢 𝐯𝐨𝐥𝐞𝐫 𝐚𝐧𝐝𝐚𝐫𝐞 𝐥𝐢̀?'
      ]
    },

    {
      paese: '🇳🇬 𝐍𝐈𝐆𝐄𝐑𝐈𝐀 🇳🇬',
      descrizioni: [
        '𝐕𝐨𝐢 𝐦𝐚𝐧𝐠𝐢𝐚-𝐟𝐮𝐟𝐮̀ 𝐬𝐢𝐞𝐭𝐞 𝐝𝐚𝐩𝐩𝐞𝐫𝐭𝐮𝐭𝐭𝐨',
      ]
    },

    {
      paese: '🇫🇷 𝐅𝐑𝐀𝐍𝐂𝐈𝐀 🇫🇷',
      descrizioni: [
        '𝐓𝐨𝐫𝐧𝐞𝐫𝐚𝐢 𝐚 𝐠𝐢𝐨𝐜𝐚𝐫𝐞 𝐜𝐨𝐧 𝐥𝐞 𝐛𝐚𝐠𝐮𝐞𝐭𝐭𝐞 𝐧𝐞𝐥 𝐜𝐮𝐥𝐨?',
      ]
    },

   {
      paese: '🇮🇳 𝐈𝐍𝐃𝐈𝐀 🇮🇳',
      descrizioni: [
        '𝐓𝐢 𝐦𝐚𝐧𝐜𝐚 𝐚𝐯𝐞𝐫𝐞 𝐥𝐚 𝐝𝐢𝐚𝐫𝐫𝐞𝐚 𝐭𝐮𝐭𝐭𝐢 𝐢 𝐠𝐢𝐨𝐫𝐧𝐢, 𝐯𝐞𝐫𝐨?',
        '𝐒𝐚𝐫𝐞𝐛𝐛𝐞 𝐬𝐭𝐚𝐭𝐨 𝐦𝐞𝐠𝐥𝐢𝐨 𝐚𝐧𝐝𝐚𝐫𝐞 𝐢𝐧 𝐮𝐧𝐚 𝐬𝐭𝐚𝐥𝐥𝐚, 𝐥𝐢̀ 𝐞̀ 𝐩𝐢𝐮 𝐩𝐮𝐥𝐢𝐭𝐨.'
      ]
    },

    {
      paese: '🇨🇴 𝐂𝐎𝐋𝐎𝐌𝐁𝐈𝐀 🇨🇴',
      descrizioni: [
        '𝐟𝐢𝐠𝐚 𝐟𝐢𝐠𝐚 𝐟𝐢𝐠𝐚 𝐟𝐢𝐠𝐚 𝐟𝐢𝐠𝐚 𝐟𝐢𝐠𝐚 𝐟𝐢𝐠𝐚',
        '𝐯𝐮𝐨𝐢 𝐟𝐚𝐫𝐞 𝐢𝐥 𝐩𝐚𝐩𝐚𝐬𝐢𝐭𝐨 𝐞𝐡𝐡𝐡'
      ]
    },

    {
      paese: '🇲🇽 𝐌𝐄𝐒𝐒𝐈𝐂𝐎 🇲🇽',
      descrizioni: [
        '𝐒𝐜𝐨𝐦𝐦𝐞𝐭𝐭𝐨 𝐜𝐡𝐞 𝐡𝐚𝐢 𝐦𝐞𝐬𝐬𝐨 𝐢𝐧𝐜𝐢𝐧𝐭𝐚 𝐪𝐮𝐚𝐥𝐜𝐮𝐧𝐚.',
        '𝐕𝐚𝐢 𝐥𝐢̀ 𝐚 𝐩𝐫𝐞𝐧𝐝𝐞𝐫𝐞 𝐢𝐥 𝐥𝐚𝐭𝐭𝐞?'
      ]
    }
  ];
  const scelto = paesi[Math.floor(Math.random() * paesi.length)];
  const descrizione =
    scelto.descrizioni[
      Math.floor(Math.random() * scelto.descrizioni.length)
    ];
  const risultato = `
${scelto.paese}

▪︎ ${descrizione}
`.trim();

  await conn.sendMessage(m.chat, {
    text: risultato
  }, { quoted: m });
};

handler.help = ['remigrazione'];
handler.tags = ['fun'];
handler.command = /^remigrazione|remigra|migra|remigro|migrazione|immigrazione$/i;

export default handler;