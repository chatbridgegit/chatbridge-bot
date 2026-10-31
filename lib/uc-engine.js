const DAY = 24 * 60 * 60 * 1000

export const UNITY_CONFIG = {
  starterCoins: 1000,
  maxTransaction: 1000000000,
  cooldowns: {
    daily: DAY,
    weekly: 7 * DAY,
    monthly: 30 * DAY,
    bonus: 6 * 60 * 60 * 1000,
    checkin: DAY,
    work: 30 * 60 * 1000,
    game: 15 * 1000
  },
  rewards: {
    daily: 500,
    weekly: 3500,
    monthly: 15000,
    checkin: 250,
    bonusMin: 100,
    bonusMax: 900
  },
  jobs: [
    { id: 'developer', name: 'Developer', salary: 350, xp: 110 },
    { id: 'ai-engineer', name: 'AI Engineer', salary: 520, xp: 140 },
    { id: 'web-designer', name: 'Web Designer', salary: 300, xp: 100 },
    { id: 'sysadmin', name: 'Sysadmin', salary: 380, xp: 115 },
    { id: 'cybersecurity', name: 'Cybersecurity', salary: 560, xp: 150 },
    { id: 'chef', name: 'Chef', salary: 280, xp: 95 },
    { id: 'cameriere', name: 'Cameriere', salary: 180, xp: 75 },
    { id: 'barista', name: 'Barista', salary: 190, xp: 78 },
    { id: 'meccanico', name: 'Meccanico', salary: 330, xp: 105 },
    { id: 'tassista', name: 'Tassista', salary: 240, xp: 90 },
    { id: 'corriere', name: 'Corriere', salary: 220, xp: 84 },
    { id: 'detective', name: 'Detective', salary: 410, xp: 125 },
    { id: 'manager', name: 'Manager', salary: 600, xp: 160 },
    { id: 'trader', name: 'Trader', salary: 700, xp: 175 },
    { id: 'imprenditore', name: 'Imprenditore', salary: 850, xp: 200 }
  ],
  businessTypes: [
    { id: 'cafe', name: 'Cafe', price: 5000, income: 250 },
    { id: 'pizzeria', name: 'Pizzeria', price: 12000, income: 600 },
    { id: 'techshop', name: 'Computer Shop', price: 25000, income: 1200 },
    { id: 'gaming', name: 'Gaming Store', price: 18000, income: 850 },
    { id: 'hotel', name: 'Hotel', price: 75000, income: 3500 },
    { id: 'cinema', name: 'Cinema', price: 45000, income: 2100 }
  ],
  zones: [
    { id: 'downtown', name: 'Downtown', description: 'Il cuore della citta e dei servizi.' },
    { id: 'rich-district', name: 'Rich District', description: 'Lusso, proprieta rare e supercar.' },
    { id: 'entertainment', name: 'Entertainment District', description: 'Giochi, sfide ed eventi.' },
    { id: 'financial', name: 'Financial District', description: 'Banca, business e patrimonio.' },
    { id: 'industrial', name: 'Industrial Zone', description: 'Lavori tecnici e officine.' },
    { id: 'paradise', name: 'Paradise Island', description: 'Eventi speciali e relax.' },
    { id: 'dark-zone', name: 'Dark Zone', description: 'Missioni rare e attivita notturne.' },
    { id: 'marketplace', name: 'Marketplace', description: 'Shop e scambi tra utenti.' }
  ],
  houses: [
    { id: 'studio', name: 'Studio Downtown', price: 8000, income: 80 },
    { id: 'apartment', name: 'Appartamento Rich District', price: 35000, income: 300 },
    { id: 'villa', name: 'Villa Paradise', price: 120000, income: 1100 },
    { id: 'penthouse', name: 'Penthouse Financial', price: 350000, income: 3000 }
  ],
  cars: [
    { id: 'bike', name: 'Bicicletta', category: 'Bicicletta', price: 900 },
    { id: 'scooter', name: 'Scooter', category: 'Scooter', price: 3000 },
    { id: 'moto', name: 'Moto', category: 'Moto', price: 9000 },
    { id: 'citycar', name: 'Auto City', category: 'Auto', price: 18000 },
    { id: 'suv', name: 'SUV Unity', category: 'SUV', price: 50000 },
    { id: 'supercar', name: 'Supercar Nova', category: 'Supercar', price: 250000 },
    { id: 'helicopter', name: 'Elicottero', category: 'Elicotteri', price: 750000 },
    { id: 'jet', name: 'Jet Unity', category: 'Jet', price: 2500000 }
  ],
  items: [
    { id: 'badge-founder', name: 'Badge Founder', price: 2500, type: 'Badge' },
    { id: 'title-tycoon', name: 'Titolo Tycoon', price: 10000, type: 'Titolo' },
    { id: 'frame-neon', name: 'Cornice Neon', price: 4500, type: 'Cornice' },
    { id: 'effect-spark', name: 'Effetto Spark', price: 7000, type: 'Effetto' },
    { id: 'collectible-orb', name: 'Unity Orb', price: 15000, type: 'Collectible' },
    { id: 'vip-7', name: 'VIP 7 giorni', price: 12000, type: 'VIP' }
  ],
  events: [
    { id: 'uc-rain', name: 'UC Rain', description: 'Una pioggia di UC per il primo partecipante.', reward: 1500 },
    { id: 'treasure-hunt', name: 'Treasure Hunt', description: 'Trova il tesoro nascosto del server.', reward: 2500 },
    { id: 'meteor', name: 'Meteor Event', description: 'Una meteora ha portato UC nella citta.', reward: 4000 },
    { id: 'diamond-rush', name: 'Diamond Rush', description: 'Evento raro con ricompensa premium.', reward: 7000 },
    { id: 'golden-hour', name: 'Golden Hour', description: 'Ricompense raddoppiate per il primo check-in.', reward: 1000 },
    { id: 'ghost-night', name: 'Ghost Night', description: 'Una missione speciale nella Dark Zone.', reward: 3000 },
    { id: 'pirate-treasure', name: 'Pirate Treasure', description: 'Caccia al tesoro di Paradise Island.', reward: 5000 }
  ],
  achievements: [
    { id: 'first-daily', name: 'Primo Daily', description: 'Riscatta il primo daily.', reward: 500 },
    { id: 'daily-7', name: 'Sette di fila', description: 'Mantieni una serie di 7 daily.', reward: 1500 },
    { id: 'daily-30', name: 'Mese perfetto', description: 'Mantieni una serie di 30 daily.', reward: 10000 },
    { id: 'first-job', name: 'Primo lavoro', description: 'Scegli la tua prima professione.', reward: 700 },
    { id: 'first-business', name: 'Entrepreneur', description: 'Crea il primo business.', reward: 2500 },
    { id: 'millionaire', name: 'First Million', description: 'Raggiungi 1.000.000 UC di patrimonio.', reward: 25000 },
    { id: 'first-investment', name: 'Investor', description: 'Completa il primo investimento.', reward: 1000 },
    { id: 'first-purchase', name: 'Shopper', description: 'Completa il primo acquisto.', reward: 500 },
    { id: 'first-win', name: 'Game Winner', description: 'Vinci il primo gioco.', reward: 500 },
    { id: 'job-level-5', name: 'Career Mode', description: 'Raggiungi il livello 5 in un lavoro.', reward: 5000 }
  ],
  missions: [
    { id: 'messages-5', name: 'Presenza attiva', description: 'Invia 5 messaggi.', target: 5, stat: 'messages', reward: 500, type: 'daily' },
    { id: 'quiz-3', name: 'Mente brillante', description: 'Vinci 3 quiz.', target: 3, stat: 'quizWins', reward: 1500, type: 'weekly' },
    { id: 'daily-7', name: 'Settimana costante', description: 'Completa 7 daily.', target: 7, stat: 'dailyClaims', reward: 5000, type: 'monthly' },
    { id: 'secret-visitor', name: 'Missione segreta', description: 'Trova il messaggio nascosto di UnityLife.', target: 1, stat: 'secretFound', reward: 2500, type: 'secret' }
  ]
}

function database() {
  if (!global.db?.data) throw new Error('Database UnityLife non disponibile')
  global.db.data.users = global.db.data.users || {}
  global.db.data.unityLife = global.db.data.unityLife || {}
  const state = global.db.data.unityLife
  if (!state.audit) state.audit = []
  if (!state.events) state.events = Object.fromEntries(UNITY_CONFIG.events.map(event => [event.id, false]))
  if (!state.jackpot) state.jackpot = 10000
  if (!state.challenges) state.challenges = []
  return global.db.data
}

function positiveInteger(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback
}

function defaultProfile() {
  return {
    version: 1,
    createdAt: Date.now(),
    coins: UNITY_CONFIG.starterCoins,
    bank: 0,
    xp: 0,
    level: 1,
    job: null,
    jobXp: 0,
    location: 'downtown',
    cooldowns: {},
    streak: 0,
    lastDaily: 0,
    lastCheckin: 0,
    lastIncomeAt: Date.now(),
    transactions: [],
    inventory: {},
    properties: [],
    vehicles: [],
    investments: [],
    businesses: [],
    achievements: [],
    missions: [],
    activeGame: null,
    stats: {
      messages: 0,
      dailyClaims: 0,
      quizWins: 0,
      gameWins: 0,
      purchases: 0,
      investments: 0,
      secretFound: 0
    }
  }
}

export function ensureUnityProfile(userId) {
  const data = database()
  const id = String(userId || '')
  if (!id) throw new Error('Utente UnityLife non valido')
  const user = data.users[id] && typeof data.users[id] === 'object' ? data.users[id] : (data.users[id] = {})
  if (!user.chatunity || typeof user.chatunity !== 'object' || Array.isArray(user.chatunity)) user.chatunity = defaultProfile()
  const profile = user.chatunity
  const defaults = defaultProfile()
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in profile)) profile[key] = Array.isArray(value) ? [] : (value && typeof value === 'object' ? { ...value } : value)
  }
  profile.coins = positiveInteger(profile.coins)
  profile.bank = positiveInteger(profile.bank)
  profile.xp = positiveInteger(profile.xp)
  profile.jobXp = positiveInteger(profile.jobXp)
  profile.level = Math.max(1, positiveInteger(profile.level, 1))
  profile.streak = positiveInteger(profile.streak)
  if (!profile.cooldowns || typeof profile.cooldowns !== 'object') profile.cooldowns = {}
  if (!profile.inventory || typeof profile.inventory !== 'object' || Array.isArray(profile.inventory)) profile.inventory = {}
  if (!Array.isArray(profile.transactions)) profile.transactions = []
  if (!Array.isArray(profile.properties)) profile.properties = []
  if (!Array.isArray(profile.vehicles)) profile.vehicles = []
  if (!Array.isArray(profile.investments)) profile.investments = []
  if (!Array.isArray(profile.businesses)) profile.businesses = []
  if (!Array.isArray(profile.achievements)) profile.achievements = []
  if (!Array.isArray(profile.missions)) profile.missions = []
  if (!profile.stats || typeof profile.stats !== 'object') profile.stats = { ...defaults.stats }
  for (const [key, value] of Object.entries(defaults.stats)) profile.stats[key] = positiveInteger(profile.stats[key], value)
  return profile
}

export const getUnityProfile = ensureUnityProfile

function markDirty() {
  if (typeof global.markDbDirty === 'function') global.markDbDirty()
}

function transactionId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function recordTransaction(userId, amount, type, reason, meta = {}) {
  const profile = ensureUnityProfile(userId)
  const entry = {
    id: transactionId(),
    at: Date.now(),
    amount: Math.floor(amount),
    type,
    reason: String(reason || 'UnityLife'),
    balance: profile.coins,
    bank: profile.bank,
    ...meta
  }
  profile.transactions.unshift(entry)
  profile.transactions = profile.transactions.slice(0, 50)
  const state = database().unityLife
  state.audit.unshift({ ...entry, userId: String(userId) })
  state.audit = state.audit.slice(0, 500)
}

function checkAmount(value) {
  const amount = Number(String(value || '').replace(/[.,]/g, match => match === ',' ? '.' : ''))
  if (!Number.isInteger(amount) || amount <= 0 || amount > UNITY_CONFIG.maxTransaction) throw new Error('Inserisci una quantita UC intera e positiva.')
  return amount
}

export function parseAmount(value, fallback = 0) {
  if (value == null || value === '') return fallback
  try { return checkAmount(value) } catch { return 0 }
}

export function creditCoins(userId, amount, reason = 'Ricompensa', meta = {}) {
  const value = checkAmount(amount)
  const profile = ensureUnityProfile(userId)
  profile.coins = Math.min(Number.MAX_SAFE_INTEGER, profile.coins + value)
  recordTransaction(userId, value, 'credit', reason, meta)
  markDirty()
  return profile.coins
}

export function debitCoins(userId, amount, reason = 'Spesa', meta = {}) {
  const value = checkAmount(amount)
  const profile = ensureUnityProfile(userId)
  if (profile.coins < value) throw new Error(`UC insufficienti. Disponibili: ${formatCoins(profile.coins)} UC.`)
  profile.coins -= value
  recordTransaction(userId, -value, 'debit', reason, meta)
  markDirty()
  return profile.coins
}

export function transferCoins(fromId, toId, amount, reason = 'Trasferimento', meta = {}) {
  const value = checkAmount(amount)
  const sender = String(fromId || '')
  const receiver = String(toId || '')
  if (!sender || !receiver || sender === receiver) throw new Error('Il destinatario non e valido.')
  const from = ensureUnityProfile(sender)
  const to = ensureUnityProfile(receiver)
  if (from.coins < value) throw new Error(`UC insufficienti. Disponibili: ${formatCoins(from.coins)} UC.`)
  from.coins -= value
  to.coins = Math.min(Number.MAX_SAFE_INTEGER, to.coins + value)
  recordTransaction(sender, -value, 'transfer-out', reason, { to: receiver, ...meta })
  recordTransaction(receiver, value, 'transfer-in', reason, { from: sender, ...meta })
  markDirty()
  return { from: from.coins, to: to.coins }
}

export function moveToBank(userId, amount) {
  const value = checkAmount(amount)
  const profile = ensureUnityProfile(userId)
  if (profile.coins < value) throw new Error(`UC insufficienti nel portafoglio. Disponibili: ${formatCoins(profile.coins)} UC.`)
  profile.coins -= value
  profile.bank = Math.min(Number.MAX_SAFE_INTEGER, profile.bank + value)
  recordTransaction(userId, -value, 'deposit', 'Deposito in banca')
  markDirty()
  return profile
}

export function withdrawFromBank(userId, amount) {
  const value = checkAmount(amount)
  const profile = ensureUnityProfile(userId)
  if (profile.bank < value) throw new Error(`UC insufficienti in banca. Disponibili: ${formatCoins(profile.bank)} UC.`)
  profile.bank -= value
  profile.coins = Math.min(Number.MAX_SAFE_INTEGER, profile.coins + value)
  recordTransaction(userId, value, 'withdraw', 'Prelievo dalla banca')
  markDirty()
  return profile
}

export function collectPassiveIncome(userId) {
  const profile = ensureUnityProfile(userId)
  const now = Date.now()
  const last = positiveInteger(profile.lastIncomeAt, now)
  const cycles = Math.min(7, Math.floor(Math.max(0, now - last) / DAY))
  if (!cycles) return 0
  const income = profile.properties.reduce((sum, property) => sum + positiveInteger(property.income), 0) +
    profile.businesses.reduce((sum, business) => sum + positiveInteger(business.income), 0)
  profile.lastIncomeAt = last + cycles * DAY
  if (!income) {
    markDirty()
    return 0
  }
  const amount = income * cycles
  creditCoins(userId, amount, 'Rendita passiva UnityLife')
  return amount
}

export function netWorth(profile) {
  const value = profile || {}
  const propertyValue = (value.properties || []).reduce((sum, property) => sum + positiveInteger(property.value || property.price), 0)
  const vehicleValue = (value.vehicles || []).reduce((sum, vehicle) => sum + positiveInteger(vehicle.value || vehicle.price), 0)
  const investmentValue = (value.investments || []).filter(investment => !investment.claimed).reduce((sum, investment) => sum + positiveInteger(investment.amount), 0)
  const businessValue = (value.businesses || []).reduce((sum, business) => sum + positiveInteger(business.value || business.price), 0)
  return positiveInteger(value.coins) + positiveInteger(value.bank) + propertyValue + vehicleValue + investmentValue + businessValue
}

export function formatCoins(value) {
  return positiveInteger(value).toLocaleString('it-IT')
}

export function formatDuration(milliseconds) {
  const seconds = Math.max(1, Math.ceil(Number(milliseconds || 0) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  return `${Math.ceil(minutes / 60)}h`
}

export function cooldownRemaining(profile, key, duration) {
  const last = positiveInteger(profile.cooldowns?.[key])
  return Math.max(0, duration - (Date.now() - last))
}

export function setCooldown(profile, key) {
  profile.cooldowns[key] = Date.now()
  markDirty()
}

export function levelFromXp(xp) {
  let level = 1
  let remainingXp = positiveInteger(xp)
  while (remainingXp >= level * 500 && level < 100) {
    remainingXp -= level * 500
    level++
  }
  return level
}

export function jobById(id) {
  return UNITY_CONFIG.jobs.find(job => job.id === String(id || '').toLowerCase())
}

export function businessById(id) {
  return UNITY_CONFIG.businessTypes.find(business => business.id === String(id || '').toLowerCase())
}

export function houseById(id) {
  return UNITY_CONFIG.houses.find(house => house.id === String(id || '').toLowerCase())
}

export function carById(id) {
  return UNITY_CONFIG.cars.find(car => car.id === String(id || '').toLowerCase())
}

export function itemById(id) {
  return UNITY_CONFIG.items.find(item => item.id === String(id || '').toLowerCase())
}

export function eventById(id) {
  return UNITY_CONFIG.events.find(event => event.id === String(id || '').toLowerCase())
}

export function getUserLabel(userId) {
  const user = database().users[String(userId)] || {}
  return String(user.name || String(userId).split('@')[0] || 'Utente')
}

export function targetUser(m) {
  const mentioned = Array.isArray(m?.mentionedJid) ? m.mentionedJid[0] : null
  if (mentioned) return mentioned
  const quoted = m?.quoted?.sender || m?.quoted?.participant
  if (quoted) return quoted
  const raw = String(m?.text || '').match(/(?:^|\s)@?(\d{8,15})(?:\s|$)/)
  return raw ? `${raw[1]}@s.whatsapp.net` : null
}

export function addItem(profile, id, quantity = 1) {
  const itemId = String(id || '')
  profile.inventory[itemId] = positiveInteger(profile.inventory[itemId]) + Math.max(1, Math.floor(quantity))
}

export function removeItem(profile, id, quantity = 1) {
  const itemId = String(id || '')
  const current = positiveInteger(profile.inventory[itemId])
  const count = Math.max(1, Math.floor(quantity))
  if (current < count) throw new Error('Oggetto non presente nell’inventario.')
  if (current === count) delete profile.inventory[itemId]
  else profile.inventory[itemId] = current - count
}

export function recordUnityActivity(userId, kind = 'messages') {
  const profile = ensureUnityProfile(userId)
  if (!(kind in profile.stats)) profile.stats[kind] = 0
  profile.stats[kind] = positiveInteger(profile.stats[kind]) + 1
  markDirty()
  return profile
}

export function periodKey(type, now = Date.now()) {
  const date = new Date(now)
  if (type === 'daily') return date.toISOString().slice(0, 10)
  if (type === 'weekly') {
    const start = new Date(date)
    start.setUTCDate(date.getUTCDate() - date.getUTCDay())
    return start.toISOString().slice(0, 10)
  }
  if (type === 'monthly') return date.toISOString().slice(0, 7)
  return 'permanent'
}

export function missionProgress(profile, mission) {
  return Math.min(mission.target, positiveInteger(profile.stats?.[mission.stat]))
}

export function missionClaimKey(mission) {
  return `${mission.id}:${periodKey(mission.type)}`
}

export function isMissionClaimed(profile, mission) {
  return profile.missions.includes(missionClaimKey(mission))
}

export function achievementComplete(profile, achievement) {
  const stats = profile.stats || {}
  if (achievement.id === 'first-daily') return stats.dailyClaims >= 1
  if (achievement.id === 'daily-7') return profile.streak >= 7
  if (achievement.id === 'daily-30') return profile.streak >= 30
  if (achievement.id === 'first-job') return !!profile.job
  if (achievement.id === 'first-business') return profile.businesses.length > 0
  if (achievement.id === 'millionaire') return netWorth(profile) >= 1000000
  if (achievement.id === 'first-investment') return stats.investments >= 1
  if (achievement.id === 'first-purchase') return stats.purchases >= 1
  if (achievement.id === 'first-win') return stats.gameWins >= 1
  if (achievement.id === 'job-level-5') return profile.level >= 5
  return false
}

export async function withEconomyLock(operation) {
  const previous = global.unityLifeLock || Promise.resolve()
  let release
  const gate = new Promise(resolve => { release = resolve })
  global.unityLifeLock = gate
  await previous
  try {
    return await operation()
  } finally {
    release()
    if (global.unityLifeLock === gate) global.unityLifeLock = null
  }
}

export function gameWin(profile) {
  profile.stats.gameWins = positiveInteger(profile.stats.gameWins) + 1
  markDirty()
}

export function purchaseMade(profile) {
  profile.stats.purchases = positiveInteger(profile.stats.purchases) + 1
  markDirty()
}
