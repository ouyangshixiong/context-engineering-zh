import { readTextFile, LlmConfig } from './config'
import { runLlm } from './llm'
import { expectRecord, expectString, expectStringArray, safeJsonParse } from './validate'

export type AgentName = 'scrum-master-agent' | 'development-team-agent' | 'quality-agent'

export type ScrumMasterOutput = {
  story_keys: string[]
  warnings: string[]
}

export type SimpleJiraAction =
  | { type: 'comment'; issueKey: string; text: string }
  | { type: 'transition'; issueKey: string; to: string }

export type AgentRunResult = {
  agent: AgentName
  rawText: string
  json: unknown
  actions: SimpleJiraAction[]
}

export function loadAgentPrompt(agent: AgentName): string {
  return readTextFile(`plugins/agile-marketplace/sprint-plugin/agents/${agent}.md`)
}

export async function runScrumMasterAgent(params: {
  llm: LlmConfig
  userInput: string
}): Promise<ScrumMasterOutput> {
  const system = loadAgentPrompt('scrum-master-agent')
  const user = [
    '任务: 解析用户输入中的Story Keys，并输出严格JSON。',
    '约束: 只能输出JSON对象，不允许附加解释。',
    '输出Schema:',
    '{"story_keys": string[], "warnings": string[]}',
    '',
    `用户输入: ${params.userInput}`
  ].join('\n')

  const rawText = await runLlm(params.llm, { system, user, temperature: 0 })
  const json = safeJsonParse(rawText)
  const obj = expectRecord(json, 'scrum-master-agent output')
  return {
    story_keys: expectStringArray(obj.story_keys, 'story_keys'),
    warnings: Array.isArray(obj.warnings) ? obj.warnings.map((x) => String(x)) : []
  }
}

export async function runWorkItemAgent(params: {
  llm: LlmConfig
  agent: Exclude<AgentName, 'scrum-master-agent'>
  issueKey: string
  context: Record<string, unknown>
}): Promise<AgentRunResult> {
  const system = loadAgentPrompt(params.agent)
  const user = [
    `任务: 处理JIRA任务 ${params.issueKey} 并输出严格JSON。`,
    '约束: 只能输出JSON对象，不允许附加解释。',
    '输出Schema:',
    '{"actions": Array<{"type":"comment"|"transition","issueKey":string,"text"?:string,"to"?:string}>, "summary": string}',
    '',
    `上下文: ${JSON.stringify(params.context)}`
  ].join('\n')

  const rawText = await runLlm(params.llm, { system, user, temperature: 0.2 })
  const json = safeJsonParse(rawText)
  const obj = expectRecord(json, `${params.agent} output`)
  const actionsRaw = Array.isArray(obj.actions) ? obj.actions : []

  const actions: SimpleJiraAction[] = []
  for (const a of actionsRaw) {
    const ao = expectRecord(a, `${params.agent}.actions[]`)
    const type = expectString(ao.type, 'actions[].type')
    const issueKey = expectString(ao.issueKey, 'actions[].issueKey')
    if (type === 'comment') {
      actions.push({ type: 'comment', issueKey, text: expectString(ao.text, 'actions[].text') })
    } else if (type === 'transition') {
      actions.push({ type: 'transition', issueKey, to: expectString(ao.to, 'actions[].to') })
    }
  }

  return {
    agent: params.agent,
    rawText,
    json,
    actions
  }
}
