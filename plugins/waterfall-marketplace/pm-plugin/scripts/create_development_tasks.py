import requests
import json
from requests.auth import HTTPBasicAuth

def read_jira_config():
    """读取当前目录下的jira.md配置文件"""
    with open("jira.md", "r") as f:
        content = f.read()

    config = {}
    for line in content.split('\n'):
        if '=' in line:
            key, value = line.split('=', 1)
            config[key.strip()] = value.strip().strip('\"\'')

    return config

def get_next_dev_task_number(story_key, subtask_key, jira_domain, email, api_token):
    """获取下一个开发任务序号"""
    auth = HTTPBasicAuth(email, api_token)
    headers = {"Accept": "application/json"}

    jql = f'parent = {story_key} AND labels = implementation AND summary ~ "\\[DEV-{subtask_key}"'  # 使用Summary匹配
    url = f"https://{jira_domain}/rest/api/3/search/jql"

    response = requests.get(url, headers=headers, auth=auth, params={"jql": jql, "maxResults": 100})
    if response.status_code == 200:
        return len(response.json()['issues']) + 1
    else:
        print(f"⚠️  查询开发任务失败: {response.text}")
        return 1

def create_development_task(subtask_key: str, summary: str, description: str, story_key: str = None):
    """创建开发任务并链接到对应的子需求"""
    config = read_jira_config()
    JIRA_DOMAIN, EMAIL, API_TOKEN = config["JIRA_DOMAIN"], config["EMAIL"], config["API_TOKEN"]
    auth = HTTPBasicAuth(EMAIL, API_TOKEN)

    # 获取Story信息
    story_response = requests.get(f"https://{JIRA_DOMAIN}/rest/api/3/issue/{story_key}",
                                 headers={"Accept": "application/json"}, auth=auth)
    if story_response.status_code != 200:
        print(f"❌ 获取Story信息失败: {story_response.text}")
        return None

    story_id = story_response.json()['id']
    dev_task_number = get_next_dev_task_number(story_key, subtask_key, JIRA_DOMAIN, EMAIL, API_TOKEN)
    formatted_summary = f"[DEV-{subtask_key}-{dev_task_number}] {summary}"

    # 创建开发任务
    payload = {
        "fields": {
            "project": {"key": subtask_key.split('-')[0]},
            "issuetype": {"name": "Subtask"},
            "summary": formatted_summary,
            "parent": {"id": story_id},
            "labels": ["implementation", f"DEV-{subtask_key}-{dev_task_number}"],
            "description": {
                "type": "doc", "version": 1,
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": description}]}]
            }
        }
    }

    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    response = requests.post(f"https://{JIRA_DOMAIN}/rest/api/3/issue",
                            data=json.dumps(payload), headers=headers, auth=auth)

    if response.status_code == 201:
        task_key = response.json()['key']
        print(f"✅ 开发任务创建成功: {task_key}")

        # 创建链接
        link_payload = {
            "type": {"name": "Relates"},
            "inwardIssue": {"key": task_key},
            "outwardIssue": {"key": subtask_key}
        }
        link_response = requests.post(f"https://{JIRA_DOMAIN}/rest/api/3/issueLink",
                                     data=json.dumps(link_payload), headers=headers, auth=auth)
        if link_response.status_code == 201:
            print(f"✅ 链接创建成功: {task_key} → {subtask_key}")
        else:
            print(f"⚠️  链接创建失败: {link_response.text}")

        return task_key
    else:
        print(f"❌ 创建失败: {response.text}")
        return None

if __name__ == "__main__":
    # 示例用法
    create_development_task(
        subtask_key="CMT-76",
        summary="实现用户登录功能",
        description="开发用户登录界面和认证逻辑",
        story_key="CMT-75"
    )