// Codice di fun-aura.js

// Codice di fun-aura.js

// Codice di fun-aura.js

let handler = async (m, { conn }) => {
    const target = m.sender

    const nome = await conn.getName(target)

    const eventiNormali = [
        { testo: 'ʟ\'ʜᴀ ᴍᴇssᴏ ᴅᴇɴᴛʀᴏ ɪʟ ᴄᴜʟᴏ ᴅɪ Nɪᴋʏ. 😋', punti: + 1500 },
        { testo: 'ʀɪᴍᴏʀᴄʜɪᴀ ʟᴇ ᴍᴀᴅʀɪ. 😏', punti: + 1500 },
        { testo: 'ᴇ̀ ʟᴇɢᴀᴛᴏ ᴇ ғʀᴜsᴛᴀᴛᴏ ᴅᴀɢʟɪ ɪɴᴅɪᴀɴɪ. ⛓️    ', punti: - 200 },
        { testo: 'ᴛʀᴏɪᴇɢɢɪᴀ ᴅᴀᴠᴀɴᴛɪ ᴀɢʟɪ ᴀsɪʟɪ. 😒', punti: - 1000 },
        { testo: 'ᴀʙʙᴀɪᴀ ᴄᴏɴ ᴘᴀssɪᴏɴᴇ ᴇ ɢᴏᴅᴜʀɪᴀ. 🐶', punti: - 700 },
        { testo: 'ʟᴇᴄᴄᴀ ɪʟ sᴏᴛᴛᴏᴘᴀʟʟᴀ ᴀᴅ ᴜɴ ʙᴀʀʙᴏɴᴇ 🧔🏾‍♂️', punti: - 300 },
        { testo: 'ʀɪᴍᴘᴀᴛʀɪᴀ ɪ ɴᴇʀɪ ᴀʟ ᴘʀᴏᴘʀɪᴏ ᴘᴀᴇsᴇ. 👨🏿', punti: + 1250 },
        { testo: 'ᴇ̀ ᴜɴᴀ ʙᴀʟᴇɴᴀ ᴇxᴛʀᴀ-ʟᴀʀɢᴇ. 🐋', punti: - 600 },
        { testo: 'ᴘɪᴄᴄʜɪᴀ ʟᴇ ᴅᴏɴɴᴇ. 😈', punti: + 1400 },
        { testo: 'ᴄᴀᴄᴄɪᴀ ʟᴇ ᴛʀᴏɪᴇ. 🤬', punti: + 300 },
        { testo: 'ʜᴀ ᴍᴇssᴏ ɪɴᴄɪɴᴛᴀ ᴜɴᴀ ɴɪɢᴇʀɪᴀɴᴀ. 👩🏿', punti: - 800 },
        { testo: 'ʜᴀ ɪɴᴠᴇsᴛɪᴛᴏ ᴜɴ ᴘʀᴏғᴜɢᴏ. 🏍', punti: + 650 },
        { testo: 'sɪ ғᴀ ʟᴀ ᴍᴀᴍᴍᴀ ᴅɪ Nɪᴋʏ 🤤', punti: + 1000 },
        { testo: 'ᴏʙʙᴇᴅɪsᴄᴇ ᴀ ǫᴜᴇʟ ɴᴀɴᴇʀᴏᴛᴛᴏʟᴏ ᴅɪ ɴɪᴋʏ. 😨', punti: - 1000 },
        { testo: 'ʟᴇᴄᴄᴀ ɢʟɪ ᴇsᴄʀᴇᴍᴇɴᴛɪ ᴅᴇʟʟᴇ ᴍᴜᴄᴄʜᴇ. 🐮', punti: - 400 },
        { testo: 'ᴇ̀ ᴘʀᴏ ᴀʟʟᴀ ʟɢʙᴛ. 😓', punti: - 1500 },
        { testo: 'ᴅᴇsɪᴅᴇʀᴀ ʟᴇ ʙᴀᴍʙɪɴᴇ. 💀', punti: -2500 },
        { testo: 'ᴅɪsᴄʀɪᴍɪɴᴀ ɪ ᴛᴇʀʀᴏɴɪ. ⛏️', punti: + 600 },
        { testo: 'sʙᴏʀʀᴀ ɪɴ ʙᴏᴄᴄᴀ ᴀ Nɪᴋʏ. 💦', punti: + 1500 },
        { testo: 'sɪ ᴇᴄᴄɪᴛᴀ ɢᴜᴀʀᴅᴀɴᴅᴏ ʟᴇ ᴠᴇᴄᴄʜɪᴇ. 👵🏼', punti: - 200 },
        { testo: 'ᴇ̀ ʙʀᴀᴠᴏ ᴄᴏɴ ʟᴇ ᴅɪᴛᴀ 😉.', punti: + 1300 },
        { testo: 'ᴄᴏʟʟᴇᴢɪᴏɴᴀ sᴄʜɪᴀᴠɪ sᴇɴᴇɢᴀʟᴇsɪ 👴🏿', punti: + 800 },
        { testo: 'ᴇ̀ sᴄᴀᴘᴘᴀᴛᴏ ɪɴ ᴍᴇssɪᴄᴏ ɪɴ ᴛᴇᴍᴘᴏ. 🤰', punti: + 1200 },
        { testo: 'ʜᴀ ɪʟ ᴄᴀᴢᴢᴏ ɢʀᴏssᴏ ᴇ sʙᴏʀʀᴏsᴏ. 🍌', punti: + 1300 },
        { testo: 'ʜᴀ ʟᴇ ᴇᴍᴏʀʀᴏɪᴅɪ. 🤢', punti: - 300 },

    ]

    const eventiRarissimi = [
        { testo: '𝕂𝕀ℕ𝔾 𝔻𝕀 𝕎ℍ𝔸𝕋𝕊𝔸ℙℙ 👑', punti: + 9999 },
        { testo: '𝕌𝕃𝕋ℝ𝔸 ℂℍ𝔸𝔻 🗿.', punti: + 9999 },
        { testo: '🫣 𝕙𝕒 𝕞𝕖𝕟𝕠 𝕕𝕚𝕣𝕚𝕥𝕥𝕚 𝕕𝕚 𝕦𝕟𝕒 𝕕𝕠𝕟𝕟𝕒.', punti: - 9999 },
        { testo: '𝕊𝕡𝕒𝕔𝕔𝕒 𝕚 𝕕𝕖𝕟𝕥𝕚 𝕒𝕘𝕝𝕚 𝕖𝕓𝕣𝕖𝕚 🧃', punti: + 9999 },
       
    ]
    let evento

    // 1% di probabilità di evento rarissimo
    if (Math.random() < 0.01) {
        evento = eventiRarissimi[Math.floor(Math.random() * eventiRarissimi.length)]
    } else {
        evento = eventiNormali[Math.floor(Math.random() * eventiNormali.length)]
    }

    // Inizializza utente nel database se necessario
    let user = global.db.data.users[target]
    if (!user) {
        global.db.data.users[target] = {}
        user = global.db.data.users[target]
    }

    // Inizializza aura se non esiste
    if (typeof user.aura !== 'number') {
        user.aura = 0
    }

    // Aggiorna aura totale
    user.aura += evento.punti

    const segno = evento.punti >= 0 ? '🟢' : '🔴'
    const aura = evento.punti >= 0 ? `+${evento.punti}` : `${evento.punti}`

    const testo = `
💯 *𝐀𝐧𝐚𝐥𝐢𝐬𝐢 𝐝𝐞𝐥𝐥'𝐚𝐮𝐫𝐚 𝐝𝐢 @${target.split('@')[0]}...*
━━━━━━━━━━━━
➪ ${evento.testo}
────
☆ 𝐋𝐢𝐯𝐞𝐥𝐥𝐨 𝐚𝐮𝐫𝐚: ${aura} ${segno} 
`.trim()

await conn.sendMessage(
    m.chat,
    {
        text: testo,
        mentions: [target],
        buttons: [
            {
                buttonId: '.aura',
                buttonText: {
                    displayText: '𝐀𝐮𝐫𝐚 💯'
                },
                type: 1
            },
            {
                buttonId: '.auratop',
                buttonText: {
                    displayText: '𝐀𝐮𝐫𝐚 𝐭𝐨𝐩 𝟏𝟎 🏆'
                },
                type: 1
            }
        ],
        headerType: 1
    },
    { quoted: m }
)
}

handler.help = ['aura [@utente]']
handler.tags = ['fun']
handler.command = /^aura$/i

export default handler