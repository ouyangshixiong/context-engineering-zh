import { JiraClient } from './jira'

export function readArgValue(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

export function hasFlag(args: string[], name: string): boolean {
  return args.includes(name)
}

export function inferSprintIdFromInput(userInput: string): number | undefined {
  const raw = String(userInput ?? '').trim()
  const m = raw.match(/\b(\d{1,9})\b/)
  if (!m) return undefined
  const n = Number(m[1])
  if (!Number.isFinite(n) || n <= 0) return undefined
  if (/^\d+$/.test(raw)) return n
  if (/(^|\s)(sprint|冲刺|迭代)(\s|$)/i.test(raw)) return n
  return undefined
}

export type ParsedUserInput = {
  raw: string
  storyKeys: string[]
}

const STORY_KEY_REGEX = /\b([A-Z][A-Z0-9]+-\d+)\b/g

export function parseStoryKeys(input: string): ParsedUserInput {
  const raw = input ?? ''
  const keys = new Set<string>()
  for (const match of raw.matchAll(STORY_KEY_REGEX)) {
    keys.add(match[1])
  }
  return { raw, storyKeys: Array.from(keys) }
}

export async function applyJiraActions(params: {
  jira: JiraClient
  allowedIssueKeys: Set<string>
  actions: any[]
}): Promise<void> {
  for (const a of params.actions) {
    if (!a || typeof a !== 'object') continue
    const issueKey = String((a as any).issueKey ?? '')
    if (!params.allowedIssueKeys.has(issueKey)) continue
    const type = String((a as any).type ?? '')
    if (type === 'comment') {
      const text = String((a as any).text ?? '')
      await params.jira.addComment(issueKey, text)
    } else if (type === 'transition') {
      const to = String((a as any).to ?? '')
      await params.jira.transitionIssue(issueKey, to)
    }
  }
}

export async function runWithConcurrency<T>(params: {
  items: T[]
  concurrency: number
  runItem: (item: T) => Promise<void>
}): Promise<void> {
  const concurrency = Math.max(1, Math.floor(params.concurrency))
  let nextIndex = 0
  async function worker(): Promise<void> {
    while (true) {
      const idx = nextIndex
      nextIndex += 1
      if (idx >= params.items.length) return
      await params.runItem(params.items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, params.items.length) }, () => worker()))
}

