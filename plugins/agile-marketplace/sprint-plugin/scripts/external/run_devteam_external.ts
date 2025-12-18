import { readFileSync } from 'fs'
import { resolve } from 'path'
import { runLlm } from '../lib/llm'
import { readArgValue, hasFlag } from '../lib/utils'

function readDevTeamSystemPrompt(): string {
  const p = resolve(process.cwd(), 'plugins/agile-marketplace/sprint-plugin/agents/development-team-agent.md')
  return readFileSync(p, 'utf8')
}

function buildUserMessage(issueKey: string, contextJson: string): string {
  const context = contextJson ? contextJson : '{}'
  const lines = [
    `任务: 处理JIRA任务 ${issueKey} 并输出严格JSON。`,
    '约束: 只能输出JSON对象，不允许附加解释。',
    '输出Schema:',
    '{"actions": Array<{"type":"comment"|"transition","issueKey":string,"text"?:string,"to"?:string}>, "summary": string}',
    '',
    `上下文: ${context}`
  ]
  return lines.join('\n')
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  if (hasFlag(argv, '--help') || hasFlag(argv, '-h')) {
    process.stdout.write(
      [
        'Usage:',
        '  npx -y tsx plugins/agile-marketplace/sprint-plugin/scripts/external/run_devteam_external.ts --issue STORY-123 --context \'{"repo":"svc","env":"prod"}\'',
        '',
        'Env:',
        '  ANTHROPIC_BASE_URL=https://api.xiaomimimo.com/anthropic',
        '  ANTHROPIC_AUTH_TOKEN=***',
        ''
      ].join('\n') + '\n'
    )
    return
  }

  const issueKey = readArgValue(argv, '--issue')
  const context = readArgValue(argv, '--context') ?? '{}'
  if (!issueKey) {
    throw new Error('Missing --issue <JIRA_KEY>')
  }

  const system = readDevTeamSystemPrompt()
  const user = buildUserMessage(issueKey, context)
  const raw = await runLlm(
    { provider: 'anthropic', apiKey: process.env.ANTHROPIC_AUTH_TOKEN ?? process.env.ANTHROPIC_API_KEY ?? '', model: 'mimo-v2-flash' },
    { system, user, temperature: 0.2, maxTokens: 2048 }
  )
  process.stdout.write(String(raw ?? '') + '\n')
}

main().catch((err) => {
  process.stderr.write(String(err?.message ?? err) + '\n')
  process.exitCode = 1
})
