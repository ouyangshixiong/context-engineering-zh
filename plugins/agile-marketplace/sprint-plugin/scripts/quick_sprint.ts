import { ensurePluginNpmDependenciesInstalled, readJiraConfig } from './lib/config'
import { JiraClient } from './lib/jira'
import { planQuickSprint, QuickSprintOptions } from './lib/quickSprintWorkflow'
import { readArgValue, inferSprintIdFromInput } from './lib/utils'

// Import debug logger
const DEBUG_MODE = process.env.SPRINT_DEBUG === '1' || process.env.SPRINT_DEBUG === 'true'
import { appendFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

function writeDebugLog(message: string, data?: any): void {
    if (!DEBUG_MODE) return
    const timestamp = new Date().toISOString()
    const here = dirname(fileURLToPath(import.meta.url))
    const logFile = resolve(here, '../../../../sprint_logs', 'quick_sprint_debug.log')
    const logEntry = `[${timestamp}] ${message}\n${data ? JSON.stringify(data, null, 2) : ''}\n---\n`
    try {
        appendFileSync(logFile, logEntry)
        process.stderr.write(`[DEBUG-QUICK] ${message}\n`)
    } catch (e) {
        // Ignore file system errors
    }
}

function buildOptionsFromArgv(argv: string[]): QuickSprintOptions {
  const userInput = readArgValue(argv, '--input') ?? ''
  const sprintIdRaw = readArgValue(argv, '--sprint-id')
  const sprintId = sprintIdRaw ? Number(sprintIdRaw) : inferSprintIdFromInput(userInput)
  if (sprintIdRaw && (!Number.isFinite(sprintId) || (sprintId as number) <= 0)) {
    throw new Error('Invalid --sprint-id, must be a positive number')
  }
  return {
    userInput,
    closeWhenDone: argv.includes('--close'),
    sprintId,
    sprintName: readArgValue(argv, '--sprint-name'),
    sprintGoal: readArgValue(argv, '--sprint-goal')
  }
}

function toJsonOutput(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

async function runQuickSprint(opts: QuickSprintOptions): Promise<void> {
  writeDebugLog('RUNNING_QUICK_SPRINT_START', { opts, pid: process.pid, node: process.version })

  try {
    writeDebugLog('DEPENDENCY_CHECK_START')
    ensurePluginNpmDependenciesInstalled()
    writeDebugLog('DEPENDENCY_CHECK_COMPLETE')

    writeDebugLog('CONFIG_LOAD_START')
    const config = readJiraConfig()
    writeDebugLog('CONFIG_LOADED', {
      domain: config.domain,
      email: config.email,
      projectKey: config.projectKey,
      boardId: config.boardId
    })

    writeDebugLog('JIRA_CLIENT_INIT')
    const jira = new JiraClient({ domain: config.domain, email: config.email, apiToken: config.apiToken })

    writeDebugLog('JIRA_CONNECTION_VALIDATE')
    await jira.validateConnection()
    writeDebugLog('JIRA_CONNECTION_VALIDATED')

    writeDebugLog('PLAN_QUICK_SPRINT_START', { opts })
    const plan = await planQuickSprint({
      jira,
      config: { projectKey: config.projectKey, boardId: config.boardId },
      opts
    })
    writeDebugLog('PLAN_QUICK_SPRINT_COMPLETE', {
      hasPlan: !!plan,
      ok: plan.ok,
      error: plan.error,
      storyCount: plan.items?.stories_total_in_sprint,
      workItems: plan.items?.work_items?.length
    })

    const output = toJsonOutput(plan) + '\n'
    writeDebugLog('WRITING_OUTPUT', {
      outputLength: output.length,
      outputPreview: output.substring(0, 200) + (output.length > 200 ? '...' : '')
    })

    process.stdout.write(output)
    writeDebugLog('OUTPUT_WRITTEN')

  } catch (error: any) {
    writeDebugLog('RUN_QUICK_SPRINT_ERROR', { error: String(error?.message ?? error), stack: String(error?.stack ?? '') })
    throw error
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(
      [
        'Usage:',
        '  npx -y tsx plugins/agile-marketplace/sprint-plugin/scripts/quick_sprint.ts --input "完成story LR-4 LR-5"',
        '',
        'Options:',
        '  --input <text>         User input text containing story keys',
        '  --sprint-id <id>        Use a specific sprint id as scope source',
        '  --close                Close sprint if all work items are Done',
        '  --sprint-name <name>   Override sprint name when creating',
        '  --sprint-goal <goal>   Override sprint goal when creating'
      ].join('\n') +
        '\n'
    )
    return
  }

  const opts = buildOptionsFromArgv(argv)
  await runQuickSprint(opts)
}

main().catch((err) => {
  process.stderr.write(String(err?.message ?? err) + '\n')
  process.exitCode = 1
})
