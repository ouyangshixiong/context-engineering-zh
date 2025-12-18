import { LlmConfig } from './config'
import { runScrumMasterAgent, runWorkItemAgent, SimpleJiraAction } from './agents'
import { logEvent } from './log'

export type SubAgentName = 'ScrumMaster' | 'DevTeam' | 'Quality'

export type ScrumMasterInput = {
  userInput: string
}

export type WorkItemInput = {
  issueKey: string
  context: Record<string, unknown>
}

export type SubAgentResult =
  | {
      agent: 'ScrumMaster'
      result: { story_keys: string[]; warnings: string[] }
    }
  | {
      agent: 'DevTeam' | 'Quality'
      issueKey: string
      result: { actions: SimpleJiraAction[]; summary?: string }
    }

export type DevTeamResult = {
  agent: 'DevTeam'
  issueKey: string
  result: { actions: SimpleJiraAction[]; summary?: string }
}

export type QualityResult = {
  agent: 'Quality'
  issueKey: string
  result: { actions: SimpleJiraAction[]; summary?: string }
}

export async function runScrumMasterSubAgent(llm: LlmConfig, input: ScrumMasterInput): Promise<SubAgentResult> {
  logEvent('subagent', 'scrum_start', { input_preview: String(input.userInput ?? '').slice(0, 200) })
  const out = await runScrumMasterAgent({ llm, userInput: input.userInput })
  logEvent('subagent', 'scrum_complete', { keys: out.story_keys.length, warnings: out.warnings.length })
  return { agent: 'ScrumMaster', result: { story_keys: out.story_keys, warnings: out.warnings } }
}

export async function runDevTeamSubAgent(llm: LlmConfig, input: WorkItemInput): Promise<DevTeamResult> {
  logEvent('subagent', 'dev_start', { issueKey: input.issueKey })
  const dev = await runWorkItemAgent({ llm, agent: 'development-team-agent', issueKey: input.issueKey, context: input.context })
  const summary =
    dev && dev.json && typeof dev.json === 'object' && dev.json !== null && 'summary' in (dev.json as any)
      ? String((dev.json as any).summary ?? '')
      : undefined
  logEvent('subagent', 'dev_complete', { issueKey: input.issueKey, actions: dev.actions.length })
  return { agent: 'DevTeam', issueKey: input.issueKey, result: { actions: dev.actions, summary } }
}

export async function runQualitySubAgent(llm: LlmConfig, input: WorkItemInput): Promise<QualityResult> {
  logEvent('subagent', 'qa_start', { issueKey: input.issueKey })
  const qa = await runWorkItemAgent({ llm, agent: 'quality-agent', issueKey: input.issueKey, context: input.context })
  const summary =
    qa && qa.json && typeof qa.json === 'object' && qa.json !== null && 'summary' in (qa.json as any)
      ? String((qa.json as any).summary ?? '')
      : undefined
  logEvent('subagent', 'qa_complete', { issueKey: input.issueKey, actions: qa.actions.length })
  return { agent: 'Quality', issueKey: input.issueKey, result: { actions: qa.actions, summary } }
}

export async function runSubAgentsInParallel(tasks: Array<() => Promise<SubAgentResult>>): Promise<SubAgentResult[]> {
  return await Promise.all(tasks.map((t) => t()))
}
