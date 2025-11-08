---
description: 根据用户输入，删除JIRA中对应的Sub-task
---

# 删除Sub-task Command

## 🎯 Agile理论背景

根据Agile/Scrum最佳实践：
- **Sub-task**：Story分解后的可执行技术Sub-task
- **管理原则**：及时清理无效或已完成的Sub-tasks，保持Backlog整洁
- **追溯性**：删除操作应记录在Story的评论中

## 🛠️ 操作流程

1. 读取jira.md中的JIRA_DOMAIN、user-email和auth-token，如果没有这个配置文件，提示用户输入JIRA_DOMAIN、user-email和auth-token并创建jira.md配置文件
2. 根据example先获取所属story内部ID
3. 模仿`scripts/delete_subtask.py`删除jira的Subtask

## ⚠️ 注意事项

- 删除前确认Sub-task状态，避免误删正在进行的工作
- 删除操作不可逆，请谨慎执行
- 建议在删除前记录删除原因

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