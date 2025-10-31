---
description: 分钟级即时迭代交付命令，5-8分钟完成需求到验证的完整流程，触发多智能体并行协作
---

# Instant Sprint Command
> 基于LLM多智能体的分钟级软件交付引擎

## 工作流时间分配
- **需求澄清** (30秒) - Scrum Master Agent
- **代码生成** (3-5分钟) - Development Team Agent
- **测试验证** (1-2分钟) - Quality Agent
- **结果汇总** (30秒) - Scrum Master Agent

## JIRA API集成示例

### 1. Sprint创建和管理
```bash
# 创建新Sprint
curl -u {email}:{token} -X POST \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/agile/1.0/sprint" \
  -d '{"name":"Instant Sprint - {timestamp}","goal":"{sprint_goal}","startDate":"{start_date}","endDate":"{end_date}"}'

# 获取活跃Sprint
curl -u {email}:{token} -X GET \
  -H "Accept: application/json" \
  "https://{domain}/rest/agile/1.0/board/{boardId}/sprint?state=active"
```

### 2. 任务创建和分配
```bash
# 创建开发任务
curl -u {email}:{token} -X POST \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/api/3/issue" \
  -d '{"fields":{"project":{"key":"{project_key}"},"summary":"{task_summary}","issuetype":{"name":"Subtask"},"parent":{"key":"{story_key}"},"description":{"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"{task_description}"}]}]}}}'

# 分配任务到Sprint
curl -u {email}:{token} -X POST \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/agile/1.0/sprint/{sprintId}/issue" \
  -d '{"issues":["{task_key}"]}'
```

### 3. 状态更新和跟踪
```bash
# 更新任务状态
curl -u {email}:{token} -X PUT \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/api/3/issue/{issueKey}" \
  -d '{"fields":{"status":{"id":"{status_id}"}}}'

# 添加进度评论
curl -u {email}:{token} -X POST \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/api/3/issue/{issueKey}/comment" \
  -d '{"body":"{progress_update}"}'
```

## 多智能体协作流程

### 阶段1: 需求澄清 (30秒)
**Scrum Master Agent 执行：**
- 快速分析用户需求输入
- 澄清业务价值和验收标准
- **强制创建子任务** - 每个故事创建3-5个子任务
- 创建JIRA Sprint并设置目标
- **严格状态初始化** - 初始化所有任务状态

### 阶段2: 代码生成 (3-5分钟)
**Development Team Agent 执行：**
- **强制状态更新** - 更新故事和子任务为"In Progress"
- 基于清晰需求生成完整代码
- 实现前端、后端、数据库功能
- **实时进度评论** - 每30秒添加技术实现进度
- 创建基础测试用例
- **严格状态流转** - 更新状态为"Code Review"

### 阶段3: 测试验证 (1-2分钟)
**Quality Agent 执行：**
- **强制状态更新** - 更新故事和子任务为"Testing"
- 执行自动化测试套件
- **实时质量评论** - 每30秒添加测试执行进度
- 验证功能完整性和正确性
- 检查代码质量和规范
- **完成状态更新** - 更新状态为"Done"

### 阶段4: 结果汇总 (30秒)
**Scrum Master Agent 执行：**
- 汇总交付成果和质量报告
- **完成Sprint生命周期** - 关闭Sprint
- **JIRA同步验证** - 确保所有状态和评论已同步
- 提供改进建议和下一步行动

## 输出产物

### 代码交付
- 完整的可运行功能模块
- 前端组件和后端API
- 数据库模型和迁移脚本
- 自动化测试套件

### 质量报告
- 测试执行结果和通过率
- 代码质量评分
- 功能验证状态
- 改进建议列表

### JIRA更新
- **强制子任务创建** - 每个故事3-5个子任务
- **严格状态更新** - 实时状态流转跟踪
- **实时进度评论** - 每30秒进度同步
- **Sprint生命周期** - 完整Sprint管理
- **错误处理机制** - API失败重试和报告
- **完整审计跟踪** - 所有操作时间戳记录

## 使用示例

```bash
# 执行即时Sprint
/sprint-plugin:instant-sprint

# 输入需求描述
用户输入: "需要开发一个用户注册功能，包含邮箱验证和密码强度检查"

# 预期输出
✅ 需求澄清完成 (30秒)
✅ 代码生成完成 (4分钟)
✅ 测试验证完成 (1.5分钟)
✅ Sprint交付完成 (30秒)

总耗时: 6分钟
交付: 完整的用户注册模块
```

## 错误处理
- 需求不清晰时自动请求澄清
- 代码生成失败时提供具体错误信息
- 测试验证发现问题时创建缺陷报告
- **JIRA API调用失败重试** - 3次自动重试机制
- **状态同步失败处理** - 本地跟踪和异步同步
- **网络连接问题** - 自动检测和恢复机制
- **权限验证失败** - 自动权限检查和提示

## 配置要求
- 确保jira.md配置文件存在且正确
- 包含JIRA_DOMAIN、EMAIL、API_TOKEN配置
- 支持多项目和多Board配置
- 具备创建Sprint和Issue的权限

这个命令实现了真正的分钟级软件交付，通过多智能体并行协作，将传统敏捷的周级迭代压缩到5-8分钟完成。