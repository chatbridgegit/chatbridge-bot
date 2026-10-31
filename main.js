import path, { join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'
import { platform } from 'process'
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, rmSync, watch } from 'fs'
import yargs from 'yargs'
import lodash from 'lodash'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import pino from 'pino'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import storeHelper from './lib/store.js'
import { Low, JSONFile } from 'lowdb'
import readline from 'readline'
import NodeCache from 'node-cache'
import './config.js'
import { trackPresenceUpdate } from './plugins//@beta/top.js'
import { createProjectIdentityResolver } from './lib/whatsapp-identity.js'

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

const authFolder = global.authFile || 'sessioni'
global.authFile = authFolder
global.authFileJB = global.authFileJB || 'chatunity-sub'
const sessionFolder = path.join(process.cwd(), authFolder)
const AUTH_STATE_FILE_PREFIXES = [
  'pre-key-',
  'session-',
  'sender-key-',
  'app-state-sync-key-',
  'app-state-sync-version-',
  'sender-key-memory-'
]

let sessionCleanupRunning = false
let dbWriteInProgress = false
let dbWritePending = false

function isProtectedAuthStateFile(entry) {
  return entry === 'creds.json' || AUTH_STATE_FILE_PREFIXES.some(prefix => entry.startsWith(prefix))
}

function isLikelyAuthStateFile(entry) {
  return isProtectedAuthStateFile(entry) || entry.endsWith('.json')
}

function isConnectionReadyForCleanup() {
  return global.stopped === 'open' && !!global.conn?.user
}

async function runSessionCleanup(task) {
  if (sessionCleanupRunning || !isConnectionReadyForCleanup()) return
  sessionCleanupRunning = true
  try {
    await task()
  } finally {
    sessionCleanupRunning = false
  }
}

function clearSessionFolderSelective(dir = sessionFolder) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    return
  }
  const entries = fs.readdirSync(dir)
  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      try { fs.rmSync(fullPath, { recursive: true, force: true }) } catch {}
    } else {
      if (isLikelyAuthStateFile(entry)) continue
      try { fs.unlinkSync(fullPath) } catch {}
    }
  }
}

function purgeSession(sessionDir, cleanPreKeys = false, maxPreKeyAgeDays = 7) {
  if (!existsSync(sessionDir)) return
  const files = readdirSync(sessionDir)
  files.forEach(file => {
    if (file === 'creds.json') return
    const filePath = path.join(sessionDir, file)
    const stats = statSync(filePath)
    const fileAge = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24)

    if (file.startsWith('pre-key') && cleanPreKeys) {
      if (fileAge > maxPreKeyAgeDays) {
        try { unlinkSync(filePath) } catch {}
      }
      return
    }

    if (stats.isDirectory()) {
      try { rmSync(filePath, { recursive: true, force: true }) } catch {}
      return
    }

    if (!isLikelyAuthStateFile(file)) {
      try { unlinkSync(filePath) } catch {}
    }
  })
}

global.dbDirty = false
global.markDbDirty = function markDbDirty() {
  global.dbDirty = true
}

async function flushDatabase({ force = false } = {}) {
  if (!global.db?.data) return false
  if (!force && !global.dbDirty) return false

  if (dbWriteInProgress) {
    dbWritePending = true
    return false
  }

  dbWriteInProgress = true
  try {
    await global.db.write()
    global.dbDirty = false
    return true
  } catch (error) {
    global.dbDirty = true
    throw error
  } finally {
    dbWriteInProgress = false
    if (dbWritePending) {
      dbWritePending = false
      try { await flushDatabase({ force: true }) } catch (error) {
        console.error(error)
      }
    }
  }
}

setInterval(async () => {
  await runSessionCleanup(async () => {
    clearSessionFolderSelective(sessionFolder)
  })
}, 30 * 60 * 1000)

setInterval(async () => {
  await runSessionCleanup(async () => {
    purgeSession(sessionFolder, false)
  })
}, 20 * 60 * 1000)

setInterval(async () => {
  await runSessionCleanup(async () => {
    purgeSession(sessionFolder, true, 7)
  })
}, 3 * 60 * 60 * 1000)

const {
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
  DisconnectReason,
  makeConnectionManager
} = await import('@chatest/baileys')

const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

protoType()
serialize()

global.isLogoPrinted = false
global.qrGenerated = false
global.connectionMessagesPrinted = {}

let MethodMobile = process.argv.includes('mobile')
let phoneNumber = global.botNumberCode

const hasExistingSession = existsSync(`./${global.authFile}/creds.json`)
let pairingMode = hasExistingSession ? null : null
let pairingCodeRequested = false
let lastConnectionStateLogged = null

function logSystem(message, color = 'cyanBright') {
  const printer = chalk[color] || chalk.cyanBright
  console.log(printer(`〔 ChatBridge 〕 ${message}`))
}

function normalizePhoneNumberInput(value = '') {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return null
  return digits
}

function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
  return result
}

function formatPairingCode(code = '') {
  return code?.match(/.{1,4}/g)?.join('-')?.toUpperCase() || code
}

function getConnectionLabel() {
  const user = global.conn?.user
  if (!user) return 'account sconosciuto'
  const id = String(user.id || '').split(':')[0]
  const name = user.name || user.verifiedName || 'Bot'
  return `${name} (${id || 'jid sconosciuto'})`
}

function logConnectionState(state, color = 'cyanBright') {
  if (!state || lastConnectionStateLogged === state) return
  lastConnectionStateLogged = state
  logSystem(state, color)
}

function redefineConsoleMethod(methodName, filterStrings) {
  const originalConsoleMethod = console[methodName]
  console[methodName] = function () {
    const message = arguments[0]
    if (typeof message === 'string' && filterStrings.some(filterString => message.includes(atob(filterString)))) {
      arguments[0] = ''
    }
    originalConsoleMethod.apply(console, arguments)
  }
}

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

global.API = (name, path = '/', query = {}, apikeyqueryname) =>
  (name in global.APIs ? global.APIs[name] : name) +
  path +
  (query || apikeyqueryname
    ? '?' +
      new URLSearchParams(
        Object.entries({
          ...query,
          ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {})
        })
      )
    : '')

global.timestamp = { start: new Date() }
const __dirnameGlobal = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new JSONFile('database.json') : new JSONFile('database.json'))
global.DATABASE = global.db

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) {
    return new Promise(async (resolve) => {
      while (global.db.READ) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      resolve(global.db.data == null ? await global.loadDatabase() : global.db.data)
    })
  }
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    unityLife: {},
    ...(global.db.data || {})
  }
  global.db.chain = chain(global.db.data)
  global.dbDirty = false
}

await loadDatabase()

const savedPrefix = global.db.data.system?.prefix
if (typeof savedPrefix === 'string' && savedPrefix.trim()) {
  const escapedPrefix = savedPrefix.trim().replace(/[|\\{}()[\]^$+*?.\-]/g, '\\$&')
  global.prefix = new RegExp(`^${escapedPrefix}`)
}

const connectionManager = makeConnectionManager({
  auth: { backend: 'filesystem', options: { folder: global.authFile } },
  reconnect: {
    initialDelayMs: 8000,
    maxDelayMs: 30000,
    maxAttempts: 4,
    budgetMax: 8
  },
  rateLimit: { tokensPerSecond: 6, maxBurst: 12 },
  logger: null
})
global.connectionManager = connectionManager

const { state, saveCreds } = await connectionManager.subsystems.authManager.load()
const msgRetryCounterMap = () => {}
const msgRetryCounterCache = new NodeCache()
const waWebVersion = await fetchLatestWaWebVersion({ timeout: 15000 })
const version = Array.isArray(waWebVersion?.version) && waWebVersion.version.length === 3
  ? waWebVersion.version
  : [2, 3000, 1049440263]

if (waWebVersion?.isLatest) {
  logSystem(`Versione WhatsApp Web rilevata: ${version.join('.')}`, 'greenBright')
} else {
  logSystem(`Versione WhatsApp Web non rilevata, uso fallback: ${version.join('.')}`, 'yellowBright')
}

let rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })

const question = (t) => {
  rl.clearLine(rl.input, 0)
  return new Promise((resolver) => {
    rl.question(t, (r) => {
      rl.clearLine(rl.input, 0)
      resolver(r.trim())
    })
  })
}

async function askConnectionMode() {
  while (true) {
    const answer = await question(chalk.cyanBright(`
╭━━〔 SCELTA CONNESSIONE 〕━━⬣
┃ 1. QR Code
┃ 2. Pairing Code
╰━━━━━━━━━━━━━━━━━━━━⬣
➤ Inserisci 1 o 2: `))
    if (answer === '1') return 'qr'
    if (answer === '2') return 'code'
    logSystem('Scelta non valida. Inserisci 1 per QR o 2 per code.', 'yellowBright')
  }
}

async function askValidatedPhoneNumber() {
  while (true) {
    const input = await question(
      chalk.bgBlack(chalk.bold.bgMagentaBright(`Inserisci il numero di WhatsApp.\n${chalk.bold.yellowBright('Esempio: 393471234567')}\n`))
    )
    const normalized = normalizePhoneNumberInput(input)
    if (normalized) return { input, normalized }
    logSystem('Numero non valido. Inserisci il prefisso internazionale completo senza simboli.', 'yellowBright')
  }
}

async function requestPairingCodeFlow() {
  if (pairingCodeRequested || global.conn?.authState?.creds?.registered) return

  pairingCodeRequested = true
  try {
    let normalizedNumber
    if (phoneNumber) {
      normalizedNumber = normalizePhoneNumberInput(phoneNumber)
      if (!normalizedNumber) throw new Error('Il numero configurato in global.botNumberCode non è valido')
      phoneNumber = normalizedNumber
    } else {
      const input = await askValidatedPhoneNumber()
      normalizedNumber = input.normalized
      phoneNumber = normalizedNumber
    }

    logSystem(`Avvio pairing code per ${phoneNumber}...`, 'blueBright')
    const randomCode = generateRandomCode()
    const pairingCode = await global.conn.requestPairingCode(normalizedNumber, randomCode)
    const formattedCode = formatPairingCode(pairingCode)

    console.log(chalk.bold.white(chalk.bgBlueBright('꒰🩸꒱ ◦•≫ CODICE DI COLLEGAMENTO:')), chalk.bold.white(formattedCode))
    logSystem('Apri WhatsApp > Dispositivi collegati > Collega con numero di telefono / codice.', 'greenBright')
  } catch (error) {
    pairingCodeRequested = false
    logSystem(`Impossibile generare il pairing code: ${error.message}`, 'redBright')
  }
}

if (!hasExistingSession) {
  pairingMode = await askConnectionMode()
} else {
  logSystem(`Sessione trovata in ${global.authFile}. Avvio con credenziali esistenti.`, 'greenBright')
}

const filterStrings = [
  'Q2xvc2luZyBzdGFsZSBvcGVu',
  'Q2xvc2luZyBvcGVuIHNlc3Npb24=',
  'RmFpbGVkIHRvIGRlY3J5cHQ=',
  'U2Vzc2lvbiBlcnJvcg==',
  'RXJyb3I6IEJhZCBNQUM=',
  'RGVjcnlwdGVkIG1lc3NhZ2U='
]

console.info = () => {}
console.debug = () => {}
;['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings))

const groupMetadataCache = new NodeCache({ stdTTL: 300, checkperiod: 60, maxKeys: 500 })
global.groupCache = groupMetadataCache

const logger = pino({
  level: 'silent',
  redact: {
    paths: ['creds.*', 'auth.*', 'account.*', 'media.*.directPath', 'media.*.url', 'node.content[*].enc', 'password', 'token', '*.secret'],
    censor: '***'
  },
  timestamp: () => `,"time":"${new Date().toJSON()}"`
})

global.jidCache = new NodeCache({ stdTTL: 600, useClones: false, maxKeys: 1000 })
global.lidCache = new NodeCache({ stdTTL: 86400, useClones: false, maxKeys: 5000 })
global.identityResolver = global.identityResolver || createProjectIdentityResolver()

const originalLidCacheSet = global.lidCache.set.bind(global.lidCache)
global.lidCache.set = (lid, pn, ttl) => {
  if (!lid || !pn) return false
  const normalizedLid = String(lid)
  const pnString = String(pn)
  const normalizedPn = pnString.includes('@') ? pnString : `${pnString.replace(/\D/g, '')}@s.whatsapp.net`
  global.identityResolver?.record(normalizedLid, normalizedPn, 'baileys-cache')
  return originalLidCacheSet(normalizedLid, normalizedPn, ttl)
}

global.store = {
  bind(conn) {
    return storeHelper.bind(conn)
  },
  loadMessage: storeHelper.loadMessage
}

const connectionOptions = {
  logger,
  printQRInTerminal: pairingMode === 'qr',
  mobile: MethodMobile,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger)
  },
  browser: pairingMode === 'qr' ? Browsers.windows('Chrome') : Browsers.macOS('Safari'),
  version,
  markOnlineOnConnect: false,
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  linkPreviewImageThumbnailWidth: 192,
  getMessage: async (key) => {
    try {
      const jid = global.conn.decodeJid(key.remoteJid)
      const msg = await global.store.loadMessage(jid, key.id) || await global.store.loadMessage(key.id)
      return msg?.message || undefined
    } catch {
      return undefined
    }
  },
  defaultQueryTimeoutMs: 60000,
  connectTimeoutMs: 60000,
  keepAliveIntervalMs: 30000,
  emitOwnEvents: true,
  fireInitQueries: true,
  transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
  lidCache: global.lidCache,
  cachedGroupMetadata: async (jid) => {
    const cached = global.groupCache.get(jid)
    if (cached) return cached
    try {
      const metadata = await global.conn.groupMetadata(global.conn.decodeJid(jid))
      global.groupCache.set(jid, metadata)
      return metadata
    } catch {
      return {}
    }
  },
  decodeJid: (jid) => {
    if (!jid) return jid
    const cached = global.jidCache.get(jid)
    if (cached) return cached
    let decoded = jid
    if (/:\d+@/gi.test(jid)) decoded = jidNormalizedUser(jid)
    if (typeof decoded === 'object' && decoded.user && decoded.server) decoded = `${decoded.user}@${decoded.server}`
    global.jidCache.set(jid, decoded)
    return decoded
  },
  msgRetryCounterCache,
  msgRetryCounterMap,
  retryRequestDelayMs: 250,
  maxMsgRetryCount: 3,
  shouldIgnoreJid: jid => false
}

global.conn = makeWASocket(connectionOptions)
global.store.bind(global.conn)

;['messages.upsert', 'messages.update', 'chats.upsert', 'contacts.upsert'].forEach(evt => {
  global.conn.ev.on(evt, data => connectionManager.subsystems.eventBus.emit(evt, data))
})

global.conn.ev.on('presence.update', ({ id, presences }) => {
  try {
    for (const [userId, info] of Object.entries(presences || {})) {
      const status = info?.lastKnownPresence || info?.presence || 'unavailable'
      trackPresenceUpdate(id, userId, status)
    }
  } catch (e) {
    console.error('presence.update error:', e)
  }
})

global.conn.ev.on('messages.upsert', async ({ messages }) => {
  try {
    for (const msg of messages || []) {
      const jid = msg?.key?.remoteJid
      if (!jid || !jid.endsWith('@g.us')) continue
      const participant = msg?.key?.participant || msg?.participant
      if (!participant) continue
      await global.conn.presenceSubscribe(participant).catch(() => {})
    }
  } catch {}
})

conn.isInit = false
conn.well = false

async function chatbridgeedition() {
  try {
    const mainChannelId = global.IdCanale?.[0] || '120363259442839354@newsletter'
    await global.conn.newsletterFollow(mainChannelId)
  } catch {}
}

if (global.db)
  setInterval(async () => {
    if (global.db.data) await flushDatabase().catch(console.error)
  }, 30 * 1000)

if (global.db)
  setInterval(async () => {
    if (global.db.data) await flushDatabase({ force: true }).catch(console.error)
  }, 5 * 60 * 1000)

if (opts['server']) (await import('./server.js')).default(global.conn, PORT)

function removeSessionFolder(dir = sessionFolder) {
  try {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    connectionManager.subsystems.authManager.clear().catch(() => {})
    logSystem(`Cartella sessione ripulita: ${dir}`, 'yellowBright')
  } catch (e) {
    console.error(chalk.red('Errore eliminazione cartella sessione:'), e)
  }
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin, qr } = update
  global.stopped = connection

  if (isNewLogin) conn.isInit = true

  const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode

  if (reason && reason !== DisconnectReason.loggedOut && connection !== 'close') {
    await global.reloadHandler(true).catch(console.error)
    global.timestamp.connect = new Date()
  }

  if (global.db.data == null) loadDatabase()

  if (connection === 'connecting') {
    logConnectionState('Connessione a WhatsApp in corso...', 'blueBright')
    if (pairingMode === 'code' && !pairingCodeRequested && !global.conn?.authState?.creds?.registered) {
      requestPairingCodeFlow().catch(e => logSystem(`Errore pairing code: ${e.message}`, 'redBright'))
    }
  }

  if (qr && pairingMode === 'qr' && !global.qrGenerated) {
    console.log(
      chalk.bold.yellow(`
╭━━〔 QR GENERATO 〕━━⬣
┃ Scansiona il QR con WhatsApp
┃ Dispositivi collegati > Collega un dispositivo
╰━━━━━━━━━━━━━━━━━━⬣
`)
    )
    global.qrGenerated = true
  }

  if (connection === 'open') {
    connectionManager.subsystems.reconnect.reset()
    connectionManager.subsystems.healthMonitor.start(global.conn)
    lastConnectionStateLogged = 'open'
    global.qrGenerated = false
    global.connectionMessagesPrinted = {}

    if (!global.isLogoPrinted) {
      global.isLogoPrinted = true
      await chatbridgeedition()
    }

    try {
      await global.conn.sendPresenceUpdate('available')
    } catch {}

    logSystem(`Collegato con successo come ${getConnectionLabel()}`, 'greenBright')
    logSystem(`Sessione attiva: ${global.authFile} | Metodo: ${hasExistingSession ? 'sessione esistente' : pairingMode}`, 'greenBright')

    try {
      await conn.groupAcceptInvite('FjPBDj4sUgFLJfZiLwtTvk')
    } catch (error) {
      console.error(chalk.bold.red('❌ Errore gruppo supporto:'), error.message)
      if (error.data === 401) console.error(chalk.bold.yellow('⚠️ Errore di autorizzazione: controlla le credenziali o la sessione'))
    }
  }

  if (connection === 'close') {
    lastConnectionStateLogged = 'close'
    if (!global.conn?.authState?.creds?.registered) pairingCodeRequested = false

    connectionManager.subsystems.healthMonitor.stop()

    logSystem(`Connessione chiusa. Reason: ${reason || 'unknown'}`, 'redBright')

    const evaluation = connectionManager.subsystems.reconnect.evaluate(lastDisconnect?.error ?? null)

    if (!evaluation.shouldReconnect) {
      logSystem(`Disconnessione permanente: ${evaluation.reason}`, 'redBright')
      if (reason === DisconnectReason.badSession && !global.connectionMessagesPrinted.badSession) {
        console.log(chalk.bold.redBright(`\n⚠️ SESSIONE NON VALIDA — ELIMINO ${global.authFile} E CHIUDO`))
        global.connectionMessagesPrinted.badSession = true
      } else if (reason === DisconnectReason.loggedOut && !global.connectionMessagesPrinted.loggedOut) {
        console.log(chalk.bold.redBright(`\n⚠️ DISCONNESSO — ELIMINO ${global.authFile} E CHIUDO`))
        global.connectionMessagesPrinted.loggedOut = true
      } else if (reason === DisconnectReason.connectionReplaced && !global.connectionMessagesPrinted.connectionReplaced) {
        console.log(chalk.bold.yellowBright(`\n⚠️ CONNESSIONE SOSTITUITA — ELIMINO ${global.authFile} E CHIUDO`))
        global.connectionMessagesPrinted.connectionReplaced = true
      }
      removeSessionFolder(sessionFolder)
      process.exit(1)
      return
    }

    logSystem(`Riconnessione (${evaluation.reason}) — attendo ${Math.round(evaluation.delayMs / 1000)}s...`, 'yellowBright')
    if (evaluation.delayMs > 0) await connectionManager.subsystems.reconnect.wait(evaluation.delayMs).catch(() => {})

    try {
      await global.reloadHandler(true)
      connectionManager.subsystems.reconnect.recordSuccess()
      global.timestamp.connect = new Date()
    } catch (e) {
      connectionManager.subsystems.reconnect.recordFailure()
      console.error(chalk.red('Errore durante il riavvio della connessione:'), e)
    }
  }
}

process.on('uncaughtException', console.error)

;(async () => {
  try {
    conn.ev.on('connection.update', connectionUpdate)
    conn.ev.on('creds.update', saveCreds)
  } catch (error) {
    console.error(chalk.bold.bgRedBright(`🥀 Errore nell'avvio del bot: `, error))
  }
})()

let isInit = true
let handler = await import('./handler.js').catch(e => {
  console.error('❌ ERRORE IMPORT HANDLER:', e)
  process.exit(1)
})

let reloadHandlerRunning = false

async function reloadHandlerUnsafe(restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(e => {
      console.error('❌ ERRORE IMPORT HANDLER.JS:', e)
      return null
    })

    if (!Handler) {
      console.error('❌ Handler è null, import fallito')
      return false
    }

    if (!Handler.handler) {
      console.error('❌ Handler.handler è undefined! Keys disponibili:', Object.keys(Handler))
      return false
    }

    if (Object.keys(Handler).length) handler = Handler
  } catch (e) {
    console.error('❌ ERRORE in reloadHandler:', e)
    return false
  }

  if (restatConn) {
    const previousConn = global.conn
    const oldChats = previousConn.chats
    try {
      previousConn.ws.close()
    } catch {}
    previousConn.ev.removeAllListeners()
    global.conn = makeWASocket(connectionOptions, { chats: oldChats })
    global.store.bind(global.conn)

    ;['messages.upsert', 'messages.update', 'chats.upsert', 'contacts.upsert'].forEach(evt => {
      global.conn.ev.on(evt, data => connectionManager.subsystems.eventBus.emit(evt, data))
    })

    global.conn.ev.on('presence.update', ({ id, presences }) => {
      try {
        for (const [userId, info] of Object.entries(presences || {})) {
          const status = info?.lastKnownPresence || info?.presence || 'unavailable'
          trackPresenceUpdate(id, userId, status)
        }
      } catch (e) {
        console.error('presence.update error:', e)
      }
    })

    global.conn.ev.on('messages.upsert', async ({ messages }) => {
      try {
        for (const msg of messages || []) {
          const jid = msg?.key?.remoteJid
          if (!jid || !jid.endsWith('@g.us')) continue
          const participant = msg?.key?.participant || msg?.participant
          if (!participant) continue
          await global.conn.presenceSubscribe(participant).catch(() => {})
        }
      } catch {}
    })

  }

  const activeConn = global.conn
  if (!isInit && !restatConn) {
    const listeners = [
      ['messages.upsert', activeConn.handler],
      ['group-participants.update', activeConn.participantsUpdate],
      ['groups.update', activeConn.groupsUpdate],
      ['call', activeConn.onCall],
      ['connection.update', activeConn.connectionUpdate],
      ['creds.update', activeConn.credsUpdate]
    ]
    for (const [event, listener] of listeners) {
      if (typeof listener === 'function') activeConn.ev.off(event, listener)
    }
  }

  activeConn.welcome = '*@user Benvenuto/a in @subject*'
  activeConn.bye = '*@user Ha abbandonato il gruppo*'
  activeConn.spromote = '*@user è stato promosso ad amministratore*'
  activeConn.sdemote = '*@user Non è più amministratore*'
  activeConn.sIcon = '*immagine gruppo modificata*'
  activeConn.sRevoke = '*link reimpostato, nuovo link: @revoke*'

  activeConn.handler = handler.handler.bind(activeConn)
  activeConn.participantsUpdate = handler.participantsUpdate.bind(activeConn)
  activeConn.groupsUpdate = handler.groupsUpdate.bind(activeConn)
  activeConn.onCall = handler.callUpdate.bind(activeConn)
  activeConn.connectionUpdate = connectionUpdate.bind(activeConn)
  activeConn.credsUpdate = saveCreds.bind(activeConn, true)

  activeConn.ev.on('messages.upsert', activeConn.handler)
  activeConn.ev.on('group-participants.update', activeConn.participantsUpdate)
  activeConn.ev.on('groups.update', activeConn.groupsUpdate)
  activeConn.ev.on('call', activeConn.onCall)
  activeConn.ev.on('connection.update', activeConn.connectionUpdate)
  activeConn.ev.on('creds.update', activeConn.credsUpdate)

  isInit = false
  return true
}

global.reloadHandler = async function reloadHandler(restatConn) {
  if (reloadHandlerRunning) return false
  reloadHandlerRunning = true
  try {
    return await reloadHandlerUnsafe(restatConn)
  } finally {
    reloadHandlerRunning = false
  }
}

const pluginFolder = join(__dirnameGlobal, 'plugins')
const pluginFilter = filename => /\.js$/i.test(filename)
global.plugins = {}

function normalizePluginKey(filePath) {
  return path.relative(pluginFolder, filePath).replace(/\\/g, '/')
}

function getPluginFiles(dir = pluginFolder) {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getPluginFiles(fullPath))
      continue
    }

    if (entry.isFile() && pluginFilter(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

async function filesInit() {
  for (const filePath of getPluginFiles()) {
    const pluginKey = normalizePluginKey(filePath)
    try {
      const file = global.__filename(filePath)
      const module = await import(file)
      global.plugins[pluginKey] = module.default || module
    } catch (e) {
      conn.logger.error(e)
      delete global.plugins[pluginKey]
    }
  }
}

await filesInit()

global.reload = async (_ev, filename) => {
  if (!filename || !pluginFilter(filename)) return

  const filePath = join(pluginFolder, filename)
  const pluginKey = normalizePluginKey(filePath)
  const fileExists = existsSync(filePath)

  if (pluginKey in global.plugins) {
    if (fileExists) conn.logger.info(chalk.green(`✅ AGGIORNATO - '${pluginKey}'`))
    else {
      conn.logger.warn(`🗑️ FILE ELIMINATO: '${pluginKey}'`)
      delete global.plugins[pluginKey]
      global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
      return
    }
  } else if (fileExists) {
    conn.logger.info(`🆕 NUOVO PLUGIN: '${pluginKey}'`)
  }

  if (!fileExists) return

  const err = syntaxerror(fs.readFileSync(filePath), pluginKey, { sourceType: 'module', allowAwaitOutsideFunction: true })
  if (err) conn.logger.error(`❌ ERRORE SINTASSI: '${pluginKey}'\n${format(err)}`)
  else {
    try {
      const module = await import(`${global.__filename(filePath)}?update=${Date.now()}`)
      global.plugins[pluginKey] = module.default || module
    } catch (e) {
      conn.logger.error(`⚠️ ERRORE PLUGIN: '${pluginKey}\n${format(e)}'`)
    } finally {
      global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
    }
  }
}

Object.freeze(global.reload)
const pluginWatcher = watch(pluginFolder, { recursive: true }, global.reload)
pluginWatcher.setMaxListeners(20)
await global.reloadHandler()

const mainFilePath = fileURLToPath(import.meta.url)
const mainWatcher = watch(mainFilePath, async () => {
  await global.reloadHandler(true).catch(console.error)
})
mainWatcher.setMaxListeners(20)
