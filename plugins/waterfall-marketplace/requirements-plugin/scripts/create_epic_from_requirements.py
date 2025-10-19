import requests
import json
from requests.auth import HTTPBasicAuth
from pathlib import Path

# ============ 你的JIRA信息 ============
JIRA_DOMAIN = ""
EMAIL = ""
API_TOKEN = ""
PROJECT_KEY = ""  # 你的项目关键字
# ====================================

def extract_epic_summary(requirements_file: str) -> str:
    """从markdown文件提取系统概述部分，用于Epic描述"""
    text = Path(requirements_file).read_text(encoding="utf-8")
    if "## System Overview" in text:
        part = text.split("## System Overview")[1].split("##")[0].strip()
        return part
    else:
        return text[:500]

def create_jira_epic(summary: str, description: str):
    """在JIRA中创建Epic"""
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue"
    auth = HTTPBasicAuth(EMAIL, API_TOKEN)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    payload = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "summary": summary,
            "issuetype": {"name": "Epic"},
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": description}]}
                ]
            },
            "labels": ["requirement", "translation", "tts"]
        }
    }

    response = requests.post(url, data=json.dumps(payload), headers=headers, auth=auth)
    if response.status_code == 201:
        print(f"✅ Epic 创建成功: {response.json()['key']}")
    else:
        print("❌ 创建失败:", response.status_code, response.text)

if __name__ == "__main__":
    epic_description = extract_epic_summary("requirements.md")
    create_jira_epic(
        summary="Epic: Cantonese–Mandarin Translation System (v2.0)",
        description=epic_description
    )
