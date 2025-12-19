import { JiraClient } from '../lib/jira'
import { readJiraConfig } from '../lib/config'
import { buildExecutionPlan } from '../lib/executionPlan'
import { runExecutionPlan, verifyMultiAgentExecution } from '../lib/agentRunner'

async function main() {
  try {
    const config = readJiraConfig()
    const jira = new JiraClient({
      domain: config.domain,
      email: config.email,
      apiToken: config.apiToken
    })

    await jira.validateConnection()

    const activeSprints = await jira.getActiveSprints(config.boardId ?? -1)
    if (activeSprints.length === 0) {
      throw new Error('未找到任何活跃Sprint')
    }
    const sprint = activeSprints[0]

    const sprintIssues = await jira.getSprintIssues(sprint.id)
    const storyKeys = sprintIssues
      .filter(i => i.fields?.issuetype?.name?.toLowerCase() === 'story')
      .map(s => s.key)

    const plan = await buildExecutionPlan(jira, { userInput: storyKeys.join(' '), sprintId: sprint.id, closeWhenDone: false }, { projectKey: config.projectKey, boardId: config.boardId })

    const summary = await runExecutionPlan({
      jira,
      plan,
      parallel: true,
      model: process.env.ANTHROPIC_MODEL ?? process.env.LLM_MODEL ?? 'deepseek-chat'
    })
    const verify = await verifyMultiAgentExecution({ summary })

    const currentSprintIssues = await jira.getSprintIssues(sprint.id)
    const allSubtasks = currentSprintIssues.filter(i => {
      const type = i.fields?.issuetype?.name?.toLowerCase() ?? ''
      return (type === 'sub-task' || type === 'subtask' || type.includes('子任务')) && i.fields?.parent?.key && plan.stories.includes(i.fields.parent.key)
    })
    const remainingSubtasks = allSubtasks.filter(i => i.fields?.status?.name !== 'Done')

    if (remainingSubtasks.length === 0) {
      const openStories = currentSprintIssues.filter(i => plan.stories.includes(i.key) && i.fields?.status?.name !== 'Done')
      for (const story of openStories) {
        await jira.transitionIssue(story.key, 'Done')
      }
      try {
        await jira.closeSprint(sprint.id)
      } catch {}
    }
  } catch (error) {
    console.error('❌ 执行失败:', error)
    throw error
  }
}

main().catch(console.error)
