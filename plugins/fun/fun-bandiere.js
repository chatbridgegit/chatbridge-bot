
import { definePlugin } from '../../lib/plugin-utils.js'

let handler = async (m, { conn, isAdmin, command }) => {
  // Controllo antigiochi
  let chatConfig = global.db.data.chats[m.chat] || {}
if (chatConfig.antigiochi) {
    return m.reply('> 📛 𝐀𝐍𝐓𝐈𝐆𝐈𝐎𝐂𝐇𝐈 𝐀𝐓𝐓𝐈𝐕𝐎 📛\n𝐈 𝐠𝐢𝐨𝐜𝐡𝐢 𝐬𝐨𝐧𝐨 𝐢𝐧 𝐩𝐚𝐮𝐬𝐚 𝐩𝐞𝐫 𝐢𝐥 𝐦𝐨𝐦𝐞𝐧𝐭𝐨. ');
    }

  if (command === 'skipbandiera') {
    if (!m.isGroup) return m.reply('⚠️ 𝑫𝒊𝒔𝒑𝒐𝒏𝒊𝒃𝒊𝒍𝒆 𝒔𝒐𝒍𝒐 𝒑𝒆𝒓 𝒈𝒓𝒖𝒑𝒑𝒊')
    if (!global.bandieraGame?.[m.chat]) return m.reply('⚠️ 𝑵𝒆𝒔𝒔𝒖𝒏𝒂 𝒑𝒂𝒓𝒕𝒊𝒕𝒂 𝒂𝒗𝒗𝒊𝒂𝒕𝒂.')

    if (!isAdmin) {
      return m.reply('⚠️ *𝑺𝒐𝒍𝒐 𝒑𝒆𝒓 𝒂𝒅𝒎𝒊𝒏𝒔*')
    }

    clearTimeout(global.bandieraGame[m.chat].timeout)
    await conn.reply(m.chat, `❗ *𝐆𝐢𝐨𝐜𝐨 𝐢𝐧𝐭𝐞𝐫𝐫𝐨𝐭𝐭𝐨 𝐝𝐚 𝐮𝐧 𝐬𝐮𝐩𝐫𝐞𝐦𝐨*\n 𝐋𝐚 𝐫𝐢𝐬𝐩𝐨𝐬𝐭𝐚 𝐞𝐫𝐚: *${global.bandieraGame[m.chat].rispostaOriginale}*`, m)
    delete global.bandieraGame[m.chat]
    return
  }

  if (global.bandieraGame?.[m.chat]) {
    return m.reply('𝐅𝐢𝐧𝐢𝐬𝐜𝐢 𝐩𝐫𝐢𝐦𝐚 𝐥𝐚 𝐩𝐚𝐫𝐭𝐢𝐭𝐚 𝐜𝐡𝐞 𝐞̀ 𝐢𝐧 𝐜𝐨𝐫𝐬𝐨.')
  }

  const cooldownKey = `bandiera_${m.chat}`
  const lastGame = global.cooldowns?.[cooldownKey] || 0
  const now = Date.now()
  const cooldownTime = 10000

  if (now - lastGame < cooldownTime) {
    const remainingTime = Math.ceil((cooldownTime - (now - lastGame)) / 1000)
    return m.reply(`⏱️ *𝐀𝐬𝐩𝐞𝐭𝐭𝐚! 𝐋𝐚 𝐩𝐚𝐫𝐭𝐢𝐭𝐚 𝐟𝐢𝐧𝐢𝐬𝐜𝐞 𝐭𝐫𝐚 ${remainingTime} 𝐬𝐞𝐜𝐨𝐧𝐝𝐢*`)
  }

  global.cooldowns = global.cooldowns || {}
  global.cooldowns[cooldownKey] = now

    let bandiere = [
    { url: 'https://flagcdn.com/w320/it.png', nome: 'Italia' },
    { url: 'https://flagcdn.com/w320/fr.png', nome: 'Francia' },
    { url: 'https://flagcdn.com/w320/de.png', nome: 'Germania' },
    { url: 'https://flagcdn.com/w320/gb.png', nome: 'Regno Unito' },
    { url: 'https://flagcdn.com/w320/es.png', nome: 'Spagna' },
    { url: 'https://flagcdn.com/w320/se.png', nome: 'Svezia' },
    { url: 'https://flagcdn.com/w320/no.png', nome: 'Norvegia' },
    { url: 'https://flagcdn.com/w320/fi.png', nome: 'Finlandia' },
    { url: 'https://flagcdn.com/w320/dk.png', nome: 'Danimarca' },
    { url: 'https://flagcdn.com/w320/pl.png', nome: 'Polonia' },
    { url: 'https://flagcdn.com/w320/pt.png', nome: 'Portogallo' },
    { url: 'https://flagcdn.com/w320/gr.png', nome: 'Grecia' },
    { url: 'https://flagcdn.com/w320/ch.png', nome: 'Svizzera' },
    { url: 'https://flagcdn.com/w320/at.png', nome: 'Austria' },
    { url: 'https://flagcdn.com/w320/be.png', nome: 'Belgio' },
    { url: 'https://flagcdn.com/w320/nl.png', nome: 'Paesi Bassi' },
    { url: 'https://flagcdn.com/w320/ua.png', nome: 'Ucraina' },
    { url: 'https://flagcdn.com/w320/ro.png', nome: 'Romania' },
    { url: 'https://flagcdn.com/w320/hu.png', nome: 'Ungheria' },
    { url: 'https://flagcdn.com/w320/cz.png', nome: 'Repubblica Ceca' },
    { url: 'https://flagcdn.com/w320/ie.png', nome: 'Irlanda' },
    { url: 'https://flagcdn.com/w320/ee.png', nome: 'Estonia' },
    { url: 'https://flagcdn.com/w320/lt.png', nome: 'Lituania' },
    { url: 'https://flagcdn.com/w320/lv.png', nome: 'Lettonia' },
    { url: 'https://flagcdn.com/w320/sk.png', nome: 'Slovacchia' },
    { url: 'https://flagcdn.com/w320/si.png', nome: 'Slovenia' },
    { url: 'https://flagcdn.com/w320/hr.png', nome: 'Croazia' },
    { url: 'https://flagcdn.com/w320/ba.png', nome: 'Bosnia ed Erzegovina' },
    { url: 'https://flagcdn.com/w320/me.png', nome: 'Montenegro' },
    { url: 'https://flagcdn.com/w320/mk.png', nome: 'Macedonia del Nord' },
    { url: 'https://flagcdn.com/w320/al.png', nome: 'Albania' },
    { url: 'https://flagcdn.com/w320/bg.png', nome: 'Bulgaria' },
    { url: 'https://flagcdn.com/w320/md.png', nome: 'Moldavia' },
    { url: 'https://flagcdn.com/w320/by.png', nome: 'Bielorussia' },
    { url: 'https://flagcdn.com/w320/is.png', nome: 'Islanda' },
    { url: 'https://flagcdn.com/w320/mt.png', nome: 'Malta' },
    { url: 'https://flagcdn.com/w320/cy.png', nome: 'Cipro' },
    { url: 'https://flagcdn.com/w320/lu.png', nome: 'Lussemburgo' },
    { url: 'https://flagcdn.com/w320/li.png', nome: 'Liechtenstein' },
    { url: 'https://flagcdn.com/w320/sm.png', nome: 'San Marino' },
    { url: 'https://flagcdn.com/w320/ad.png', nome: 'Andorra' },
    { url: 'https://flagcdn.com/w320/mc.png', nome: 'Monaco' },
    { url: 'https://flagcdn.com/w320/va.png', nome: 'Città del Vaticano' },
    { url: 'https://flagcdn.com/w320/rs.png', nome: 'Serbia' },
    { url: 'https://flagcdn.com/w320/xk.png', nome: 'Kosovo' },
    { url: 'https://flagcdn.com/w320/cn.png', nome: 'Cina' },
    { url: 'https://flagcdn.com/w320/jp.png', nome: 'Giappone' },
    { url: 'https://flagcdn.com/w320/in.png', nome: 'India' },
    { url: 'https://flagcdn.com/w320/kr.png', nome: 'Corea del Sud' },
    { url: 'https://flagcdn.com/w320/kp.png', nome: 'Corea del Nord' },
    { url: 'https://flagcdn.com/w320/th.png', nome: 'Thailandia' },
    { url: 'https://flagcdn.com/w320/vn.png', nome: 'Vietnam' },
    { url: 'https://flagcdn.com/w320/id.png', nome: 'Indonesia' },
    { url: 'https://flagcdn.com/w320/ph.png', nome: 'Filippine' },
    { url: 'https://flagcdn.com/w320/my.png', nome: 'Malesia' },
    { url: 'https://flagcdn.com/w320/sg.png', nome: 'Singapore' },
    { url: 'https://flagcdn.com/w320/mm.png', nome: 'Myanmar' },
    { url: 'https://flagcdn.com/w320/kh.png', nome: 'Cambogia' },
    { url: 'https://flagcdn.com/w320/la.png', nome: 'Laos' },
    { url: 'https://flagcdn.com/w320/lk.png', nome: 'Sri Lanka' },
    { url: 'https://flagcdn.com/w320/np.png', nome: 'Nepal' },
    { url: 'https://flagcdn.com/w320/bt.png', nome: 'Bhutan' },
    { url: 'https://flagcdn.com/w320/bd.png', nome: 'Bangladesh' },
    { url: 'https://flagcdn.com/w320/pk.png', nome: 'Pakistan' },
    { url: 'https://flagcdn.com/w320/af.png', nome: 'Afghanistan' },
    { url: 'https://flagcdn.com/w320/ir.png', nome: 'Iran' },
    { url: 'https://flagcdn.com/w320/iq.png', nome: 'Iraq' },
    { url: 'https://flagcdn.com/w320/tr.png', nome: 'Turchia' },
    { url: 'https://flagcdn.com/w320/ps.png', nome: 'Palestina' },
    { url: 'https://flagcdn.com/w320/sa.png', nome: 'Arabia Saudita' },
    { url: 'https://flagcdn.com/w320/ae.png', nome: 'Emirati Arabi Uniti' },
    { url: 'https://flagcdn.com/w320/qa.png', nome: 'Qatar' },
    { url: 'https://flagcdn.com/w320/om.png', nome: 'Oman' },
    { url: 'https://flagcdn.com/w320/jo.png', nome: 'Giordania' },
    { url: 'https://flagcdn.com/w320/lb.png', nome: 'Libano' },
    { url: 'https://flagcdn.com/w320/sy.png', nome: 'Siria' },
    { url: 'https://flagcdn.com/w320/ye.png', nome: 'Yemen' },
    { url: 'https://flagcdn.com/w320/kz.png', nome: 'Kazakistan' },
    { url: 'https://flagcdn.com/w320/uz.png', nome: 'Uzbekistan' },
    { url: 'https://flagcdn.com/w320/tj.png', nome: 'Tagikistan' },
    { url: 'https://flagcdn.com/w320/kg.png', nome: 'Kirghizistan' },
    { url: 'https://flagcdn.com/w320/tm.png', nome: 'Turkmenistan' },
    { url: 'https://flagcdn.com/w320/mn.png', nome: 'Mongolia' },
    { url: 'https://flagcdn.com/w320/az.png', nome: 'Azerbaigian' },
    { url: 'https://flagcdn.com/w320/ge.png', nome: 'Georgia' },
    { url: 'https://flagcdn.com/w320/am.png', nome: 'Armenia' },
    { url: 'https://flagcdn.com/w320/kw.png', nome: 'Kuwait' },
    { url: 'https://flagcdn.com/w320/bh.png', nome: 'Bahrain' },
    { url: 'https://flagcdn.com/w320/tw.png', nome: 'Taiwan' },
    { url: 'https://flagcdn.com/w320/hk.png', nome: 'Hong Kong' },
    { url: 'https://flagcdn.com/w320/eg.png', nome: 'Egitto' },
    { url: 'https://flagcdn.com/w320/ng.png', nome: 'Nigeria' },
    { url: 'https://flagcdn.com/w320/ma.png', nome: 'Marocco' },
    { url: 'https://flagcdn.com/w320/tn.png', nome: 'Tunisia' },
    { url: 'https://flagcdn.com/w320/ke.png', nome: 'Kenya' },
    { url: 'https://flagcdn.com/w320/et.png', nome: 'Etiopia' },
    { url: 'https://flagcdn.com/w320/gh.png', nome: 'Ghana' },
    { url: 'https://flagcdn.com/w320/cm.png', nome: 'Camerun' },
    { url: 'https://flagcdn.com/w320/ci.png', nome: "Costa d'Avorio" },
    { url: 'https://flagcdn.com/w320/sn.png', nome: 'Senegal' },
    { url: 'https://flagcdn.com/w320/zm.png', nome: 'Zambia' },
    { url: 'https://flagcdn.com/w320/zw.png', nome: 'Zimbabwe' },
    { url: 'https://flagcdn.com/w320/ao.png', nome: 'Angola' },
    { url: 'https://flagcdn.com/w320/mg.png', nome: 'Madagascar' },
    { url: 'https://flagcdn.com/w320/tz.png', nome: 'Tanzania' },
    { url: 'https://flagcdn.com/w320/ug.png', nome: 'Uganda' },
    { url: 'https://flagcdn.com/w320/mz.png', nome: 'Mozambico' },
    { url: 'https://flagcdn.com/w320/rw.png', nome: 'Ruanda' },
    { url: 'https://flagcdn.com/w320/mw.png', nome: 'Malawi' },
    { url: 'https://flagcdn.com/w320/bw.png', nome: 'Botswana' },
    { url: 'https://flagcdn.com/w320/na.png', nome: 'Namibia' },
    { url: 'https://flagcdn.com/w320/sz.png', nome: 'Eswatini' },
    { url: 'https://flagcdn.com/w320/ls.png', nome: 'Lesotho' },
    { url: 'https://flagcdn.com/w320/dz.png', nome: 'Algeria' },
    { url: 'https://flagcdn.com/w320/ly.png', nome: 'Libia' },
    { url: 'https://flagcdn.com/w320/sd.png', nome: 'Sudan' },
    { url: 'https://flagcdn.com/w320/ss.png', nome: 'Sudan del Sud' },
    { url: 'https://flagcdn.com/w320/er.png', nome: 'Eritrea' },
    { url: 'https://flagcdn.com/w320/dj.png', nome: 'Gibuti' },
    { url: 'https://flagcdn.com/w320/so.png', nome: 'Somalia' },
    { url: 'https://flagcdn.com/w320/cd.png', nome: 'Repubblica Democratica del Congo' },
    { url: 'https://flagcdn.com/w320/cg.png', nome: 'Repubblica del Congo' },
    { url: 'https://flagcdn.com/w320/cf.png', nome: 'Repubblica Centrafricana' },
    { url: 'https://flagcdn.com/w320/td.png', nome: 'Ciad' },
    { url: 'https://flagcdn.com/w320/ne.png', nome: 'Niger' },
    { url: 'https://flagcdn.com/w320/ml.png', nome: 'Mali' },
    { url: 'https://flagcdn.com/w320/bf.png', nome: 'Burkina Faso' },
    { url: 'https://flagcdn.com/w320/mr.png', nome: 'Mauritania' },
    { url: 'https://flagcdn.com/w320/gn.png', nome: 'Guinea' },
    { url: 'https://flagcdn.com/w320/gw.png', nome: 'Guinea-Bissau' },
    { url: 'https://flagcdn.com/w320/sl.png', nome: 'Sierra Leone' },
    { url: 'https://flagcdn.com/w320/lr.png', nome: 'Liberia' },
    { url: 'https://flagcdn.com/w320/tg.png', nome: 'Togo' },
    { url: 'https://flagcdn.com/w320/bj.png', nome: 'Benin' },
    { url: 'https://flagcdn.com/w320/ga.png', nome: 'Gabon' },
    { url: 'https://flagcdn.com/w320/gq.png', nome: 'Guinea Equatoriale' },
    { url: 'https://flagcdn.com/w320/cv.png', nome: 'Capo Verde' },
    { url: 'https://flagcdn.com/w320/gm.png', nome: 'Gambia' },
    { url: 'https://flagcdn.com/w320/bi.png', nome: 'Burundi' },
    { url: 'https://flagcdn.com/w320/km.png', nome: 'Comore' },
    { url: 'https://flagcdn.com/w320/mu.png', nome: 'Mauritius' },
    { url: 'https://flagcdn.com/w320/sc.png', nome: 'Seychelles' },
    { url: 'https://flagcdn.com/w320/us.png', nome: 'Stati Uniti' },
    { url: 'https://flagcdn.com/w320/ca.png', nome: 'Canada' },
    { url: 'https://flagcdn.com/w320/mx.png', nome: 'Messico' },
    { url: 'https://flagcdn.com/w320/br.png', nome: 'Brasile' },
    { url: 'https://flagcdn.com/w320/ar.png', nome: 'Argentina' },
    { url: 'https://flagcdn.com/w320/cl.png', nome: 'Cile' },
    { url: 'https://flagcdn.com/w320/co.png', nome: 'Colombia' },
    { url: 'https://flagcdn.com/w320/pe.png', nome: 'Perù' },
    { url: 'https://flagcdn.com/w320/ve.png', nome: 'Venezuela' },
    { url: 'https://flagcdn.com/w320/cu.png', nome: 'Cuba' },
    { url: 'https://flagcdn.com/w320/bo.png', nome: 'Bolivia' },
    { url: 'https://flagcdn.com/w320/ec.png', nome: 'Ecuador' },
    { url: 'https://flagcdn.com/w320/uy.png', nome: 'Uruguay' },
    { url: 'https://flagcdn.com/w320/py.png', nome: 'Paraguay' },
    { url: 'https://flagcdn.com/w320/cr.png', nome: 'Costa Rica' },
    { url: 'https://flagcdn.com/w320/pa.png', nome: 'Panama' },
    { url: 'https://flagcdn.com/w320/do.png', nome: 'Repubblica Dominicana' },
    { url: 'https://flagcdn.com/w320/jm.png', nome: 'Giamaica' },
    { url: 'https://flagcdn.com/w320/gt.png', nome: 'Guatemala' },
    { url: 'https://flagcdn.com/w320/hn.png', nome: 'Honduras' },
    { url: 'https://flagcdn.com/w320/ni.png', nome: 'Nicaragua' },
    { url: 'https://flagcdn.com/w320/sv.png', nome: 'El Salvador' },
    { url: 'https://flagcdn.com/w320/bz.png', nome: 'Belize' },
    { url: 'https://flagcdn.com/w320/ht.png', nome: 'Haiti' },
    { url: 'https://flagcdn.com/w320/gy.png', nome: 'Guyana' },
    { url: 'https://flagcdn.com/w320/sr.png', nome: 'Suriname' },
    { url: 'https://flagcdn.com/w320/gf.png', nome: 'Guyana Francese' },
    { url: 'https://flagcdn.com/w320/tt.png', nome: 'Trinidad e Tobago' },
    { url: 'https://flagcdn.com/w320/bb.png', nome: 'Barbados' },
    { url: 'https://flagcdn.com/w320/lc.png', nome: 'Santa Lucia' },
    { url: 'https://flagcdn.com/w320/dm.png', nome: 'Dominica' },
    { url: 'https://flagcdn.com/w320/bs.png', nome: 'Bahamas' },
    { url: 'https://flagcdn.com/w320/au.png', nome: 'Australia' },
    { url: 'https://flagcdn.com/w320/nz.png', nome: 'Nuova Zelanda' },
    { url: 'https://flagcdn.com/w320/fj.png', nome: 'Fiji' },
    { url: 'https://flagcdn.com/w320/pg.png', nome: 'Papua Nuova Guinea' },
    { url: 'https://flagcdn.com/w320/nc.png', nome: 'Nuova Caledonia' },
    { url: 'https://flagcdn.com/w320/pr.png', nome: 'Porto Rico' },
    { url: 'https://flagcdn.com/w320/gl.png', nome: 'Groenlandia' },
    { url: 'https://flagcdn.com/w320/gi.png', nome: 'Gibilterra' },
    { url: 'https://flagcdn.com/w320/aq.png', nome: 'Antartide' },
  ]

  let frasi = [
    `𝕀ℕ𝔻𝕆𝕍𝕀ℕ𝔸 ℚ𝕌𝔼𝕊𝕋𝔸 𝔹𝔸ℕ𝔻𝕀𝔼ℝ𝔸!\n> 𝐡𝐚𝐢 30 𝐬𝐞𝐜𝐨𝐧𝐝𝐢.`,
  ]

  let scelta = bandiere[Math.floor(Math.random() * bandiere.length)]
  let frase = frasi[Math.floor(Math.random() * frasi.length)]

  try {
    let msg = await conn.sendMessage(m.chat, {
      image: { url: scelta.url },
      caption: frase,
      quoted: m
    })

    global.bandieraGame = global.bandieraGame || {}
    global.bandieraGame[m.chat] = {
      id: msg.key.id,
      risposta: scelta.nome.toLowerCase(),
      rispostaOriginale: scelta.nome,
      tentativi: {},
      suggerito: false,
      startTime: Date.now(),
      timeout: setTimeout(() => {
        if (global.bandieraGame?.[m.chat]) {
          conn.sendMessage(m.chat, {
  text: `⏰ *𝐈𝐥 𝐭𝐞𝐦𝐩𝐨 𝐞̀ 𝐬𝐜𝐚𝐝𝐮𝐭𝐨*\n𝐋𝐚 𝐫𝐢𝐬𝐩𝐨𝐬𝐭𝐚 𝐞𝐫𝐚: *${scelta.nome}*`,
  buttons: [
    { buttonId: '.bandiera', buttonText: { displayText: '𝐍𝐮𝐨𝐯𝐚 𝐩𝐚𝐫𝐭𝐢𝐭𝐚 ⚑' }, type: 1 }
  ],
  quoted: msg
})
          delete global.bandieraGame[m.chat]
        }
      }, 30000)
    }
  } catch (error) {
    console.error('Errore nel gioco bandiere:', error)
    m.reply('𝐄𝐫𝐫𝐨𝐫𝐞!')
  }
}

function normalizeString(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.split(' ').filter(word => word.length > 1)
  const words2 = str2.split(' ').filter(word => word.length > 1)

  if (words1.length === 0 || words2.length === 0) return 0

  const matches = words1.filter(word =>
    words2.some(w2 => w2.includes(word) || word.includes(w2))
  )

  return matches.length / Math.max(words1.length, words2.length)
}

function isAnswerCorrect(userAnswer, correctAnswer) {
  if (userAnswer.length < 2) return false

  const similarityScore = calculateSimilarity(userAnswer, correctAnswer)

  return (
    userAnswer === correctAnswer ||
    (correctAnswer.includes(userAnswer) && userAnswer.length > correctAnswer.length * 0.5) ||
    (userAnswer.includes(correctAnswer) && userAnswer.length < correctAnswer.length * 1.5) ||
    similarityScore >= 0.8
  )
}

handler.before = async (m, { conn }) => {
  const chat = m.chat
  const game = global.bandieraGame?.[chat]

  if (!game || !m.quoted || m.quoted.id !== game.id || m.isAuthenticatedSelf) return

  let chatConfig = global.db.data.chats[chat] || {}
  if (chatConfig.antigiochi) return

  const userAnswer = normalizeString(m.text || '')
  const correctAnswer = normalizeString(game.risposta)

  if (!userAnswer || userAnswer.length < 2) return

  const similarityScore = calculateSimilarity(userAnswer, correctAnswer)

  if (isAnswerCorrect(userAnswer, correctAnswer)) {
    clearTimeout(game.timeout)

    const timeTaken = Math.round((Date.now() - game.startTime) / 1000)
    const rewardMessages = 40

    if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = { messaggi: 0, vittorie: 0 }

    let userData = global.db.data.users[m.sender]
    userData.messaggi = (userData.messaggi || 0) + rewardMessages
    userData.vittorie = (userData.vittorie || 0) + 1
    userData.vittorieBandiera = (userData.vittorieBandiera || 0) + 1

    let congratsMessage = `✅ 𝐄𝐒𝐀𝐓𝐓𝐎 ✅
*𝐋𝐚 𝐫𝐢𝐬𝐩𝐨𝐬𝐭𝐚 𝐞𝐫𝐚: ${game.rispostaOriginale}.*
𝒉𝒂𝒊 𝒗𝒊𝒏𝒕𝒐 40 𝒎𝒆𝒔𝒔𝒂𝒈𝒈𝒊!

ↆ 𝐄𝐜𝐜𝐨 𝐝𝐢 𝐬𝐞𝐠𝐮𝐢𝐭𝐨 𝐢 𝐫𝐢𝐬𝐮𝐥𝐭𝐚𝐭𝐢 𝐝𝐞𝐥 𝐯𝐢𝐧𝐜𝐢𝐭𝐨𝐫𝐞 ↆ
╭───────────────
│ 👤 *𝑮𝒊𝒐𝒄𝒂𝒕𝒐𝒓𝒆* ➪ @${m.sender.split('@')[0]}
│━━━━━━━
│ ⏳ *𝑻𝒆𝒎𝒑𝒐 𝒊𝒎𝒑𝒊𝒆𝒈𝒂𝒕𝒐* ➪ ${timeTaken}s
│━━━━━━━
│ 🟢 *𝑽𝒊𝒕𝒕𝒐𝒓𝒊𝒆 𝒕𝒐𝒕𝒂𝒍𝒊* ➪ ${userData.vittorieBandiera}
╰───────────────
`

    await conn.sendMessage(chat, {
  text: congratsMessage,
  mentions: [m.sender],
  buttons: [
    { buttonId: '.bandiera', buttonText: { displayText: '𝐍𝐮𝐨𝐯𝐚 𝐩𝐚𝐫𝐭𝐢𝐭𝐚 ⚑' }, type: 1 },
    { buttonId: '.tipbandiere', buttonText: { displayText: '𝐓𝐨𝐩 𝐛𝐚𝐧𝐝𝐢𝐞𝐫𝐞 🏅' }, type: 1 },
  ],
  quoted: m
})
    delete global.bandieraGame[chat]

  } else if (similarityScore >= 0.6 && !game.suggerito) {
    game.suggerito = true
    await conn.reply(chat, '𝐂𝐢 𝐬𝐞𝐢 𝐪𝐮𝐚𝐬𝐢 👀', m)

  } else if ((game.tentativi[m.sender] || 0) >= 3) {
    await conn.reply(chat, '❗ 𝐇𝐚𝐢 𝐞𝐬𝐚𝐮𝐫𝐢𝐭𝐨 𝐢 𝐭𝐮𝐨𝐢 4 𝐭𝐞𝐧𝐭𝐚𝐭𝐢𝐯𝐢. 𝐎𝐫𝐚 𝐥𝐚𝐬𝐜𝐢𝐚 𝐠𝐢𝐨𝐜𝐚𝐫𝐞 𝐠𝐥𝐢 𝐚𝐥𝐭𝐫𝐢.', m)

  } else {
    game.tentativi[m.sender] = (game.tentativi[m.sender] || 0) + 1
    const tentativiRimasti = 3 - game.tentativi[m.sender]

    if (tentativiRimasti === 1) {
      const primaLettera = game.rispostaOriginale[0].toUpperCase()
      const numeroLettere = game.rispostaOriginale.length
      await conn.reply(chat, `❌ *𝐒𝐁𝐀𝐆𝐋𝐈𝐀𝐓𝐎* ❌
𝐄𝐜𝐜𝐨 𝐢 2 𝐬𝐮𝐠𝐠𝐞𝐫𝐢𝐦𝐞𝐧𝐭𝐢:
✯ 𝐋𝐚 𝐥𝐞𝐭𝐭𝐞𝐫𝐚 𝐢𝐧𝐢𝐳𝐢𝐚𝐥𝐞 𝐞̀ *"${primaLettera}"*
✯ 𝐋𝐚 𝐩𝐚𝐫𝐨𝐥𝐚 𝐡𝐚 *${numeroLettere}* 𝐥𝐞𝐭𝐭𝐞𝐫𝐞\n> 2 𝑡𝑒𝑛𝑡𝑎𝑡𝑖𝑣𝑖 𝑟𝑖𝑚𝑎𝑠𝑡𝑖`, m)
    } else if (tentativiRimasti === 2) {
      await conn.reply(chat, `❌ *𝐒𝐁𝐀𝐆𝐋𝐈𝐀𝐓𝐎* ❌
𝐑𝐢𝐩𝐫𝐨𝐯𝐚. 𝐇𝐚𝐢 𝐚𝐧𝐜𝐨𝐫𝐚 3 𝐭𝐞𝐧𝐭𝐚𝐭𝐢𝐯𝐢.`, m)
    } else {
      await conn.reply(chat, `❌ *𝐒𝐁𝐀𝐆𝐋𝐈𝐀𝐓𝐎* ❌
𝐔𝐥𝐭𝐢𝐦𝐨 𝐭𝐞𝐧𝐭𝐚𝐭𝐢𝐯𝐨. 𝐀𝐭𝐭𝐞𝐧𝐳𝐢𝐨𝐧𝐞 ‼️`, m)
    }
  }
}

export default definePlugin(handler, {
  name: 'fun-bandiere',
  command: ['bandiera', 'skipbandiera'],
  category: 'fun',
  target: 'group',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Indovina la bandiera e riconosci il paese',
  icon: '🏳️',
  order: 3,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'], botAdmin: true }
}, {
  group: true,
  botAdmin: true,
  register: true,
  before: handler.before
})
