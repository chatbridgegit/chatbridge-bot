// Codice di fun-emojimix.js by kinder

import fetch from 'node-fetch';
import { sticker } from '../../lib/sticker.js';
import { definePlugin } from '../../lib/plugin-utils.js';

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0] || !args[0].includes('+')) {
    return conn.reply(m.chat, `Usa il comando così:\n\n${usedPrefix + command} 🗿+😮‍💨`, m);
  }

  let [emoji1, emoji2] = args[0].split('+');
  if (!emoji1 || !emoji2) return conn.reply(m.chat, 'Devi inserire due emoji separate da `+`', m);

  try {
    let res = await fetch(`https://emoji-kitchen.vercel.app/s/${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}?size=512`);
    if (!res.ok) throw 'Emoji non supportate o combinazione non disponibile.';

    let buffer = await res.buffer();
    let stickerBuffer = await sticker(buffer, false, global.packname, global.author);
    await conn.sendFile(m.chat, stickerBuffer, 'emojimix.webp', '', m);
  } catch (e) {
    console.error(e);
    conn.reply(m.chat, 'Errore nel creare la combinazione! Forse una delle emoji non è supportata.', m);
  }
};

export default definePlugin(handler, {
  name: 'fun-emojimix',
  command: ['emojimix'],
  category: 'fun',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Combina due emoji e crea uno sticker',
  icon: '😄',
  order: 8,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
});