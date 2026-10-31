import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin, formatRuntime } from '../../lib/plugin-utils.js'
import { cpus as _cpus, totalmem, freemem } from 'os'
import { performance } from 'perf_hooks'
import { sizeFormatter } from 'human-readable'
import fs from 'fs'
import path from 'path'

const format = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`
})

async function ping(m) {
  const startedAt = performance.now()
  const nomeDelBot = global.db?.data?.nomedelbot || '𝙲𝚑𝚊𝚝𝚄𝚗𝚒𝚝𝚢-𝙱𝚘𝚝'

  // Calcoli rapidi senza inviare messaggi intermedi di attesa
  const latency = Math.max(0, Math.round(performance.now() - startedAt))
  const uptimeMs = process.uptime() * 1000

  // Calcolo CPU
  const cpus = _cpus().map(cpu => {
    cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0)
    return cpu
  })

  const cpu = cpus.reduce((last, cpu, _, { length }) => {
    last.total += cpu.total
    last.speed += cpu.speed / length
    last.times.user += cpu.times.user
    last.times.nice += cpu.times.nice
    last.times.sys += cpu.times.sys
    last.times.idle += cpu.times.idle
    last.times.irq += cpu.times.irq
    return last
  }, {
    speed: 0,
    total: 0,
    times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 }
  })

  const cpuModel = cpus[0]?.model || 'Modello sconosciuto'
  const cpuSpeed = cpu.speed.toFixed(2)
  const ramUsage = `${format(totalmem() - freemem())} / ${format(totalmem())}`

  const text = pluginUi.box('Ping & Info', [
    pluginUi.row('🩻', 'Nome:', nomeDelBot),
    pluginUi.row('⚡', 'Ping:', `${latency} ms`),
    pluginUi.row('⏱️', 'Uptime:', typeof formatRuntime === 'function' ? formatRuntime(uptimeMs) : clockString(uptimeMs)),
    pluginUi.row('💻', 'CPU:', cpuModel),
    pluginUi.row('🚀', 'Speed:', `${cpuSpeed} MHz`),
    pluginUi.row('💾', 'RAM:', ramUsage),
    pluginUi.row('✅', 'Stato:', 'online')
  ])

  const videoPath = path.join(process.cwd(), 'media', 'gif', 'pong.mp4')
  let mediaBuffer = null
  try {
    if (fs.existsSync(videoPath)) {
      mediaBuffer = fs.readFileSync(videoPath)
    }
  } catch {}

  if (mediaBuffer && typeof this.sendMessage === 'function') {
    try {
      return await this.sendMessage(m.chat, {
        video: mediaBuffer,
        gifPlayback: true,
        mimetype: 'video/mp4',
        caption: text
      }, { quoted: m })
    } catch {}
  }

  return m.reply(text)
}

function clockString(ms) {
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms / 3600000) % 24
  const m = Math.floor(ms / 60000) % 60
  const s = Math.floor(ms / 1000) % 60
  return [d, h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

export default definePlugin(ping, {
  name: 'info-ping',
  command: ['ping', 'speed', 'velocità'],
  customPrefix: /^\./,
  category: 'info',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra uptime, statistiche di sistema e latenza reale del bot',
  icon: '⚡',
  order: 1,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
