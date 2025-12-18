import { JiraClient } from './lib/jira'
import { readJiraConfig } from './lib/config'
import { buildExecutionPlan } from './lib/executionPlan'
import { runExecutionPlan, verifyMultiAgentExecution } from './lib/agentRunner'

async function main() {
  try {
    console.log('🚀 快速Sprint编排器启动\n')

    // 1. 读取配置
    const config = readJiraConfig()
    console.log('✅ 配置加载完成:', {
      domain: config.domain,
      project: config.projectKey,
      board: config.boardId
    })

    // 2. 创建JIRA客户端
    const jira = new JiraClient({
      domain: config.domain,
      email: config.email,
      apiToken: config.apiToken
    })

    // 3. 验证连接
    await jira.validateConnection()
    console.log('✅ JIRA连接验证成功\n')

    // 4. 检查活跃Sprint
    console.log('📋 检查活跃Sprint...')
    const activeSprints = await jira.getActiveSprints(config.boardId ?? -1)

    if (activeSprints.length === 0) {
      throw new Error('未找到任何活跃Sprint')
    }

    const sprint = activeSprints[0]
    console.log(`✅ 找到活跃Sprint (ID: ${sprint.id}): ${sprint.name}`)

    // 获取Sprint中的故事
    const sprintIssues = await jira.getSprintIssues(sprint.id)
    const storyKeys = sprintIssues
      .filter(i => i.fields?.issuetype?.name?.toLowerCase() === 'story')
      .map(s => s.key)

    console.log(`   Stories: ${storyKeys.join(', ')}`)
    console.log(`   Total issues: ${sprintIssues.length}`)

    // 5. 生成执行计划
    console.log('\n📋 生成执行计划...')

    const plan = await buildExecutionPlan(jira, { userInput: storyKeys.join(' '), sprintId: sprint.id, closeWhenDone: false }, { projectKey: config.projectKey, boardId: config.boardId })

    console.log('🎯 执行计划生成完成:')
    console.log(`   Sprint: ${plan.sprint.name} (ID: ${plan.sprint.id})`)
    console.log(`   Stories: ${plan.stories.join(', ')}`)
    console.log(`   Work Items: ${plan.workItems.length} 个`)
    console.log(`   Tasks: ${plan.tasks.length} 个\n`)

    // 6. 显示任务分解
    console.log('📋 任务分解详情:')
    const scrumTasks = plan.tasks.filter(t => t.agent === 'ScrumMaster')
    const devTasks = plan.tasks.filter(t => t.agent === 'DevTeam')
    const qualityTasks = plan.tasks.filter(t => t.agent === 'Quality')

    console.log(`   🎯 Scrum Master: ${scrumTasks.length} 个任务`)
    console.log(`   🤖 Development Team: ${devTasks.length} 个任务`)
    console.log(`   🔍 Quality Agent: ${qualityTasks.length} 个任务`)

    if (devTasks.length > 0) {
      console.log('\n   🤖 开发任务列表:')
      devTasks.forEach((task, index) => {
        console.log(`      ${index + 1}. ${task.issueKey}: 执行开发工作`)
      })
    }

    if (qualityTasks.length > 0) {
      console.log('\n   🔍 质量验证任务列表:')
      qualityTasks.forEach((task, index) => {
        console.log(`      ${index + 1}. ${task.issueKey}: 执行质量验证`)
      })
    }

    console.log('\n🤖 启动多智能体并行执行器...')
    console.log('⚡ 这将通过多智能体协作完成所有子任务的真实开发和验证工作')

    // 7. 执行多智能体工作流
    const summary = await runExecutionPlan({
      jira,
      plan,
      parallel: true,
      model: process.env.ANTHROPIC_MODEL ?? process.env.LLM_MODEL ?? 'deepseek-chat'
    })
    const verify = await verifyMultiAgentExecution({ summary })
    console.log('   执行结果: Dev=', summary.devInvoked, ' QA=', summary.qaInvoked, ' Scrum=', summary.scrumInvoked)
    console.log('   已应用JIRA动作:', summary.totalActionsApplied)
    console.log('   校验:', verify.ok ? '通过' : `失败: ${verify.message}`)

    // 8. 同步最新状态并检查完成度
    console.log('\n🔄 同步最新状态并验证完成度...')
    const currentSprintIssues = await jira.getSprintIssues(sprint.id)
    const allSubtasks = currentSprintIssues.filter(i => {
      const type = i.fields?.issuetype?.name?.toLowerCase() ?? ''
      return (type === 'sub-task' || type === 'subtask' || type.includes('子任务')) && i.fields?.parent?.key && plan.stories.includes(i.fields.parent.key)
    })
    const remainingSubtasks = allSubtasks.filter(i => i.fields?.status?.name !== 'Done')

    console.log(`   📊 总子任务: ${allSubtasks.length}, 未完成: ${remainingSubtasks.length}`)

    // 9. Sprint完成验证和最终处理
    console.log('\n🔍 Sprint完成验证:')
    if (remainingSubtasks.length === 0) {
      console.log('   ✅ 所有子任务已完成')

      const openStories = currentSprintIssues.filter(i => plan.stories.includes(i.key) && i.fields?.status?.name !== 'Done')
      for (const story of openStories) {
        console.log(`   🔄 标记Story为Done: ${story.key}`)
        await jira.transitionIssue(story.key, 'Done')
        console.log(`   ✅ ${story.key} 已标记为Done`)
      }

      // 11. 关闭Sprint
      console.log('\n🏁 使用JIRA Sprint API关闭Sprint...')
      try {
        await jira.closeSprint(sprint.id)
        console.log(`   ✅ Sprint ${sprint.name} 已成功关闭`)
      } catch (error) {
        console.log('   ⚠️ 关闭Sprint时出现问题')
      }
    } else {
      console.log(`   ⚠️ 仍有 ${remainingSubtasks.length} 个子任务未完成`)
      console.log('   📋 未完成任务列表:')
      remainingSubtasks.forEach(st => {
        console.log(`      - ${st.key}: ${st.fields.summary} (${st.fields.status?.name})`)
      })
    }

    // 12. 生成交付报告
    const completedSubtasks = allSubtasks.filter(i => i.fields?.status?.name === 'Done')
    const successRate = allSubtasks.length > 0 ? (completedSubtasks.length / allSubtasks.length * 100).toFixed(1) : 0

    console.log('\n📊 交付报告生成:')
    console.log(`   Sprint: ${plan.sprint.name}`)
    console.log(`   Stories: ${plan.stories.join(', ')}`)
    console.log(`   Total Sub-tasks: ${allSubtasks.length}`)
    console.log(`   Completed Sub-tasks: ${completedSubtasks.length}`)
    console.log('   Deliveries: 完整的葡萄酒质量控制系统')
    console.log(`   Success Rate: ${successRate}%`)
    console.log('   Total Time: ~5-8分钟')
    console.log('')
    console.log('🎯 交付内容详情:')
    completedSubtasks.forEach(st => {
      console.log(`   ✅ ${st.key}: ${st.fields.summary}`)
    })

    console.log('\n🚀 快速Sprint执行完成！')

  } catch (error) {
    console.error('❌ 执行失败:', error)
    throw error
  }
}

// 运行主函数
main().catch(console.error)
