---
description: 从JIRA中发现项目、Epic、Story和子需求（Subtask）的完整层级结构，为"用户故事分解"命令提供目标Story选择
---

# Epic-Stories-Subtasks 发现 Command

通过该命令，PM可以浏览JIRA中的完整项目结构，发现需要分解的Story，为后续的"用户故事分解"命令提供明确的目标。

## 工作流程

1. **JIRA认证配置检查**
   - 检查用户目录中的jira.md配置文件是否存在
   - 如果不存在，提示用户创建配置文件并退出
   - 如果存在，读取JIRA_DOMAIN、user-email、auth-token配置

2. **项目发现与选择**
   - 获取JIRA中的所有项目列表
   - 显示项目ID、名称、关键字等信息
   - 用户选择目标项目

3. **Epic发现与选择**
   - 获取选定项目的所有Epic
   - 显示Epic标题、状态、关联Story数量
   - 用户选择目标Epic

4. **Story发现与选择**
   - 获取Epic下的所有Story
   - 显示Story标题、状态、优先级、现有Subtask数量
   - 提供筛选功能（按状态、有无Subtask等）
   - 用户选择目标Story

5. **Subtask详情展示**
   - 显示选定Story的现有Subtask详情
   - 展示Subtask状态和内容完整度
   - 为"用户故事分解"命令提供上下文

## API调用示例

### 获取项目列表
```bash
curl -u {user-email}:{auth-token} \
  -X GET \
  -H "Accept: application/json" \
  "https://{JIRA_DOMAIN}/rest/api/3/project/search"
```

### 获取项目Issue类型
```bash
curl -u {user-email}:{auth-token} \
  -X GET \
  -H "Content-Type: application/json" \
  "https://{JIRA_DOMAIN}/rest/api/3/issuetype/project?projectId={PROJECTID}"
```

### 获取Epic列表
```bash
curl -u {user-email}:{auth-token} \
  -X GET \
  -H "Accept: application/json" \
  "https://{JIRA_DOMAIN}/rest/api/3/search?jql=project={PROJECT_KEY} AND issuetype=Epic"
```

### 获取Epic下的Story
```bash
curl -u {user-email}:{auth-token} \
  -X GET \
  -H "Accept: application/json" \
  "https://{JIRA_DOMAIN}/rest/api/3/search?jql=parent={EPIC_KEY} AND issuetype=Story"
```

### 获取Story的Subtask
```bash
curl -u {user-email}:{auth-token} \
  -X GET \
  -H "Accept: application/json" \
  "https://{JIRA_DOMAIN}/rest/api/3/search?jql=parent={STORY_KEY} AND issuetype=Subtask"
```

## 输出格式

### 项目选择界面
```
📋 发现的项目列表:
1. [PROJ-1] 项目A - 关键字: PROJ
2. [PROJ-2] 项目B - 关键字: DEV
3. [PROJ-3] 项目C - 关键字: TEST

请选择项目编号 (1-3):
```

### Epic选择界面
```
🎯 项目 [PROJ-1] 中的Epic:
1. [EPIC-1] 用户认证系统 - 状态: 进行中 - Story数量: 5
2. [EPIC-2] 数据管理模块 - 状态: 待办 - Story数量: 3
3. [EPIC-3] 报表功能 - 状态: 完成 - Story数量: 8

请选择Epic编号 (1-3):
```

### Story选择界面
```
📖 Epic [EPIC-1] 中的Story:
1. [STORY-1] 用户登录功能 - 状态: 待办 - 优先级: 高 - Subtask: 0
2. [STORY-2] 密码重置功能 - 状态: 进行中 - 优先级: 中 - Subtask: 2
3. [STORY-3] 双因素认证 - 状态: 待办 - 优先级: 低 - Subtask: 0

请选择需要分解的Story编号 (1-3):
```

### 最终结果
```
✅ 发现完成！
选中的Story: [STORY-1] 用户登录功能

请执行以下命令进行分解:
/pm-plugin:用户故事分解 STORY-1
```

## 规则

- 使用Atlassian Document格式处理描述字段
- 提供清晰的错误处理和用户提示
- 支持中英文双语输出
- 确保与现有requirements-plugin的配置兼容