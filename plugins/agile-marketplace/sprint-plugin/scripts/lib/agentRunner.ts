import { z } from 'zod'
import { readFileSync } from 'fs'
import { join } from 'path'
import { JiraClient } from './jira'
import { applyActions, SimpleJiraAction } from './tools/jiraActions'
import { ExecutionPlanForClaude, ClaudeSubAgentTask } from './executionPlan'
import { runWithConcurrency } from './utils'

const AgentOutputSchema = z.object({
  actions: z
    .array(
      z.object({
        type: z.enum(['comment', 'transition']),
        issueKey: z.string(),
        text: z.string().optional(),
        to: z.string().optional()
      })
    )
    .default([]),
  summary: z.string().optional()
})

type AgentOutput = { actions: SimpleJiraAction[]; summary?: string }

function loadAgentMarkdown(agentName: 'scrum-master-agent' | 'development-team-agent' | 'quality-agent'): string {
  const local = join(process.cwd(), 'agents', `${agentName}.md`)
  try {
    return readFileSync(local, 'utf-8')
  } catch {}
  const repoRelative = join(process.cwd(), 'plugins/agile-marketplace/sprint-plugin/agents', `${agentName}.md`)
  return readFileSync(repoRelative, 'utf-8')
}

async function invokeAgent(params: {
  agent: 'scrum-master-agent' | 'development-team-agent' | 'quality-agent'
  input: Record<string, unknown>
  model?: string
}): Promise<AgentOutput> {
  const issueKey = String((params.input as any)?.issueKey ?? '')
  const anthropicEnvModel = process.env.ANTHROPIC_MODEL
  const llmEnvModel = process.env.LLM_MODEL
  const selectedModel = anthropicEnvModel || llmEnvModel || params.model || 'deepseek-chat'
  console.log(
    '[AgentRunner] invokeAgent start',
    JSON.stringify({ agent: params.agent, issueKey, model: selectedModel })
  )
  const md = loadAgentMarkdown(params.agent)
  const prompt = `${md}\n\n[INPUT]\n${JSON.stringify(params.input)}\n\n[INSTRUCTION]\n仅输出JSON对象，不要输出多余文本。包含字段: actions[], summary。` 
  const { unstable_v2_prompt } = (await import('@anthropic-ai/claude-agent-sdk')) as any
  const result = await unstable_v2_prompt(prompt, {
    model: selectedModel,
    outputFormat: {
      type: 'json_schema',
      schema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title: 'AgentOutput',
        type: 'object',
        additionalProperties: false,
        properties: {
          actions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                type: { type: 'string', enum: ['comment', 'transition'] },
                issueKey: { type: 'string' },
                text: { type: 'string' },
                to: { type: 'string' }
              },
              required: ['type', 'issueKey']
            }
          },
          summary: { type: 'string' }
        },
        required: []
      }
    }
  })
  const so = (result as any).structured_output
  if (so) {
    console.log(
      '[AgentRunner] structured_output received',
      JSON.stringify({ agent: params.agent, issueKey })
    )
    const parsed = AgentOutputSchema.safeParse(so)
    if (parsed.success) return parsed.data
  }
  try {
    const raw = (result as any).result
    if (raw) {
      const parsedJson = JSON.parse(String(raw))
      const parsed = AgentOutputSchema.safeParse(parsedJson)
      if (parsed.success) return parsed.data
    }
  } catch {}
  console.log(
    '[AgentRunner] invokeAgent fallbackEmpty',
    JSON.stringify({ agent: params.agent, issueKey })
  )
  return { actions: [], summary: undefined }
}

export async function runExecutionPlan(params: {
  jira: JiraClient
  plan: ExecutionPlanForClaude
  parallel?: boolean
  model?: string
}): Promise<{
  devInvoked: number
  qaInvoked: number
  scrumInvoked: number
  totalActionsApplied: number
}> {
  console.log(
    '[AgentRunner] runExecutionPlan start',
    JSON.stringify({
      sprintId: params.plan.sprint.id,
      sprintName: params.plan.sprint.name,
      tasks: params.plan.tasks.length,
      workItems: params.plan.workItems.length,
      parallel: Boolean(params.parallel)
    })
  )
  let totalActionsApplied = 0
  let devInvoked = 0
  let qaInvoked = 0
  let scrumInvoked = 0

  const scrum = params.plan.tasks.filter((t) => t.agent === 'ScrumMaster')
  for (const t of scrum) {
    scrumInvoked += 1
    await invokeAgent({ agent: 'scrum-master-agent', input: t.input, model: params.model })
  }

  const devTasks = params.plan.tasks.filter((t) => t.agent === 'DevTeam')
  const qaTasks = params.plan.tasks.filter((t) => t.agent === 'Quality')

  if (params.parallel) {
    await runWithConcurrency({
      items: devTasks,
      concurrency: 2,
      runItem: async (t: ClaudeSubAgentTask) => {
        devInvoked += 1
        const out = await invokeAgent({ agent: 'development-team-agent', input: t.input, model: params.model })
        const allowed = t.issueKey ? new Set<string>([t.issueKey]) : undefined
        if (out.actions && out.actions.length > 0) {
          const applied = await applyActions(params.jira, out.actions as SimpleJiraAction[], allowed)
          totalActionsApplied += applied
        }
      }
    })
    await runWithConcurrency({
      items: qaTasks,
      concurrency: 2,
      runItem: async (t: ClaudeSubAgentTask) => {
        qaInvoked += 1
        const out = await invokeAgent({ agent: 'quality-agent', input: t.input, model: params.model })
        const allowed = t.issueKey ? new Set<string>([t.issueKey]) : undefined
        if (out.actions && out.actions.length > 0) {
          const applied = await applyActions(params.jira, out.actions as SimpleJiraAction[], allowed)
          totalActionsApplied += applied
        }
      }
    })
  } else {
    for (const t of devTasks) {
      devInvoked += 1
      const out = await invokeAgent({ agent: 'development-team-agent', input: t.input, model: params.model })
      const allowed = t.issueKey ? new Set<string>([t.issueKey]) : undefined
      if (out.actions && out.actions.length > 0) {
        const applied = await applyActions(params.jira, out.actions as SimpleJiraAction[], allowed)
        totalActionsApplied += applied
      }
    }
    for (const t of qaTasks) {
      qaInvoked += 1
      const out = await invokeAgent({ agent: 'quality-agent', input: t.input, model: params.model })
      const allowed = t.issueKey ? new Set<string>([t.issueKey]) : undefined
      if (out.actions && out.actions.length > 0) {
        const applied = await applyActions(params.jira, out.actions as SimpleJiraAction[], allowed)
        totalActionsApplied += applied
      }
    }
  }

  console.log(
    '[AgentRunner] runExecutionPlan done',
    JSON.stringify({ devInvoked, qaInvoked, scrumInvoked, totalActionsApplied })
  )
  return { devInvoked, qaInvoked, scrumInvoked, totalActionsApplied }
}

export async function verifyMultiAgentExecution(params: {
  summary: { devInvoked: number; qaInvoked: number; scrumInvoked: number; totalActionsApplied: number }
}): Promise<{ ok: boolean; message: string }> {
  const s = params.summary
  if (s.scrumInvoked < 1) return { ok: false, message: 'Scrum Master 未执行' }
  if (s.devInvoked < 1) return { ok: false, message: 'Development Team 未执行' }
  if (s.qaInvoked < 1) return { ok: false, message: 'Quality Agent 未执行' }
  if (s.totalActionsApplied < 1) return { ok: false, message: '未应用任何JIRA动作' }
  return { ok: true, message: '多Agent执行完成' }
}
