import { readJiraConfig } from '../lib/config'
import { JiraClient } from '../lib/jira'

async function startSprint(sprintId: number) {
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

    // Get current sprint details
    const sprint = await jira.getSprint(sprintId)
    console.log(`🎯 准备启动 Sprint: ${sprint.name} (ID: ${sprint.id})`)
    console.log(`   当前状态: ${sprint.state}`)

    if (sprint.state === 'active') {
      console.log('⚠️  Sprint 已经在进行中')
      return
    }

    // Note: JIRA API doesn't have a direct "start sprint" endpoint
    // We need to update the sprint state to 'active'
    // However, the API typically requires startDate to be set
    console.log('\n📋 Sprint 信息:')
    console.log(`   名称: ${sprint.name}`)
    console.log(`   开始时间: ${sprint.startDate || '未设置'}`)
    console.log(`   结束时间: ${sprint.endDate || '未设置'}`)
    console.log(`   目标: ${sprint.goal || '未设置'}`)

    // For starting a sprint, we typically need to ensure dates are set
    // Let's check if we can activate it
    console.log('\n💡 提示: JIRA通常通过以下方式启动Sprint:')
    console.log('   1. 确保Sprint有开始和结束日期')
    console.log('   2. 通过JIRA UI点击"Start Sprint"按钮')
    console.log('   3. 或者通过API更新sprint状态')

    // Try to update the sprint to active (if dates are already set)
    if (sprint.startDate && sprint.endDate) {
      console.log('\n🔄 尝试通过API启动Sprint...')
      try {
        const updatedSprint = await jira.requestJson('PUT', `/rest/agile/1.0/sprint/${sprintId}`, {
          ...sprint,
          state: 'active'
        })
        console.log('✅ Sprint 已成功启动!')
        console.log('   新状态:', updatedSprint)
      } catch (error) {
        console.log('❌ 无法通过API启动Sprint，可能需要手动操作')
        console.log('   错误:', error)
      }
    } else {
      console.log('\n⚠️  Sprint 缺少开始/结束日期，需要手动在JIRA UI中启动')
    }

  } catch (error) {
    console.error('❌ 操作失败:', error)
  }
}

// Check if sprint ID provided
const sprintId = process.argv[2] ? parseInt(process.argv[2]) : 1103

if (!sprintId || isNaN(sprintId)) {
  console.log('使用方法: npx tsx scripts/cli/start_sprint.ts [sprintId]')
  console.log('例如: npx tsx scripts/cli/start_sprint.ts 1103')
  console.log('当前将使用默认Sprint ID: 1103')
}

startSprint(sprintId)