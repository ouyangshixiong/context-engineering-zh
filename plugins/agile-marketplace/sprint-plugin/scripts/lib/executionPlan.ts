import { JiraClient } from './jira'
import { planQuickSprint, QuickSprintOptions } from './quickSprintWorkflow'

export type ClaudeSubAgentTask = {
  agent: 'ScrumMaster' | 'DevTeam' | 'Quality'
  issueKey?: string
  input: Record<string, unknown>
}

export type ExecutionPlanForClaude = {
  sprint: { id: number; name: string; state: string }
  stories: string[]
  workItems: Array<{ key: string; status: string }>
  tasks: ClaudeSubAgentTask[]
}

export async function buildExecutionPlan(
  jira: JiraClient,
  opts: QuickSprintOptions,
  cfg?: { projectKey?: string; boardId?: number }
): Promise<ExecutionPlanForClaude> {
  const plan = await planQuickSprint({
    jira,
    config: { projectKey: cfg?.projectKey, boardId: cfg?.boardId },
    opts
  })
  if (!plan?.ok) {
    throw new Error(String(plan?.error ?? 'Plan build failed'))
  }
  const sprintInfo = (plan.jira?.sprint ?? {}) as { id?: number | string; name?: string; state?: string }
  const stories: string[] = Array.isArray(plan.scope?.stories_in_sprint) ? plan.scope.stories_in_sprint : []
  const workItemsRaw: any[] = Array.isArray(plan.items?.work_items) ? plan.items.work_items : []
  const workItems = workItemsRaw
    .map((w) => ({
      key: String(w?.key ?? ''),
      status: String(w?.status ?? '')
    }))
    .filter((w) => w.key.length > 0)
  const tasks: ClaudeSubAgentTask[] = []
  tasks.push({
    agent: 'ScrumMaster',
    input: { userInput: String(opts.userInput ?? '') }
  })
  for (const item of workItems) {
    if (item.status === 'Done') continue
    tasks.push({
      agent: 'DevTeam',
      issueKey: item.key,
      input: {
        issueKey: item.key,
        context: {
          story_keys: stories,
          sprint: sprintInfo,
          work_item: item
        }
      }
    })
    tasks.push({
      agent: 'Quality',
      issueKey: item.key,
      input: {
        issueKey: item.key,
        context: {
          story_keys: stories,
          sprint: sprintInfo,
          work_item: item
        }
      }
    })
  }
  return {
    sprint: { id: Number(sprintInfo?.id ?? 0), name: String(sprintInfo?.name ?? ''), state: String(sprintInfo?.state ?? '') },
    stories,
    workItems,
    tasks
  }
}
