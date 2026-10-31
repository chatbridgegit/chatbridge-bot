import fs from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegPath from 'ffmpeg-static';
import { definePlugin } from '../../lib/plugin-utils.js';
import { storageDirectory } from '../../lib/storage.js';

const execFileAsync = promisify(execFile);
const storage = storageDirectory('audio');
fs.mkdirSync(storage, { recursive: true });
const FILTERS = {
    bass: ['-af', 'volume=2'],
    blown: ['-af', 'acrusher=.1:1:64:0:log'],
    deep: ['-af', 'atempo=4/4,asetrate=44500*2/3'],
    fast: ['-filter:a', 'atempo=1.6,asetrate=22100'],
    fat: ['-filter_complex', "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75"],
    nightcore: ['-filter:a', 'atempo=1.06,asetrate=44100*1.25'],
    reverse: ['-filter_complex', 'areverse'],
    robot: ['-af', 'equalizer=f=94:width_type=o:width=2:g=30'],
    slow: ['-filter:a', 'atempo=0.7,asetrate=44100'],
    smooth: ['-af', 'chorus=0.6:0.9:55:0.4:0.25:2'],
    tupai: ['-filter:a', 'atempo=0.5,asetrate=65100'],
    squirrel: ['-filter:a', 'atempo=0.5,asetrate=65100'],
    chipmunk: ['-filter:a', 'atempo=0.5,asetrate=65100'],
};

const getRandomName = ext => `${crypto.randomUUID()}${ext}`;

const handler = async (m, { conn, usedPrefix, command }) => {
    const prefix = usedPrefix || '.';

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    if (!/audio/.test(mime)) {
        return conn.sendMessage(m.chat, {
            text: `❌ Rispondi a un audio o a un vocale con il comando \`${prefix}${command}\``
        }, { quoted: m });
    }

    const filterArgs = FILTERS[command.toLowerCase()];
    if (!filterArgs) {
        return conn.sendMessage(m.chat, { text: '❌ Effetto non riconosciuto.' }, { quoted: m });
    }

    let inputPath, outputPath;
    try {
        if (!ffmpegPath) throw new Error('ffmpeg-static non disponibile.');
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        const media = await q.download(true);
        if (!media) throw new Error("Impossibile scaricare l'audio dal messaggio.");

        inputPath = join(storage, getRandomName('_input.mp3'));
        outputPath = join(storage, getRandomName('.mp3'));
        fs.writeFileSync(inputPath, typeof media === 'string' ? fs.readFileSync(media) : media);

        await execFileAsync(ffmpegPath, [
            '-hide_banner',
            '-loglevel', 'error',
            '-y',
            '-i', inputPath,
            ...filterArgs,
            '-vn',
            outputPath
        ], { timeout: 180000 });

        const buffer = fs.readFileSync(outputPath);
        await conn.sendMessage(m.chat, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: m });

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await conn.sendMessage(m.chat, {
            text: `❌ Errore durante l'elaborazione dell'audio: ${e.message || e}`
        }, { quoted: m });
    } finally {
        try { if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
        try { if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
    }
};

export default definePlugin(handler, {
    name: 'fun-audio',
    command: Object.keys(FILTERS),
    category: 'fun',
    target: 'group',
    roles: ['user', 'mod', 'admin', 'owner'],
    description: 'Applica effetti e filtri a un audio citato',
    icon: '🎧',
    order: 2,
    permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
}, { group: true });
