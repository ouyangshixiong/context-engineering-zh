import { ensurePluginNpmDependenciesInstalled, readJiraConfig, readLlmConfigFromEnv } from './lib/config'
import { JiraClient } from './lib/jira'
import { planQuickSprint, QuickSprintOptions } from './lib/quickSprintWorkflow'
import { parseStoryKeys, applyJiraActions, runWithConcurrency, readArgValue, hasFlag, inferSprintIdFromInput } from './lib/utils'
import { runScrumMasterAgent } from './lib/agents'
import { runDevTeamSubAgent, runQualitySubAgent } from './lib/subagents'
import { logEvent, logInfo } from './lib/log'
import { spawn } from 'child_process'

function buildOptionsFromArgv(argv: string[]): QuickSprintOptions {
  const userInput = readArgValue(argv, '--input') ?? ''
  const sprintIdRaw = readArgValue(argv, '--sprint-id')
  const sprintId = sprintIdRaw ? Number(sprintIdRaw) : inferSprintIdFromInput(userInput)
  if (sprintIdRaw && (!Number.isFinite(sprintId) || (sprintId as number) <= 0)) {
    throw new Error('Invalid --sprint-id, must be a positive number')
  }
  return {
    userInput,
    closeWhenDone: hasFlag(argv, '--close'),
    sprintId,
    autoCreateSprint: hasFlag(argv, '--auto-create-sprint'),
    sprintName: readArgValue(argv, '--sprint-name'),
    sprintGoal: readArgValue(argv, '--sprint-goal')
  }
}

async function run(): Promise<void> {
  const argv = process.argv.slice(2)
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(
      [
        'Usage:',
        '  npx -y tsx plugins/agile-marketplace/sprint-plugin/scripts/run_agents.ts --input "完成story LR-4 LR-5"',
        '',
        'Options:',
        '  --max-items <n>        Limit processed work items (default: 5)',
        '  --concurrency <n>      Concurrent work items (default: 2)',
        '  --sprint-id <id>        Use a specific sprint id as scope source',
        '  --auto-create-sprint   Create sprint when no active sprint exists'
      ].join('\n') +
        '\n'
    )
    return
  }

  ensurePluginNpmDependenciesInstalled()
  logEvent('orchestrator', 'env_ready', { argv })

  const opts = buildOptionsFromArgv(argv)
  const maxItems = Number(readArgValue(argv, '--max-items') ?? '5')
  const concurrency = Number(readArgValue(argv, '--concurrency') ?? '2')
  logEvent('orchestrator', 'options', { maxItems, concurrency, opts })

  const jiraCfg = readJiraConfig()
  const jira = new JiraClient({ domain: jiraCfg.domain, email: jiraCfg.email, apiToken: jiraCfg.apiToken })
  await jira.validateConnection()
  logEvent('orchestrator', 'jira_ready', { domain: jiraCfg.domain, projectKey: jiraCfg.projectKey, boardId: jiraCfg.boardId })

  const plan = await planQuickSprint({
    jira,
    config: { projectKey: jiraCfg.projectKey, boardId: jiraCfg.boardId },
    opts
  })
  logEvent('orchestrator', 'plan_ready', { ok: plan.ok, items: plan.items?.work_items?.length })

  if (!plan.ok) {
    process.stdout.write(JSON.stringify(plan, null, 2) + '\n')
    logEvent('orchestrator', 'plan_failed', { error: plan.error })
    return
  }

  const llm = readLlmConfigFromEnv()
  logEvent('orchestrator', 'llm_ready', { model: llm.model })

  const sm = await runScrumMasterAgent({ llm, userInput: opts.userInput })
  const parsed = parseStoryKeys(opts.userInput)
  const planStoryKeys = plan.scope?.stories_in_sprint ?? []
  const storyKeys =
    sm.story_keys.length > 0 ? sm.story_keys : parsed.storyKeys.length > 0 ? parsed.storyKeys : planStoryKeys
  logEvent('scrum_master', 'parsed', { input_keys: parsed.storyKeys.length, selected: storyKeys })

  const inSprint = new Set(plan.scope?.stories_in_sprint ?? [])
  const filteredStoryKeys = storyKeys.filter((k) => inSprint.has(k))
  if (filteredStoryKeys.length === 0) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: false,
          error: 'NO_IN_SPRINT_STORIES',
          message: 'No input story keys are in current sprint. Only process stories already in sprint.',
          plan,
          scrum_master: sm
        },
        null,
        2
      ) + '\n'
    )
    logEvent('orchestrator', 'no_in_sprint', { parsed: parsed.storyKeys, in_sprint: Array.from(inSprint) })
    return
  }

  const workItems = (plan.items?.work_items ?? []).slice(0, maxItems)
  const allowedIssueKeys = new Set(workItems.map((w) => w.key))
  const results: any[] = []
  logEvent('orchestrator', 'execute_start', { work_items: workItems.length, concurrency })

  function fireAndForget(cmd: string, args: string[], extraEnv?: Record<string, string | undefined>): void {
    try {
      const env = extraEnv ? { ...process.env, ...extraEnv } : process.env
      const child = spawn(cmd, args, { stdio: 'ignore', detached: true, env })
      child.unref()
    } catch (err) {
      void logEvent('orchestrator', 'hook_spawn_failed', {
        cmd,
        args,
        error: String((err as any)?.message ?? err)
      })
      try {
        process.stderr.write(`[orchestrator] hook_spawn_failed: ${cmd} ${args.join(' ')}\n`)
      } catch {}
    }
  }

  await runWithConcurrency({
    items: workItems,
    concurrency,
    runItem: async (item) => {
      const baseContext = {
        story_keys: filteredStoryKeys,
        sprint: plan.jira?.sprint,
        work_item: item,
        scope: plan.scope
      }

      if (item.status !== 'Done') {
        logEvent('agent', 'dev_start', { issueKey: item.key })
        const dev = await runDevTeamSubAgent(llm, { issueKey: item.key, context: baseContext })
        await applyJiraActions({ jira, allowedIssueKeys, actions: dev.result.actions })
        logEvent('agent', 'dev_actions_applied', { issueKey: item.key, count: dev.result.actions.length })
        fireAndForget('npx', ['-y', 'tsx', 'plugins/agile-marketplace/sprint-plugin/hooks/notify_dev_completion.ts'], {
          SPRINT_HOOK_ISSUE_KEYS: item.key,
          SPRINT_HOOK_PROJECT_KEY: jiraCfg.projectKey
        })
        results.push({ agent: 'development-team-agent', issueKey: item.key, actions: dev.result.actions })
        logInfo('agent', `Dev actions applied for ${item.key}`)
      }

      logEvent('agent', 'qa_start', { issueKey: item.key })
      const qa = await runQualitySubAgent(llm, { issueKey: item.key, context: baseContext })
      await applyJiraActions({ jira, allowedIssueKeys, actions: qa.result.actions })
      logEvent('agent', 'qa_actions_applied', { issueKey: item.key, count: qa.result.actions.length })
      fireAndForget('npx', ['-y', 'tsx', 'plugins/agile-marketplace/sprint-plugin/hooks/notify_quality_completion.ts'], {
        SPRINT_HOOK_ISSUE_KEYS: item.key,
        SPRINT_HOOK_PROJECT_KEY: jiraCfg.projectKey
      })
      results.push({ agent: 'quality-agent', issueKey: item.key, actions: qa.result.actions })
      logInfo('agent', `QA actions applied for ${item.key}`)
    }
  })

  process.stdout.write(JSON.stringify({ ok: true, plan, scrum_master: sm, results }, null, 2) + '\n')
  logEvent('orchestrator', 'execute_complete', { results: results.length })
}

run().catch((err) => {
  process.stderr.write(String(err?.message ?? err) + '\n')
  process.exitCode = 1
})
