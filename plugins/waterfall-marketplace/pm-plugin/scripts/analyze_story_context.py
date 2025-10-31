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

def get_story_details(story_key: str):
    """获取Story详情"""
    config = read_jira_config()

    JIRA_DOMAIN = config["JIRA_DOMAIN"]
    EMAIL = config["EMAIL"]
    API_TOKEN = config["API_TOKEN"]

    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{story_key}?fields=summary,description,parent,subtasks"
    auth = HTTPBasicAuth(EMAIL, API_TOKEN)
    headers = {"Accept": "application/json"}

    response = requests.get(url, headers=headers, auth=auth)

    if response.status_code == 200:
        data = response.json()
        return {
            "story_key": story_key,
            "summary": data["fields"].get("summary", ""),
            "description": data["fields"].get("description", ""),
            "parent_epic": data["fields"].get("parent", {}).get("key", "") if data["fields"].get("parent") else "",
            "subtasks": data["fields"].get("subtasks", [])
        }
    else:
        print(f"❌ 获取Story详情失败: {response.text}")
        return None

def analyze_story_context(story_key: str):
    """分析Story上下文"""
    story_details = get_story_details(story_key)

    if not story_details:
        return

    print(f"📋 Story: {story_details['summary']}")
    print(f"📝 描述: {story_details['description'][:100]}...")
    print(f"🏷️ Epic: {story_details['parent_epic']}")

    subtasks = story_details["subtasks"]
    print(f"📊 Subtasks: {len(subtasks)} 个")

    for subtask in subtasks:
        print(f"   - {subtask['key']}: {subtask['fields'].get('summary', '')}")

if __name__ == "__main__":
    analyze_story_context("CMT-123")