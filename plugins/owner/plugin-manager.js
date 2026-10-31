import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { pluginUi } from '../../lib/plugin-font.js'
import { definePlugin } from '../../lib/plugin-utils.js'

const PROTECTED_PLUGINS = new Set(['crediti', 'crediti.js', 'main', 'handler'])

function checkSyntax(filePath) {
  return new Promise((resolve) => {
    execFile('node', ['--check', filePath], (error, stdout, stderr) => {
      if (error) {
        resolve({ valid: false, error: (stderr || error.message || '').trim().slice(0, 800) })
      } else {
        resolve({ valid: true })
      }
    })
  })
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getBigrams(str) {
  const bigrams = []
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2))
  }
  return bigrams
}

function calculateSimilarity(a, b) {
  const bigramsA = getBigrams(a)
  const bigramsB = getBigrams(b)
  if (!bigramsA.length || !bigramsB.length) return 0
  const intersection = bigramsA.filter(bigram => bigramsB.includes(bigram))
  return (2 * intersection.length) / (bigramsA.length + bigramsB.length)
}

function findSimilarFiles(searchTerm, baseDir, maxResults = 5) {
  const results = []
  function searchRecursive(dir) {
    try {
      const files = fsSync.readdirSync(dir)
      for (const file of files) {
        const fullPath = path.join(dir, file)
        try {
          const stat = fsSync.statSync(fullPath)
          if (stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('sessioni')) {
              searchRecursive(fullPath)
            }
          } else {
            const fileName = path.basename(file, path.extname(file))
            const similarity = calculateSimilarity(searchTerm.toLowerCase(), fileName.toLowerCase())
            if (similarity > 0.25) {
              results.push({
                path: fullPath,
                name: file,
                similarity: similarity,
                relativePath: path.relative(baseDir, fullPath)
              })
            }
          }
        } catch {}
      }
    } catch {}
  }
  searchRecursive(baseDir)
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, maxResults)
}

function resolvePluginPath(input, root) {
  const cleanInput = String(input || '').trim()
  if (!cleanInput || cleanInput.includes('..')) return null
  const parts = cleanInput.split(/[/\\]/).filter(Boolean)
  if (parts.length === 0) return null
  const fileName = parts.pop()
  const cleanFileName = fileName.endsWith('.js') ? fileName : `${fileName}.js`
  const targetPath = path.resolve(root, ...parts, cleanFileName)
  return targetPath.startsWith(path.resolve(root) + path.sep) ? targetPath : null
}

async function pluginManagerHandler(m, { conn, command, args, dirname, usedPrefix }) {
  const activeConn = conn || this
  const root = dirname || path.join(process.cwd(), 'plugins')
  
  let cmd = command.toLowerCase()
  let currentArgs = [...args]

  if (cmd.startsWith('fileplugin') && cmd !== 'fileplugin') {
    const attached = cmd.slice('fileplugin'.length)
    if (attached) {
      currentArgs.unshift(attached.replace(/^[_\/\s]+/, ''))
      cmd = 'fileplugin'
    }
  }

  if (['listplugins', 'plugins', 'lsp'].includes(cmd)) {
    if (!fsSync.existsSync(root)) {
      return m.reply(pluginUi.box('❌ Errore', [pluginUi.row('ℹ️', 'Stato:', 'cartella plugins non trovata')]))
    }
    const files = []
    function collectFiles(dir) {
      const entries = fsSync.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const res = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          collectFiles(res)
        } else if (entry.name.endsWith('.js')) {
          files.push(res)
        }
      }
    }
    collectFiles(root)
    if (!files.length) {
      return m.reply(pluginUi.box('📂 Plugins', [pluginUi.row('ℹ️', 'Stato:', 'nessun plugin presente')]))
    }
    const rows = files.map((file, idx) => {
      const stats = fsSync.statSync(file)
      const rel = path.relative(root, file)
      return pluginUi.row(`${idx + 1}.`, rel, formatBytes(stats.size))
    })
    return m.reply(pluginUi.box(`🧩 PLUGIN INSTALLATI (${files.length})`, rows))
  }

  if (['getplugin', 'getfile', 'gp', 'gf'].includes(cmd)) {
    const query = currentArgs.join(' ').trim()
    if (!query) {
      return m.reply(pluginUi.box('🔍 Ricerca Plugin', [
        pluginUi.row('❌', 'Errore:', 'inserisci il nome o parte del nome del file'),
        pluginUi.row('ℹ️', 'Uso:', `${usedPrefix + command} <nome>`)
      ]))
    }
    const similar = findSimilarFiles(query, root, 5)
    if (!similar.length) {
      return m.reply(pluginUi.box('❌ Non trovato', [pluginUi.row('🔍', 'Query:', query), pluginUi.row('ℹ️', 'Stato:', 'nessun file simile trovato')]))
    }

    const rows = similar.map((x, i) => pluginUi.row(`${i + 1}.`, `${Math.round(x.similarity * 100)}%`, x.relativePath))
    const buttons = similar.slice(0, 3).map(x => ({
      buttonId: `${usedPrefix}fileplugin ${x.relativePath}`,
      buttonText: { displayText: `📜 ${x.name.slice(0, 18)}` },
      type: 1
    }))

    const textMsg = [
      pluginUi.header('🔍 RISULTATI RICERCA'),
      pluginUi.box('Plugin simili', rows),
      'Tocca un bottone per visualizzare il codice.'
    ].join('\n\n')

    return await activeConn.sendMessage(m.chat, {
      text: textMsg,
      footer: ' ',
      buttons,
      headerType: 1
    }, { quoted: m })
  }

  if (['fileplugin', 'ottienifile'].includes(cmd)) {
    const targetInput = currentArgs.join(' ').trim()
    const targetPath = resolvePluginPath(targetInput, root) || (fsSync.existsSync(path.resolve(root, targetInput)) ? path.resolve(root, targetInput) : null)
    if (!targetPath || !fsSync.existsSync(targetPath)) {
      return m.reply(pluginUi.box('❌ Errore', [pluginUi.row('ℹ️', 'Stato:', 'percorso file non valido o inesistente')]))
    }
    if (fsSync.statSync(targetPath).isDirectory()) {
      return m.reply(pluginUi.box('❌ Errore', [pluginUi.row('ℹ️', 'Stato:', 'impossibile elaborare una cartella')]))
    }
    const fileName = path.basename(targetPath)
    const fileBuffer = await fs.readFile(targetPath)

    if (cmd === 'ottienifile') {
      return await activeConn.sendMessage(m.chat, {
        document: fileBuffer,
        fileName: fileName,
        mimetype: 'application/javascript'
      }, { quoted: m })
    }

    const fileContent = fileBuffer.toString('utf8')
    const syntax = await checkSyntax(targetPath)
    const syntaxMsg = syntax.valid ? '✅ Sintassi corretta' : `❌ Sintassi errata: ${syntax.error.split('\n')[0]}`

    const chunkSize = 3500
    for (let i = 0; i < fileContent.length; i += chunkSize) {
      const chunk = fileContent.slice(i, i + chunkSize)
      const header = i === 0 ? `📜 *${fileName}*\n${syntaxMsg}\n\n` : ''
      await m.reply(`${header}\`\`\`javascript\n${chunk}\n\`\`\``)
      if (i + chunkSize < fileContent.length) {
        await new Promise(r => setTimeout(r, 300))
      }
    }
    return
  }

  if (['saveplugin', 'editplugin', 'editpl'].includes(cmd)) {
    const rawName = currentArgs[0]
    if (!rawName) {
      return m.reply(pluginUi.box('📝 Salva/Modifica Plugin', [
        pluginUi.row('❌', 'Errore:', 'specifica il percorso/nome del plugin'),
        pluginUi.row('ℹ️', 'Uso:', `${usedPrefix + command} <cartella/nome> (rispondendo al codice)`)
      ]))
    }
    const targetPath = resolvePluginPath(rawName, root)
    if (!targetPath) {
      return m.reply(pluginUi.box('🛡️ Sicurezza', [pluginUi.row('❌', 'Errore:', 'percorso non valido')]))
    }
    const baseName = path.basename(targetPath).toLowerCase()
    if (PROTECTED_PLUGINS.has(baseName)) {
      return m.reply(pluginUi.box('🛡️ Protezione', [pluginUi.row('❌', 'Errore:', 'questo plugin è protetto')]))
    }

    let code = ''
    if (m.quoted && m.quoted.text) {
      code = m.quoted.text
    } else if (currentArgs.slice(1).join(' ')) {
      code = currentArgs.slice(1).join(' ')
    }

    if (!code) {
      return m.reply(pluginUi.box('📝 Salva Plugin', [pluginUi.row('❌', 'Errore:', 'rispondi al messaggio con il codice del plugin')]))
    }

    const relativePath = path.relative(root, targetPath)
    await fs.mkdir(path.dirname(targetPath), { recursive: true })
    
    const exists = await fs.access(targetPath).then(() => true).catch(() => false)
    if (exists) {
      const backupPath = path.join(process.cwd(), 'backups', 'plugins', relativePath)
      await fs.mkdir(path.dirname(backupPath), { recursive: true })
      await fs.copyFile(targetPath, `${backupPath}.bak`).catch(() => {})
    }

    await fs.writeFile(targetPath, code, 'utf8')
    const syntax = await checkSyntax(targetPath)

    if (typeof global.reloadHandler === 'function') {
      await global.reloadHandler(false).catch(() => {})
    }

    return m.reply(pluginUi.box('✨ Plugin Salvato', [
      pluginUi.row('✅', 'File:', relativePath),
      pluginUi.row('📋', 'Sintassi:', syntax.valid ? 'corretta' : 'errore rilevato'),
      pluginUi.row('🔄', 'Stato:', exists ? 'aggiornato e ricaricato' : 'creato e ricaricato')
    ]))
  }

  if (['dp', 'delplugin', 'rmplugin', 'deleteplugin'].includes(cmd)) {
    const rawName = currentArgs[0]
    if (!rawName) {
      return m.reply(pluginUi.box('🗑️ Elimina Plugin', [pluginUi.row('❌', 'Errore:', 'specifica il plugin da eliminare')]))
    }
    const targetPath = resolvePluginPath(rawName, root)
    if (!targetPath || !fsSync.existsSync(targetPath)) {
      return m.reply(pluginUi.box('❌ Errore', [pluginUi.row('ℹ️', 'Stato:', 'plugin non trovato')]))
    }
    const baseName = path.basename(targetPath).toLowerCase()
    if (PROTECTED_PLUGINS.has(baseName)) {
      return m.reply(pluginUi.box('🛡️ Protezione', [pluginUi.row('❌', 'Errore:', 'impossibile eliminare un plugin protetto')]))
    }

    await fs.unlink(targetPath)
    if (typeof global.reloadHandler === 'function') {
      await global.reloadHandler(false).catch(() => {})
    }
    return m.reply(pluginUi.box('🗑️ Plugin Eliminato', [pluginUi.row('✅', 'Rimosso:', path.relative(root, targetPath))]))
  }
}

export default definePlugin(pluginManagerHandler, {
  name: 'owner-pluginmanager',
  command: [
    'saveplugin', 'editplugin', 'editpl', 'delplugin', 'dp', 'rmplugin', 'deleteplugin',
    'getplugin', 'getfile', 'gp', 'gf', 'ottienifile', 'fileplugin', 'listplugins', 'plugins', 'lsp'
  ],
  category: 'owner',
  target: 'all',
  owner: true,
  roles: ['owner'],
  description: 'Gestione avanzata, ricerca intelligente, sintassi e hot-reload dei plugin',
  icon: '⚙️',
  order: 15,
  permissions: { roles: ['owner'] }
})