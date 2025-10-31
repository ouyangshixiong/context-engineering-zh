---
description: 快速反馈循环命令，2-3分钟基于用户反馈进行代码调整和验证，支持持续改进
---

# Quick Feedback Command
> 基于用户反馈的分钟级迭代优化引擎

## 工作流时间分配
- **反馈分析** (30秒) - Scrum Master Agent
- **代码调整** (1-2分钟) - Development Team Agent
- **快速验证** (30秒) - Quality Agent
- **结果确认** (30秒) - Scrum Master Agent

## JIRA API集成示例

### 1. 反馈记录和跟踪
```bash
# 添加反馈评论到任务
curl -u {email}:{token} -X POST \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/api/3/issue/{issueKey}/comment" \
  -d '{"body":"用户反馈: {feedback_content}"}'

# 更新任务状态为需要调整
curl -u {email}:{token} -X PUT \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/api/3/issue/{issueKey}" \
  -d '{"fields":{"status":{"id":"{reopen_status_id}"}}}'
```

### 2. 调整进度更新
```bash
# 更新调整进度
curl -u {email}:{token} -X POST \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/api/3/issue/{issueKey}/comment" \
  -d '{"body":"调整完成: {adjustment_description}"}'

# 标记为重新验证
curl -u {email}:{token} -X PUT \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/api/3/issue/{issueKey}" \
  -d '{"fields":{"status":{"id":"{in_review_status_id}"}}}'
```

### 3. 验证结果确认
```bash
# 添加验证结果
curl -u {email}:{token} -X POST \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/api/3/issue/{issueKey}/comment" \
  -d '{"body":"验证完成: {validation_result}"}'

# 最终状态确认
curl -u {email}:{token} -X PUT \
  -H "Content-Type: application/json" \
  "https://{domain}/rest/api/3/issue/{issueKey}" \
  -d '{"fields":{"status":{"id":"{done_status_id}"}}}'
```

## 多智能体协作流程

### 阶段1: 反馈分析 (30秒)
**Scrum Master Agent 执行：**
- 分析用户反馈的具体内容
- 识别需要调整的功能点
- 评估调整的影响范围
- 更新JIRA任务状态和记录反馈

### 阶段2: 代码调整 (1-2分钟)
**Development Team Agent 执行：**
- 基于反馈调整现有代码
- 修复功能缺陷或改进实现
- 确保调整不影响其他功能
- 更新JIRA调整进度

### 阶段3: 快速验证 (30秒)
**Quality Agent 执行：**
- 验证调整后的功能正确性
- 确认反馈问题已解决
- 检查回归测试通过情况
- 更新JIRA验证状态

### 阶段4: 结果确认 (30秒)
**Scrum Master Agent 执行：**
- 汇总调整和验证结果
- 确认用户反馈已处理完成
- 提供改进总结和建议
- 完成JIRA状态更新

## 适用场景

### 功能调整
- 用户界面交互优化
- 业务逻辑流程改进
- 性能优化和bug修复
- 用户体验增强

### 需求变更
- 新增简单功能需求
- 修改现有功能行为
- 调整数据展示方式
- 优化操作流程

### 问题修复
- 功能缺陷修复
- 数据错误纠正
- 界面显示问题
- 性能问题解决

## 输出产物

### 代码调整
- 修改后的功能代码
- 修复的缺陷和问题
- 优化的实现逻辑
- 更新的测试用例

### 验证报告
- 调整功能验证结果
- 回归测试通过情况
- 质量检查状态
- 改进效果评估

### JIRA记录
- 反馈内容记录
- 调整过程跟踪
- 验证结果确认
- 状态变更历史

## 使用示例

```bash
# 执行快速反馈
/sprint-plugin:quick-feedback

# 输入反馈内容
用户输入: "注册页面的密码强度检查太严格，建议调整为中等强度"

# 预期输出
✅ 反馈分析完成 (30秒)
✅ 代码调整完成 (1.5分钟)
✅ 快速验证完成 (30秒)
✅ 结果确认完成 (30秒)

总耗时: 3分钟
交付: 调整后的密码强度检查逻辑
```

## 错误处理
- 反馈内容不明确时请求澄清
- 代码调整冲突时提供解决方案
- 验证发现问题时重新调整
- JIRA状态更新失败时重试

## 配置要求
- 确保jira.md配置文件存在且正确
- 具备修改Issue状态和添加评论的权限
- 支持快速的状态变更工作流
- 具备代码调整和验证的环境

这个命令实现了真正的快速反馈循环，通过多智能体协作，在2-3分钟内完成用户反馈的处理和验证，支持持续改进和优化。