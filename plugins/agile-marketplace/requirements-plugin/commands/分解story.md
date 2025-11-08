---
description: 基于Agile理论将JIRA Story分解为可执行Sub-tasks，符合Scrum最佳实践
---

# 分解Story Command

## 🎯 Agile理论依据

根据Agile Manifesto与Scrum Guide最新版，结合业界最佳实践：
- **Story定义**：面向用户价值的最小可交付单元，应在单个Sprint内完成
- **分解目标**：将抽象业务需求拆解为清晰、可执行的技术与测试Sub-tasks
- **结果导向**：输出应支撑价值可验证、实施可落地、追溯可闭环

## 🏗️ 核心原则

### 统一父级结构
- **父级统一为Story**：所有任务都挂在对应Story下
- **便于统计**：便于统计Story完成度和Sprint Burn-down

### Sub-task类型与语义
- **统一使用Subtask类型**：所有开发Sub-tasks都使用Subtask类型
- **标签区分语义**：
  - `label = "development"` → 开发Sub-task
  - `label = "testing"` → 测试Sub-task
  - `label = "documentation"` → 文档Sub-task

### 可追溯性
- **链接关系**：每个任务通过"Relates"链接关联到对应Story
- **逻辑链**：在JQL或插件中形成完整逻辑链：Story → Tasks

## 🧩 分解工作流程

### 1. Story理解与价值分析
- 明确Story的业务目标和用户价值
- 识别用户角色与预期收益

### 2. 验收标准定义
- 使用可测试、可验证的语言定义3-5条验收标准
- 每条应满足：明确输入输出、可被测试演示、体现用户价值
- 格式参考"Given-When-Then"模式

### 3. 实现路径分析
- 分析技术方案、数据流、交互流程
- 识别风险点与前置依赖
- 考虑设计或数据接口要素

### 4. Sub-task拆解
- 从功能、接口、测试、文档等角度拆解
- 每个Sub-task应可在1-3天内完成
- 保持Sub-task粒度一致，避免重复或遗漏

### 5. Sub-task编号规范

Sub-task将按照以下规范自动生成编号：
- **格式**: `TASK-[StoryKey]-[序号]`
- **示例**: 如果Story是`CMT-5`，第一个Sub-task将是`TASK-CMT-5-1`
- **显示**: 编号会显示在Sub-task的Summary中，格式为`[TASK-CMT-5-1] Sub-task描述`

这个编号规范有助于：
- 清晰标识父子关系
- 便于搜索和过滤
- 保持Sub-task管理的规范性

## 🛠️ 技术实现流程

1. 读取jira.md中的JIRA_DOMAIN、user-email和auth-token，如果没有这个配置文件，提示用户输入JIRA_DOMAIN、user-email和auth-token并创建jira.md配置文件
2. 根据example先获取所属story内部ID
3. 将任务格式化，关联story，模仿`scripts/create_subtask.py`创建jira的Subtask

## 📋 输出结构要求

### 1. Story核心价值
- 用一句简明的话重述Story，明确其业务目标和价值

### 2. 验收标准（Acceptance Criteria）
- 3-5条可测试、可验证的验收标准
- 每条体现用户价值，格式可参考"Given-When-Then"

### 3. 分解逻辑与关键分析点
- Story涉及的核心业务流程
- 可能的技术模块或系统交互
- 风险点与前置依赖
- 设计或数据接口需要考虑的要素

### 4. 分解输出：Sub-task清单

| Sub-task编号 | Sub-task名称 | 类型 | 内容说明 | 预计工作量 |
|-------------|-------------|------|----------|-----------|
| T1 | Sub-task名称 | 类型 | 详细说明 | 2d |

**要求**：
- 每个Sub-task应可在1-3天内完成
- 所有Sub-tasks之和能完整实现该Story
- 保持Sub-task粒度一致，避免重复或遗漏

### 5. 完成定义（Definition of Done）
- 功能实现
- 测试通过
- 文档与验收完成
- 无阻塞问题或遗留缺陷
- 部署到目标环境可演示

# example

## 获取所有jira项目的project_id
'''
curl -u {user-email}:{auth-token} \
  -X GET \
  -H "Accept: application/json" \
  "https://ouyangshixiong.atlassian.net/rest/api/3/project/search"
'''

## 列出项目支持的issue type
'''
curl -u {user-email}:{auth-token} \
  -X GET \
  -H "Content-Type: application/json" \
  "https://ouyangshixiong.atlassian.net/rest/api/3/issuetype/project?projectId={PROJECTID}"
'''

## 获取story的内部ID
curl -u "{user-email}:{auth-token}" \
  -X GET \
  -H "Accept: application/json" \
  "https://ouyangshixiong.atlassian.net/rest/api/3/issue/CMT-5" | jq -r '.id'

# rule
使用Atlassian Document格式