# Sprint Plugin

这是一个敏捷开发 Sprint 管理插件，包含多个专门的 Agent 来协助团队进行开发、质量保证和 Scrum 流程管理。

## 目录结构
- `agents/`: 包含 Development Team, Quality, Scrum Master 等 Agent 定义。
- `commands/`: 包含 Sprint 相关的命令。
- `hooks/`: 包含自动化 Hook 脚本和配置。
- `utils/`: 包含各种辅助工具和集成系统。

## 安装与配置

### 1. 依赖安装
在插件目录安装依赖：
```bash
cd plugins/agile-marketplace/sprint-plugin
npm install
```

### 2. Hook 配置
本插件使用 Claude Code Hooks 来实现自动化的开发完成通知与质量验证完成通知。

请将 `hooks/hooks-config.json` 中的配置合并到您的 `.claude/config.json` 文件中，或者通过 Claude Code 的 `/hooks` 命令进行配置。

**配置内容:**
```json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "development-team-agent",
        "hooks": [
          {
            "type": "command",
            "command": "npx -y tsx plugins/agile-marketplace/sprint-plugin/hooks/notify_dev_completion.ts"
          }
        ]
      },
      {
        "matcher": "quality-agent",
        "hooks": [
          {
            "type": "command",
            "command": "npx -y tsx plugins/agile-marketplace/sprint-plugin/hooks/notify_quality_completion.ts"
          }
        ]
      }
    ]
  }
}
```

### 3. 环境变量
确保以下环境变量已设置（通常在 `.env` 文件中）：
- `EMAIL`: JIRA 登录邮箱
- `API_TOKEN`: JIRA API Token
- `JIRA_DOMAIN`: JIRA 域名 (例如: your-domain.atlassian.net)

## Agents 说明

### Development Team Agent
负责代码生成和开发任务执行。
- **自动化通知**: 开发任务状态流转为 "Done" 时，会自动发送 JIRA 通知，无需人工干预。

### Quality Agent
负责测试验证与质量相关任务执行。
- **自动化通知**: 质量验证相关任务状态流转为 "Done" 时，会自动发送 JIRA 通知。

### Scrum Master Agent
专注于获取sprint中的stories和tasks信息，返回结构化数据并构建todo list。
- **Sprint信息获取**: 获取Sprint的ID、名称、目标、状态等基本信息
- **Story和Task分析**: 提取Sprint中的所有Story和关联的Sub-task
- **Todo List构建**: 基于任务信息构建可执行的Todo List
- **结构化数据输出**: 返回清晰的Sprint信息、Story列表、Task列表和Todo List
