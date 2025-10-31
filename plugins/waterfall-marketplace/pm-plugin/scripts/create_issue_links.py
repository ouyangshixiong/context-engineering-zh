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

def create_issue_link(source_issue_key: str, target_issue_key: str, link_type: str = "Relates"):
    """创建issue链接"""
    config = read_jira_config()

    JIRA_DOMAIN = config["JIRA_DOMAIN"]
    EMAIL = config["EMAIL"]
    API_TOKEN = config["API_TOKEN"]

    url = f"https://{JIRA_DOMAIN}/rest/api/3/issueLink"
    auth = HTTPBasicAuth(EMAIL, API_TOKEN)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    payload = {
        "type": {"name": link_type},
        "inwardIssue": {"key": source_issue_key},
        "outwardIssue": {"key": target_issue_key}
    }

    response = requests.post(url, data=json.dumps(payload), headers=headers, auth=auth)

    if response.status_code == 201:
        print(f"✅ 链接创建成功: {source_issue_key} → {target_issue_key}")
        return True
    else:
        print(f"❌ 链接创建失败: {response.text}")
        return False

def link_tasks_to_story(task_keys: list, story_key: str):
    """将任务链接到Story"""
    for task_key in task_keys:
        create_issue_link(task_key, story_key, "Relates")

if __name__ == "__main__":
    # 示例：创建链接
    create_issue_link("CMT-76", "CMT-75", "Relates")

    # 示例：批量链接
    task_keys = ["CMT-77", "CMT-78", "CMT-79"]
    link_tasks_to_story(task_keys, "CMT-75")