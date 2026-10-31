import jimp from 'jimp';
import { definePlugin } from '../../lib/plugin-utils.js';

let handler = async (m, { conn, text }) => {
  try {
    // Prende l'utente menzionato, citato o mittente
    let who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;

    // Prova a ottenere l'immagine profilo
    let avatarUrl;
    try {
      avatarUrl = await conn.profilePictureUrl(who, 'image');
    } catch (e) {
      return conn.sendMessage(m.chat, {
        text: `𝐋'𝐮𝐭𝐞𝐧𝐭𝐞 𝐧𝐨𝐧 𝐡𝐚 𝐮𝐧𝐚 𝐟𝐨𝐭𝐨 𝐩𝐫𝐨𝐟𝐢𝐥𝐨 ✖`
      }, { quoted: m });
    }

    // CAMBIATO: carica immagine di sfondo da percorso locale
    let img = await jimp.read('./Storage/image/boom.png');  
    // Carica avatar
    let avatar = await jimp.read(avatarUrl);

    // Ridimensiona l’avatar
    const avatarSize = 150;
    avatar = avatar.resize(avatarSize, avatarSize);

    // Calcola posizione in basso a destra con margini
    const imgWidth = img.bitmap.width;
    const imgHeight = img.bitmap.height;
    const avatarX = imgWidth - avatarSize - 20;
    const avatarY = imgHeight - avatarSize - 60;

    // Sovrapponi avatar sull'immagine
    let finalImage = await img.composite(avatar, avatarX, avatarY, {
      mode: 'dstOver',
      opacitySource: 1,
      opacityDest: 1
    }).getBufferAsync('image/png');

    // Invia l'immagine
    await conn.sendMessage(m.chat, { image: finalImage }, { quoted: m });

  } catch (e) {
    console.error(e)
  }
};

export default definePlugin(handler, {
  name: 'fun-boom',
  command: ['boom'],
  category: 'fun',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Crea un’immagine meme con un avatar',
  icon: '💥',
  order: 6,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
});