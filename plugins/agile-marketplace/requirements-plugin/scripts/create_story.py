import requests, json
from requests.auth import HTTPBasicAuth

# ===== Jira 配置 =====
JIRA = ""
EMAIL = ""
TOKEN = ""
PROJECT = ""
# =====================

def create_story(epic_id, summary, description=""):
    """创建 Team-managed 项目下的 Story，并绑定 Epic"""
    url = f"https://{JIRA}/rest/api/3/issue"
    auth = HTTPBasicAuth(EMAIL, TOKEN)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    payload = {
        "fields": {
            "project": {"key": PROJECT},
            "issuetype": {"name": "Story"},
            "summary": summary,
            "parent": {"id": epic_id},   # Team-managed 用 parent.id
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": description}]}
                ]
            }
        }
    }

    r = requests.post(url, headers=headers, auth=auth, data=json.dumps(payload))
    if r.status_code == 201:
        print(f"✅ Story 创建成功: {r.json()['key']}")
    else:
        print(f"❌ 创建失败: {r.status_code} - {r.text}")

if __name__ == "__main__":
    create_story(
        epic_id="10040",
        summary="图像预处理模块开发 / Image Preprocessing Module",
        description="实现图像归一化、数据增强及批处理逻辑。"
    )
