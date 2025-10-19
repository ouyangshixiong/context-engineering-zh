---
description: 根据用户输入，删除JIRA的epic（长期规划）
---

# 删除epic Command

1. 读取jira.md中的jira的JIRA_DOMAIN、user-email和auth-token，如果没有这个配置文件，提示用户输入JIRA_DOMAIN、user-email和auth-token并创建jira.md配置文件
2. 根据example先获取所有project_id,并用JSON解析返回结果,显示project相关的信息，包括id，keyword等等，要求用户选择
3. 根据example下一步，列出issue type，需要上一步的project_id作为参数，同理用JSON解析。并显示此project_id下支持的所有issue type，要求用户选择
4. 如果上一步的issue type包含epic，则将总体需求分解并格式化，模仿`scripts/delete_epic.py`删除用户选择的jira的epic

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

# rule
使用Atlassian Document格式