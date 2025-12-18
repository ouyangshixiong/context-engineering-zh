import { JiraClient, JiraIssue, JiraSprint } from './jira'
import { parseStoryKeys } from './utils'
import { logEvent } from './log'
const toIsoUtc = (date: Date): string => date.toISOString()
const addDays = (date: Date, days: number): Date => {
  const d = new Date(date.getTime())
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

export type QuickSprintOptions = {
  userInput: string
  closeWhenDone: boolean
  sprintId?: number
  autoCreateSprint?: boolean
  sprintName?: string
  sprintGoal?: string
}

export type WorkItem = {
  key: string
  type: string
  status: string
  summary: string
  parentStoryKey?: string
}

export type QuickSprintPlan = {
  ok: boolean
  error?: string
  message?: string
  notices?: {
    ignored_direct_issues?: {
      total: number
      by_type: Record<string, number>
      sample_keys: string[]
    }
  }
  input?: {
    raw: string
    story_keys: string[]
  }
  jira?: {
    board_id: number
    sprint: {
      id: number
      name: string
      state?: string
      startDate?: string
      endDate?: string
      goal?: string
    }
  }
  scope?: {
    stories_in_sprint: string[]
    stories_out_of_sprint: string[]
    rule: string
  }
  items?: {
    stories_total_in_sprint: number
    work_items: WorkItem[]
  }
  next_actions?: {
    development: string[]
    quality: string[]
  }
}

const pickDefaultSprintName = (projectKey?: string): string => {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  const prefix = projectKey ? `${projectKey} ` : ''
  return `${prefix}Sprint ${y}${m}${d} - 即时交付`
}

const normalizeIssueType = (issue: JiraIssue): string => issue.fields.issuetype?.name ?? 'Unknown'

const normalizeTypeKey = (type: string): string => String(type ?? '').trim().toLowerCase()

const isSubTaskType = (type: string): boolean => {
  const t = normalizeTypeKey(type)
  return t === 'sub-task' || t === 'subtask' || t.includes('子任务') || t.includes('子工作项')
}

const isStoryType = (type: string): boolean => {
  const t = normalizeTypeKey(type)
  return t === 'story' || t.includes('故事')
}

const buildWorkItems = (stories: JiraIssue[], storyKeySet: Set<string>): WorkItem[] =>
  stories
    .filter((s) => storyKeySet.has(s.key))
    .flatMap((story) =>
      (story.fields.subtasks ?? []).map((st) => ({
        key: st.key,
        type: 'Sub-task',
        status: st.fields?.status?.name ?? 'Unknown',
        summary: st.fields?.summary ?? '',
        parentStoryKey: story.key
      }))
    )

const selectBoardId = (configBoardId: number | undefined, discoveredBoardId: number | undefined): number => {
  const id = configBoardId ?? discoveredBoardId
  if (!id) throw new Error('Missing JIRA_BOARD_ID and could not discover board')
  return id
}

async function ensureActiveSprint(params: {
  jira: JiraClient
  boardId: number
  allowCreate: boolean
  sprintName?: string
  sprintGoal?: string
  projectKey?: string
}): Promise<JiraSprint> {
  const active = await params.jira.getActiveSprints(params.boardId)
  if (active.length > 0) return active[0]
  if (!params.allowCreate) {
    logEvent('plan', 'no_active_sprint', { boardId: params.boardId })
    throw new Error('NO_ACTIVE_SPRINT')
  }
  const name = params.sprintName ?? pickDefaultSprintName(params.projectKey)
  const start = toIsoUtc(new Date())
  const end = toIsoUtc(addDays(new Date(), 14))
  return await params.jira.createSprint({ name, boardId: params.boardId, goal: params.sprintGoal, startDate: start, endDate: end })
}

async function resolveSprint(jira: JiraClient, config: { projectKey?: string; boardId?: number }, opts: QuickSprintOptions): Promise<{ sprint: JiraSprint; boardId: number }> {
  if (opts.sprintId) {
    const sprint = await jira.getSprint(opts.sprintId)
    const boardId = config.boardId ?? -1
    return { sprint, boardId }
  }
  if (config.boardId) {
    const sprint = await ensureActiveSprint({
      jira,
      boardId: config.boardId,
      allowCreate: Boolean(opts.autoCreateSprint),
      sprintName: opts.sprintName,
      sprintGoal: opts.sprintGoal,
      projectKey: config.projectKey
    })
    return { sprint, boardId: config.boardId }
  }
  if (!config.projectKey) throw new Error('Missing PROJECT_KEY/JIRA_PROJECT_KEY or JIRA_BOARD_ID for sprint discovery')
  const boards = await jira.getBoardsByProject(config.projectKey)
  const scrumBoards = boards.filter((b) => b.type === 'scrum')
  const discovered = selectBoardId(undefined, (scrumBoards[0] ?? boards[0])?.id)
  const sprint = await ensureActiveSprint({
    jira,
    boardId: discovered,
    allowCreate: Boolean(opts.autoCreateSprint),
    sprintName: opts.sprintName,
    sprintGoal: opts.sprintGoal,
    projectKey: config.projectKey
  })
  return { sprint, boardId: discovered }
}

export async function planQuickSprint(params: {
  jira: JiraClient
  config: { projectKey?: string; boardId?: number }
  opts: QuickSprintOptions
}): Promise<QuickSprintPlan> {
  try {
    logEvent('plan', 'start', { input_preview: String(params.opts.userInput ?? '').slice(0, 200), sprintId: params.opts.sprintId })
    const parsed = parseStoryKeys(params.opts.userInput)

    if (!params.opts.sprintId && parsed.storyKeys.length === 0) {
      logEvent('plan', 'no_scope', { raw: parsed.raw })
      return {
        ok: false,
        error: 'NO_SPRINT_OR_STORY_KEYS',
        message: 'Provide a sprint id (preferred) or story keys in input.'
      }
    }

    const { sprint, boardId } = await resolveSprint(params.jira, params.config, params.opts)
    logEvent('plan', 'sprint_resolved', { boardId, sprint })

    const sprintIssues = await params.jira.getSprintIssues(sprint.id)
    const stories = sprintIssues.filter((i) => isStoryType(normalizeIssueType(i)))
    const directIssues = sprintIssues.filter(
      (i) => !i.fields?.parent && !isStoryType(normalizeIssueType(i)) && !isSubTaskType(normalizeIssueType(i))
    )
    const directIssuesByType: Record<string, number> = {}
    for (const i of directIssues) {
      const type = normalizeIssueType(i)
      directIssuesByType[type] = (directIssuesByType[type] ?? 0) + 1
    }
    const directIssueSample = directIssues.slice(0, 20).map((i) => i.key)
    if (directIssues.length > 0) {
      logEvent('plan', 'ignored_direct_issues', {
        total: directIssues.length,
        by_type: directIssuesByType,
        sample_keys: directIssueSample
      })
    }
    const storyKeysInSprint = stories.map((s) => s.key)
    const inSet = new Set(storyKeysInSprint)
    const inSprint = params.opts.sprintId ? storyKeysInSprint : parsed.storyKeys.filter((k) => inSet.has(k))
    const notInSprint = params.opts.sprintId ? [] : parsed.storyKeys.filter((k) => !inSet.has(k))
    const workItems = buildWorkItems(stories, new Set(inSprint))

    const plan: QuickSprintPlan = {
      ok: true,
      notices:
        directIssues.length > 0
          ? {
              ignored_direct_issues: {
                total: directIssues.length,
                by_type: directIssuesByType,
                sample_keys: directIssueSample
              }
            }
          : undefined,
      input: {
        raw: parsed.raw,
        story_keys: params.opts.sprintId ? storyKeysInSprint : parsed.storyKeys
      },
      jira: {
        board_id: boardId ?? -1,
        sprint: {
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          goal: sprint.goal
        }
      },
      scope: {
        stories_in_sprint: inSprint,
        stories_out_of_sprint: notInSprint,
        rule: 'Only process stories already in sprint'
      },
      items: {
        stories_total_in_sprint: stories.length,
        work_items: workItems
      },
      next_actions: {
        development: workItems.filter((w) => w.status !== 'Done').map((w) => w.key),
        quality: workItems.filter((w) => w.status === 'Done').map((w) => w.key)
      }
    }

    logEvent('plan', 'computed', {
      stories_total: stories.length,
      work_items_total: workItems.length,
      dev_next: plan.next_actions?.development?.length,
      qa_next: plan.next_actions?.quality?.length,
      ignored_direct_issues: directIssues.length
    })

    if (params.opts.closeWhenDone) {
      const remaining = workItems.filter((w) => w.status !== 'Done')
      if (remaining.length === 0) {
        await params.jira.closeSprint(sprint.id)
        if (plan.jira) plan.jira.sprint.state = 'closed'
        logEvent('plan', 'sprint_closed', { sprintId: sprint.id })
      }
    }

    logEvent('plan', 'complete', { ok: true })
    return plan
  } catch (err) {
    const msg = String((err as any)?.message ?? err)
    logEvent('plan', 'failed', { error: msg })
    if (msg === 'NO_ACTIVE_SPRINT') {
      return {
        ok: false,
        error: 'NO_ACTIVE_SPRINT',
        message: 'No active sprint found. Provide --sprint-id or pass --auto-create-sprint to create one.'
      }
    }
    return { ok: false, error: 'PLAN_FAILED', message: msg }
  }
}
