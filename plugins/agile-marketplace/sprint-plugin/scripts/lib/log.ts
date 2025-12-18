import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { promises as fsp } from 'fs'

const LOG_DIR = join(__dirname, '../../../../sprint_logs')
const LOG_FILE = join(LOG_DIR, 'sprint_workflow.log')
const ENABLE = process.env.SPRINT_LOG !== '0'

function ensureDir(): void {
  if (!existsSync(LOG_DIR)) {
    try {
      mkdirSync(LOG_DIR, { recursive: true })
    } catch {}
  }
}

export async function logEvent(scope: string, event: string, meta?: any): Promise<void> {
  if (!ENABLE) return
  ensureDir()
  const ts = new Date().toISOString()
  const payload = { ts, scope, event, meta }
  const line = JSON.stringify(payload) + '\n'
  try {
    await fsp.appendFile(LOG_FILE, line)
  } catch {}
}

export function logInfo(scope: string, message: string): void {
  if (!ENABLE) return
  try {
    process.stdout.write(`[${scope}] ${message}\n`)
  } catch {}
}
