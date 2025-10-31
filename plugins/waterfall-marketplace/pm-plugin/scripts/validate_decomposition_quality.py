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

def get_subtask_details(subtask_key: str):
    """获取Subtask详情"""
    config = read_jira_config()

    JIRA_DOMAIN = config["JIRA_DOMAIN"]
    EMAIL = config["EMAIL"]
    API_TOKEN = config["API_TOKEN"]

    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{subtask_key}?fields=summary,description"
    auth = HTTPBasicAuth(EMAIL, API_TOKEN)
    headers = {"Accept": "application/json"}

    response = requests.get(url, headers=headers, auth=auth)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ 获取Subtask详情失败: {response.text}")
        return None

def validate_subtask(subtask_key: str):
    """验证单个Subtask质量"""
    subtask_details = get_subtask_details(subtask_key)

    if not subtask_details:
        return

    summary = subtask_details["fields"]["summary"]
    description = subtask_details["fields"].get("description", "")

    print(f"📋 Subtask: {summary}")
    print(f"📝 描述长度: {len(str(description))} 字符")

    if len(str(description)) > 50:
        print("✅ 描述内容充足")
    else:
        print("⚠️ 描述内容可能不足")

def validate_story_subtasks(story_key: str):
    """验证Story的所有Subtask"""
    from analyze_story_context import get_story_details

    story_details = get_story_details(story_key)

    if not story_details:
        return

    subtasks = story_details["subtasks"]
    print(f"🔍 验证Story: {story_details['summary']}")
    print(f"📊 Subtasks数量: {len(subtasks)}")

    for subtask in subtasks:
        validate_subtask(subtask["key"])

if __name__ == "__main__":
    # 示例：验证Story分解质量
    validate_story_subtasks("CMT-123")