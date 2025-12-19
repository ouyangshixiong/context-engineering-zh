#!/usr/bin/env node
import { ensurePluginNpmDependenciesInstalled, readJiraConfig } from '../lib/config'
import { JiraClient } from '../lib/jira'
import { readArgValue, hasFlag } from '../lib/utils'
import { buildExecutionPlan } from '../lib/executionPlan'
import { QuickSprintOptions } from '../lib/quickSprintWorkflow'

async function run(): Promise<void> {
  ensurePluginNpmDependenciesInstalled()
  const argv = process.argv.slice(2)
  const userInput = readArgValue(argv, '--input') ?? ''
  const sprintIdRaw = readArgValue(argv, '--sprint-id')
  const sprintId = sprintIdRaw ? Number(sprintIdRaw) : undefined
  const opts: QuickSprintOptions = {
    userInput,
    sprintId,
    closeWhenDone: hasFlag(argv, '--close'),
    autoCreateSprint: hasFlag(argv, '--auto-create-sprint'),
    sprintName: readArgValue(argv, '--sprint-name'),
    sprintGoal: readArgValue(argv, '--sprint-goal')
  }
  const jiraCfg = readJiraConfig()
  const jira = new JiraClient({
    domain: jiraCfg.domain,
    email: jiraCfg.email,
    apiToken: jiraCfg.apiToken
  })
  const plan = await buildExecutionPlan(jira, opts, { projectKey: jiraCfg.projectKey, boardId: jiraCfg.boardId })
  process.stdout.write(JSON.stringify(plan, null, 2) + '\n')
}

run().catch((err) => {
  process.stderr.write(String(err?.message ?? err) + '\n')
  process.exitCode = 1
})
