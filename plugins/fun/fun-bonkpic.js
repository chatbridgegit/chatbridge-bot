//Crediti: Onix, di Riad
import jimp from 'jimp';
import { definePlugin } from '../../lib/plugin-utils.js';

let handler = async (m, { conn }) => {
  let img = await jimp.read('https://i.imgur.com/nav6WWX.png'); // Immagine base del "bonk"
  let targetImage;

  // Verifica se il messaggio è una risposta a un'immagine
  if (m.quoted && m.quoted.mtype === 'imageMessage') {
    // Recupera l'immagine dalla risposta
    let media = await m.quoted.download();
    targetImage = await jimp.read(media);
  } else {
    // Se non è una risposta a un'immagine, usa la foto profilo del target o dell'autore del comando
    let who = m.mentionedJid?.[0] || m.sender;
    let avatarUrl = await conn.profilePictureUrl(who, 'image').catch(() => 'https://i.imgur.com/nav6WWX.png'); // Default in caso non ci sia immagine
    targetImage = await jimp.read(avatarUrl);
  }

  // Ridimensiona e posiziona l'immagine
  targetImage = targetImage.resize(128, 128); // Ridimensiona l'immagine target
  let bonkImage = await img.composite(targetImage, 120, 90, {
    mode: 'dstOver',
    opacitySource: 1,
    opacityDest: 1,
  });

  // Converti in buffer e invia
  let buffer = await bonkImage.getBufferAsync('image/png');
  conn.sendMessage(m.chat, { image: buffer }, { quoted: m });
};

export default definePlugin(handler, {
  name: 'fun-bonkpic',
  command: ['bonkpic'],
  category: 'fun',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Crea un’immagine meme usando un’immagine o un avatar',
  icon: '🖼️',
  order: 5,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
});