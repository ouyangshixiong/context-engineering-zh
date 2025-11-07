---
description: 根据需求文档（requirements.md）的单一需求项,创建JIRA的story（功能需求），并关联上下文的JIRA的epic
---

# role
你扮演Product Owner（项目负责人）的角色，负责将业务目标转化为产品需求；关注需求优先级排序

# 创建story Command

1. 读取jira.md中的jira的JIRA_DOMAIN、user-email和auth-token，如果没有这个配置文件，提示用户输入JIRA_DOMAIN、user-email和auth-token并创建jira.md配置文件
2. 获取项目中的所有epics，让用户选择或自动匹配对应的epic
3. 获取所选epic的内部ID（epic_id）
4. 将单一需求项格式化，模仿`scripts/create_story.py`创建jira的story，并正确关联epic_id，例如parent字段关联epic.

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

## 获取项目中的所有epics
curl -u "{user-email}:{auth-token}" \
  -X GET \
  -H "Accept: application/json" \
  "https://ouyangshixiong.atlassian.net/rest/api/3/search?jql=project=CMT+AND+issuetype=Epic"

## 获取epic的内部ID（epic_id）
curl -u "{user-email}:{auth-token}" \
  -X GET \
  -H "Accept: application/json" \
  "https://ouyangshixiong.atlassian.net/rest/api/3/issue/{EPIC_KEY}" | jq -r '.id'

## 获取story的内部ID
curl -u "{user-email}:{auth-token}" \
  -X GET \
  -H "Accept: application/json" \
  "https://ouyangshixiong.atlassian.net/rest/api/3/issue/CMT-5" | jq -r '.id'

# rule
使用Atlassian Document格式

# 关键注意事项
1. **epic关联字段**: 在Team-managed项目中，使用`"parent": {"id": epic_id}`字段关联epic
2. **epic_id获取**: 必须先获取epic的内部ID，而不是epic的key（如CMT-93）
3. **字段验证**: 确保payload中包含正确的parent字段：
   ```json
   "parent": {
     "id": "12345"  // epic的内部ID
   }
   ```
4. **错误处理**: 如果epic_id获取失败，应该提示用户并停止创建story