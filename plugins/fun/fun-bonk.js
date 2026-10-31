import jimp from 'jimp';
import path from 'path';
import { definePlugin } from '../../lib/plugin-utils.js';

let handler = async (m, { conn }) => {
  try {
    // Percorso dell'immagine locale
    const imagePath = path.resolve('./Storage/image/bonk.png');

    // Carica l'immagine base
    let img = await jimp.read(imagePath);

    // Utente da usare
    let who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;

    let avatarURL;
    try {
      avatarURL = await conn.profilePictureUrl(who, 'image');
    } catch {
      return conn.reply(
        m.chat,
        '𝐋𝐚 𝐟𝐨𝐭𝐨 𝐩𝐫𝐨𝐟𝐢𝐥𝐨 𝐝𝐞𝐥𝐥\'𝐮𝐭𝐞𝐧𝐭𝐞 𝐞̀ 𝐚𝐬𝐬𝐞𝐧𝐭𝐞 ✘',
        m
      );
    }

    // Carica la foto profilo
    let avatar = await jimp.read(avatarURL);

    // Crea l'immagine finale
    let bonk = await img
      .composite(
        avatar.resize(128, 128),
        120,
        90,
        {
          mode: 'dstOver',
          opacitySource: 1,
          opacityDest: 1
        }
      )
      .getBufferAsync(jimp.MIME_PNG);

    // Invia
    await conn.sendMessage(
      m.chat,
      { image: bonk },
      { quoted: m }
    );

  } catch (e) {
    console.error(e);
    m.reply('❌ Si è verificato un errore durante la creazione dell\'immagine.');
  }
};

export default definePlugin(handler, {
  name: 'fun-bonk',
  command: ['bonk'],
  category: 'fun',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Crea un’immagine meme con un avatar',
  icon: '🔨',
  order: 4,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
});