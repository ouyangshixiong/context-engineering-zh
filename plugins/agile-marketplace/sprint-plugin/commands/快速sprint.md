---
description: 按既有脚本执行的敏捷工作流；解析用户输入，读取JIRA数据，生成任务列表并并行执行，无需创建临时脚本
---

# 快速Sprint Command
> Claude Code 插件：严格按工作流执行，生成任务列表并编排多智能体协作

## 执行守则
- 必须按工作流逐步执行，不允许直接返回“完成”
- 仅处理 `scope.stories_in_sprint`，不自动添加新 Story
- 子智能体输出仅限 `{ actions: [], summary }`
- 完成判定：`verifyMultiAgentExecution.ok === true && totalActionsApplied > 0`

## LLM执行指令块
```
ROLE: Sprint Orchestrator
TOOLS: get_execution_plan, apply_jira_actions
INPUT: <用户原始输入文本，包含Story Keys与可选Sprint名称>
STEPS:
1) 调用 get_execution_plan(userInput, sprintName) 生成执行计划
2) 按计划分派 ScrumMaster / DevTeam / Quality 子智能体
3) 对子智能体输出的 actions[] 调用 apply_jira_actions(allowedIssueKeys)
4) 校验 verifyMultiAgentExecution == ok 且 totalActionsApplied > 0
5) 同步状态、必要时关闭Sprint，生成交付报告或未完成清单
TERMINATION: 满足完成判定才终止
```

## 运行方式
- Claude：`/sprint-plugin:快速sprint "<输入>"`
- CLI：`npx -y tsx plugins/agile-marketplace/sprint-plugin/scripts/run_sprint_session.ts --input "<输入>" --sprint-name "<名称>"`

## 工作流（简版）
- 分析输入：解析 `Story Keys` 与可选 `Sprint 名称`
- 读取配置：从 `jira.md` 与环境变量加载 JIRA 配置
- 检查 Sprint：获取活跃 Sprint；必要时按名称创建
- 获取数据：拉取 Sprint 内的 `Story` 与其 `Sub-task`（work_items）
- 构建计划：生成 `ScrumMaster/DevTeam/Quality` 任务并限定 `allowedIssueKeys`
- 执行与应用：并行运行 Dev/QA；对 `actions[]` 调用 `apply_jira_actions`
- 校验完成：`verifyMultiAgentExecution` 通过且 `totalActionsApplied > 0`
- 同步与关闭：标记 Story 为 Done；必要时关闭 Sprint
- 交付报告：输出执行统计与完成项列表

## 工作流与脚本映射（禁止临时脚本）
- 分析输入：`scripts/lib/utils.ts:31`（`parseStoryKeys`）→ `scripts/lib/quickSprintWorkflow.ts:173`（`planQuickSprint`）
- 读取配置：`scripts/lib/config.ts:117`（`readJiraConfig`）→ 入口：`run_sprint_session.ts`、`rapid_sprint_orchestrator.ts`、`check_current_sprint.ts`
- 检查/解析Sprint：`scripts/lib/quickSprintWorkflow.ts:133-163`（`resolveSprint`）→ `scripts/lib/jira.ts:94-100`（`getSprints`）、`scripts/lib/jira.ts:102-116`（`createSprint`）
- 获取数据：`scripts/lib/jira.ts:130-146`（`getSprintIssues`）
- 构建计划：`scripts/lib/executionPlan.ts:17-77`（`buildExecutionPlan`）；导出：`scripts/export_sprint_plan.ts`
- 执行与应用：`scripts/lib/agentRunner.ts:138-165`（`runExecutionPlan` 并发=2）、`scripts/lib/agentRunner.ts:34-101`（`invokeAgent`）、`scripts/lib/tools/jiraActions.ts:11-14`（`applyActions`）
- 校验完成：`scripts/lib/agentRunner.ts:193-202`（`verifyMultiAgentExecution`）
- 同步/关闭：`scripts/rapid_sprint_orchestrator.ts:99-132`（状态同步与关闭）、`scripts/lib/jira.ts:122-128`（`closeSprint`）
- 报告与列表：`scripts/rapid_sprint_orchestrator.ts:142-156`（交付报告概览）、`scripts/list_all_stories.ts`（Story 列表与可用 Keys）

## 辅助检查
- 当前 Sprint 检查：`npx -y tsx plugins/agile-marketplace/sprint-plugin/scripts/check_current_sprint.ts`
- Story 列表：`npx -y tsx plugins/agile-marketplace/sprint-plugin/scripts/list_all_stories.ts`

## 约束与配置
- 目录约束：开发与测试必须在目标项目目录下；不存在则提示并创建
- 配置变量：`JIRA_DOMAIN`、`EMAIL`、`API_TOKEN`、`PROJECT_KEY/JIRA_PROJECT_KEY`、`JIRA_BOARD_ID`；模型优先 `LLM_MODEL`
