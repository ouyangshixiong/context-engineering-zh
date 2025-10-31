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

def update_subtask_description(subtask_key: str, description: str):
    """更新Subtask描述"""
    config = read_jira_config()

    JIRA_DOMAIN = config["JIRA_DOMAIN"]
    EMAIL = config["EMAIL"]
    API_TOKEN = config["API_TOKEN"]

    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{subtask_key}"
    auth = HTTPBasicAuth(EMAIL, API_TOKEN)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    payload = {
        "fields": {
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": description}]}
                ]
            }
        }
    }

    response = requests.put(url, data=json.dumps(payload), headers=headers, auth=auth)

    if response.status_code == 204:
        print(f"✅ Subtask描述更新成功: {subtask_key}")
        return True
    else:
        print(f"❌ 更新失败: {response.text}")
        return False

def enrich_subtasks(subtask_keys: list, descriptions: list):
    """批量充实Subtask内容"""
    for subtask_key, description in zip(subtask_keys, descriptions):
        update_subtask_description(subtask_key, description)

if __name__ == "__main__":
    # 示例：更新单个Subtask描述
    update_subtask_description(
        "CMT-76",
        "开发用户登录功能，包括前端界面和后端认证逻辑"
    )

    # 示例：批量更新
    subtask_keys = ["CMT-77", "CMT-78", "CMT-79"]
    descriptions = [
        "实现用户注册功能",
        "开发密码重置功能",
        "实现用户权限管理"
    ]
    enrich_subtasks(subtask_keys, descriptions)