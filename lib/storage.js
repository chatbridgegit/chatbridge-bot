import { mkdir } from 'fs/promises'
import { join, resolve } from 'path'

export const storageRoot = resolve(process.cwd(), 'storage')

function safeCategory(category) {
  return String(category || 'misc').replace(/[^a-z0-9_-]/gi, '_') || 'misc'
}

export async function ensureStorageDirectory(category) {
  const directory = join(storageRoot, safeCategory(category))
  await mkdir(directory, { recursive: true })
  return directory
}

export function storageDirectory(category) {
  return join(storageRoot, safeCategory(category))
}
