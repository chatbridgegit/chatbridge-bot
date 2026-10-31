import fs from 'fs';
import path from 'path';

let handler = async (m, { conn }) => {
  try {
    const imagePath = path.join('Storage', 'image', 'women.jpg');

      if (!fs.existsSync(imagePath)) {
      return m.reply('⚠️ Immagine non trovata nel percorso specificato.');
    }

    const imageBuffer = fs.readFileSync(imagePath);

    await conn.sendMessage(m.chat, {
      image: imageBuffer,
      caption: '☕️',
      viewOnce: true 
    }, { quoted: m });

  } catch (error) {
    m.reply('⚠️ Si è verificato un errore durante l\'invio dell\'immagine.');
  }
};

handler.help = ['fotopersonalizzata'];
handler.tags = ['tools'];
handler.command = /^(women|woman|donne|donna)$/i;

export default handler;