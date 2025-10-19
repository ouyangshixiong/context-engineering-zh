---
description: 根据用户输入，删除JIRA中对应的story
---

# 删除story Command

1. 读取jira.md中的jira的JIRA_DOMAIN、user-email和auth-token，如果没有这个配置文件，提示用户输入JIRA_DOMAIN、user-email和auth-token并创建jira.md配置文件
2. 根据example先获取所属story内部ID
3. 模仿`scripts/delete_story.py`删除jira的story
4. 如果story包含Subtask，删除动作失败，根据`scripts/delete_story.py`的输出提示用户

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