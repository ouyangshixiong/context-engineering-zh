import { existsSync, readFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

export type JiraConfig = {
  domain: string
  email: string
  apiToken: string
  projectKey?: string
  boardId?: number
}

// LlmConfig removed as we use Agent SDK


function pluginRootDir(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  return resolve(here, '..', '..')
}

function stripWrappingQuotes(v: string): string {
  const s = v.trim().replace(/^`|`$/g, '')
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1)
  return s
}

function parseKeyValuePairs(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  const patterns: RegExp[] = [
    /\b([A-Z][A-Z0-9_]+)\b\s*=\s*("[^"]*"|'[^']*'|`[^`]*`|[^\s\n]+)\b/g,
    /^\s*([A-Z][A-Z0-9_]+)\s*[:=]\s*(.+?)\s*$/gm
  ]

  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const k = String(m[1] ?? '').trim()
      const v = stripWrappingQuotes(String(m[2] ?? ''))
      if (k) out[k] = v
    }
  }

  return out
}

function readOptionalTextFile(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined
  return readFileSync(filePath, 'utf8')
}

function resolveJiraMdPath(): string | undefined {
  const root = pluginRootDir()
  const envPath = process.env.JIRA_MD_PATH

  const candidates = [
    envPath,
    resolve(process.cwd(), 'jira.md'),
    resolve(process.cwd(), '.claude', 'jira.md'),
    resolve(process.cwd(), 'plugins', 'agile-marketplace', 'sprint-plugin', 'jira.md'),
    resolve(process.cwd(), 'plugins', 'agile-marketplace', 'sprint-plugin', '.claude', 'jira.md'),
    resolve(root, 'jira.md'),
    resolve(root, '.claude', 'jira.md')
  ].filter((p): p is string => Boolean(p))

  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return undefined
}

function readJiraConfigFromJiraMd(): Partial<JiraConfig> {
  const filePath = resolveJiraMdPath()
  if (!filePath) return {}

  const text = readOptionalTextFile(filePath)
  if (!text) return {}

  const kv = parseKeyValuePairs(text)
  const boardIdRaw = kv.JIRA_BOARD_ID
  const boardId = boardIdRaw ? Number(boardIdRaw) : undefined
  if (boardIdRaw && (!Number.isFinite(boardId) || (boardId as number) <= 0)) {
    throw new Error('Invalid jira.md: JIRA_BOARD_ID must be a positive number')
  }

  const projectKey = kv.JIRA_PROJECT_KEY ?? kv.PROJECT_KEY

  return {
    domain: kv.JIRA_DOMAIN,
    email: kv.EMAIL,
    apiToken: kv.API_TOKEN,
    projectKey,
    boardId
  }
}

function readJiraConfigFromEnvOptional(): Partial<JiraConfig> {
  const domain = process.env.JIRA_DOMAIN
  const email = process.env.EMAIL
  const apiToken = process.env.API_TOKEN
  const projectKey = process.env.JIRA_PROJECT_KEY ?? process.env.PROJECT_KEY
  const boardIdRaw = process.env.JIRA_BOARD_ID

  const boardId = boardIdRaw ? Number(boardIdRaw) : undefined
  if (boardIdRaw && (!Number.isFinite(boardId) || (boardId as number) <= 0)) {
    throw new Error('Invalid env var: JIRA_BOARD_ID must be a positive number')
  }

  return {
    domain,
    email,
    apiToken,
    projectKey,
    boardId
  }
}

export function readJiraConfig(): JiraConfig {
  const md = readJiraConfigFromJiraMd()
  const env = readJiraConfigFromEnvOptional()

  const domain = md.domain ?? env.domain
  const email = md.email ?? env.email
  const apiToken = md.apiToken ?? env.apiToken
  const projectKey = md.projectKey ?? env.projectKey
  const boardId = md.boardId ?? env.boardId

  if (!domain || !email || !apiToken) {
    throw new Error('Missing JIRA config: provide jira.md (preferred) or env vars JIRA_DOMAIN, EMAIL, API_TOKEN')
  }

  return {
    domain,
    email,
    apiToken,
    projectKey,
    boardId
  }
}

export function ensurePluginNpmDependenciesInstalled(): void {
  const root = pluginRootDir()
  const tsxBin = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx')
  const hasAgentSdk = existsSync(join(root, 'node_modules', '@anthropic-ai', 'claude-agent-sdk'))
  const hasZod = existsSync(join(root, 'node_modules', 'zod'))
  if (existsSync(tsxBin) && hasAgentSdk && hasZod) return

  const hasLock = existsSync(join(root, 'package-lock.json'))
  const args = hasLock ? ['ci'] : ['install']
  const res = spawnSync('npm', args, { cwd: root, stdio: 'inherit' })
  if (res.status !== 0) {
    throw new Error(`Failed to install sprint-plugin npm dependencies (exit ${res.status ?? 'unknown'})`)
  }
}

export function readJiraConfigFromEnv(): JiraConfig {
  const domain = process.env.JIRA_DOMAIN
  const email = process.env.EMAIL
  const apiToken = process.env.API_TOKEN
  const projectKey = process.env.JIRA_PROJECT_KEY ?? process.env.PROJECT_KEY
  const boardIdRaw = process.env.JIRA_BOARD_ID

  if (!domain || !email || !apiToken) {
    throw new Error('Missing required env vars: JIRA_DOMAIN, EMAIL, API_TOKEN')
  }

  const boardId = boardIdRaw ? Number(boardIdRaw) : undefined
  if (boardIdRaw && (!Number.isFinite(boardId) || (boardId as number) <= 0)) {
    throw new Error('Invalid env var: JIRA_BOARD_ID must be a positive number')
  }

  return {
    domain,
    email,
    apiToken,
    projectKey,
    boardId
  }
}


export function readTextFile(filePath: string): string {
  return readFileSync(filePath, 'utf8')
}
