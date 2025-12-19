import { z } from 'zod'
import { readFileSync } from 'fs'
import { join } from 'path'
import { unstable_v2_createSession, tool } from '@anthropic-ai/claude-agent-sdk'
import { fsTools } from './tools/fsTools'
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
  const prompt = `${md}\n\n[INPUT]\n${JSON.stringify(params.input)}\n\n[INSTRUCTION]\nUse the provided tools to execute the task. \nIMPORTANT: You must use the 'submit_result' tool to submit your final output. Do not just output JSON text.` 

  let result: AgentOutput = { actions: [], summary: undefined }
  let submitted = false

  const submitTool = tool(
    'submit_result',
    'Submit the final result of the agent execution.',
    {
      actions: z.array(
        z.object({
          type: z.enum(['comment', 'transition']),
          issueKey: z.string(),
          text: z.string().optional(),
          to: z.string().optional()
        })
      ).default([]),
      summary: z.string().optional()
    },
    async (data: any) => {
         console.log('[AgentRunner] submit_result tool called', JSON.stringify({ agent: params.agent, issueKey }))
         result = data as AgentOutput
         submitted = true
         return 'Result submitted successfully.'
     }
  )

  await using session = await unstable_v2_createSession({
    model: selectedModel,
    tools: [...fsTools, submitTool]
  })

  // Log session creation
  console.log('[AgentRunner] session created', JSON.stringify({ agent: params.agent, issueKey }))

  try {
    await session.send({
        type: 'user',
        message: {
            role: 'user',
            content: prompt
        }
    })
    
    // Log message sent
    console.log('[AgentRunner] prompt sent to agent', JSON.stringify({ agent: params.agent, issueKey }))
    
    if (submitted) {
        console.log(
          '[AgentRunner] structured_output received via tool',
          JSON.stringify({ agent: params.agent, issueKey })
        )
        return result
    }
    
    console.log(
      '[AgentRunner] invokeAgent warning: submit_result tool not called.',
      JSON.stringify({ agent: params.agent, issueKey })
    )
    return { actions: [], summary: 'Agent did not submit result via tool.' }
  } catch (e: any) {
    console.error('[AgentRunner] invokeAgent error', e)
    return { actions: [], summary: `Error: ${e.message}` }
  }
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
