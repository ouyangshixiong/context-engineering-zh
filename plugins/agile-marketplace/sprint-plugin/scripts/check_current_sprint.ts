import { readJiraConfig } from './lib/config'
import { JiraClient } from './lib/jira'

async function checkCurrentSprint() {
  try {
    const config = readJiraConfig()
    console.log('🔍 检查JIRA配置:', { domain: config.domain, project: config.projectKey, board: config.boardId })

    const jira = new JiraClient({
      domain: config.domain,
      email: config.email,
      apiToken: config.apiToken
    })

    await jira.validateConnection()
    console.log('✅ JIRA连接验证成功')

    if (typeof config.boardId !== 'number') {
      console.log('❌ JIRA 配置中缺少有效的 boardId')
      return
    }

    const activeSprints = await jira.getActiveSprints(config.boardId)
    console.log('🎯 活跃Sprint列表:', JSON.stringify(activeSprints, null, 2))

    if (activeSprints.length === 0) {
      console.log('❌ 当前没有活跃Sprint')
      return
    }

    // 获取第一个活跃Sprint的详细信息
    const sprint = activeSprints[0]
    console.log(`📋 获取Sprint ${sprint.id} (${sprint.name}) 的Issue...`)

    const sprintIssues = await jira.getSprintIssues(sprint.id)
    console.log(`📊 Sprint中有 ${sprintIssues.length} 个Issue`)

    // 分析Issue类型
    const stories = sprintIssues.filter(i =>
      i.fields?.issuetype?.name?.toLowerCase() === 'story' ||
      i.fields?.issuetype?.name?.includes('故事')
    )

    const tasks = sprintIssues.filter(i =>
      i.fields?.issuetype?.name?.toLowerCase() === 'task' &&
      !i.fields?.parent
    )

    const subtasks = sprintIssues.filter(i => {
      const type = i.fields?.issuetype?.name?.toLowerCase() ?? ''
      return type === 'sub-task' || type === 'subtask' || type.includes('子任务')
    })

    console.log(`📝 Story: ${stories.length} 个`)
    console.log(`✅ Task: ${tasks.length} 个`)
    console.log(`🔧 Sub-task: ${subtasks.length} 个`)

    // 显示所有Story及其状态
    console.log('\n📋 Story详情:')
    stories.forEach(story => {
      const status = story.fields?.status?.name ?? 'Unknown'
      const summary = story.fields?.summary ?? ''
      const subtaskCount = story.fields?.subtasks?.length ?? 0
      console.log(`  - ${story.key}: ${summary.slice(0, 50)}... (${status}) [${subtaskCount} 子任务]`)

      // 显示子任务
      if (story.fields?.subtasks) {
        story.fields.subtasks.forEach(st => {
          console.log(`    └─ ${st.key}: ${st.fields?.summary ?? ''} (${st.fields?.status?.name ?? 'Unknown'})`)
        })
      }
    })

    // 显示未关联的Task
    if (tasks.length > 0) {
      console.log('\n📋 独立Task详情:')
      tasks.forEach(task => {
        const status = task.fields?.status?.name ?? 'Unknown'
        const summary = task.fields?.summary ?? ''
        console.log(`  - ${task.key}: ${summary.slice(0, 50)}... (${status})`)
      })
    }

    console.log(`\n💡 总结: Sprint ${sprint.name} (ID: ${sprint.id}) 状态: ${sprint.state}`)
    console.log(`   开始: ${sprint.startDate}, 结束: ${sprint.endDate}`)
    if (sprint.goal) console.log(`   目标: ${sprint.goal}`)

  } catch (error) {
    console.error('❌ 检查失败:', error)
  }
}

checkCurrentSprint()
