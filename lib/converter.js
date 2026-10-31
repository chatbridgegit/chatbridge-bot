import { promises } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'
import { ensureStorageDirectory } from './storage.js'

async function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  const directory = await ensureStorageDirectory('converter')
  return new Promise(async (resolve, reject) => {
    try {
      const input = join(directory, `${Date.now()}.${ext}`)
      const output = `${input}.${ext2}`
      await promises.writeFile(input, buffer)

      spawn('ffmpeg', ['-y', '-i', input, ...args, output])
        .on('error', reject)
        .on('close', async code => {
          try {
            await promises.unlink(input)
            if (code !== 0) return reject(code)
            resolve({
              data: await promises.readFile(output),
              filename: output,
              delete: () => promises.unlink(output)
            })
          } catch (error) {
            reject(error)
          }
        })
    } catch (error) {
      reject(error)
    }
  })
}

export function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10'
  ], ext, 'opus')
}
