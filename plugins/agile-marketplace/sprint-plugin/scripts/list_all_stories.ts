import { readJiraConfig } from './lib/config'
import { JiraClient } from './lib/jira'

async function listAllStories() {
  try {
    const config = readJiraConfig()
    console.log('🔍 检查JIRA配置:', { domain: config.domain, project: config.projectKey, board: config.boardId })

    const jira = new JiraClient({
      domain: config.domain,
      email: config.email,
      apiToken: config.apiToken
    })

    // 验证连接
    await jira.validateConnection()
    console.log('✅ JIRA连接验证成功')

    // 查询项目中所有状态为"待办"或"待处理"的Story
    const jql = `project = "${config.projectKey}" AND issuetype = Story AND status in ("To Do", "待办", "待处理", "Open", "Open") ORDER BY created DESC`
    console.log(`📡 查询JQL: ${jql}`)

    const stories = await jira.searchIssuesByJql(jql, 100)
    console.log(`📊 找到 ${stories.length} 个待处理的Story`)

    if (stories.length === 0) {
      console.log('💡 没有待处理的Story，尝试查询所有Story...')
      const allJql = `project = "${config.projectKey}" AND issuetype = Story ORDER BY created DESC`
      const allStories = await jira.searchIssuesByJql(allJql, 100)
      console.log(`📊 找到 ${allStories.length} 个Story`)

      allStories.forEach(story => {
        const status = story.fields?.status?.name ?? 'Unknown'
        const summary = story.fields?.summary ?? ''
        const subtaskCount = story.fields?.subtasks?.length ?? 0
        console.log(`  - ${story.key}: ${summary.slice(0, 60)}... (${status}) [${subtaskCount} 子任务]`)

        if (story.fields?.subtasks) {
          story.fields.subtasks.forEach(st => {
            const stStatus = st.fields?.status?.name ?? 'Unknown'
            const stSummary = st.fields?.summary ?? ''
            console.log(`    └─ ${st.key}: ${stSummary.slice(0, 50)}... (${stStatus})`)
          })
        }
      })
      return
    }

    // 显示所有待处理Story详情
    console.log('\n📋 待处理Story详情:')
    stories.forEach(story => {
      const status = story.fields?.status?.name ?? 'Unknown'
      const summary = story.fields?.summary ?? ''
      const subtaskCount = story.fields?.subtasks?.length ?? 0
      console.log(`  - ${story.key}: ${summary.slice(0, 60)}... (${status}) [${subtaskCount} 子任务]`)

      // 显示子任务
      if (story.fields?.subtasks) {
        story.fields.subtasks.forEach(st => {
          const stStatus = st.fields?.status?.name ?? 'Unknown'
          const stSummary = st.fields?.summary ?? ''
          console.log(`    └─ ${st.key}: ${stSummary.slice(0, 50)}... (${stStatus})`)
        })
      }
    })

    // 显示可以使用的Story Keys
    console.log('\n💡 可用的Story Keys:')
    const storyKeys = stories.map(s => s.key).join(', ')
    console.log(`   ${storyKeys}`)

  } catch (error) {
    console.error('❌ 查询失败:', error)
  }
}

listAllStories()