import requests
from requests.auth import HTTPBasicAuth

# ===== Jira 配置 =====
JIRA_DOMAIN = ""
EMAIL = ""
TOKEN = ""
# =====================

def has_subtasks(story_key):
    """检查指定 Story 是否包含 Sub-task"""
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{story_key}?fields=subtasks"
    auth = HTTPBasicAuth(EMAIL, TOKEN)
    headers = {"Accept": "application/json"}
    r = requests.get(url, headers=headers, auth=auth)
    if r.status_code != 200:
        print(f"❌ 查询失败: {r.status_code} - {r.text}")
        return None
    data = r.json()
    subtasks = data["fields"].get("subtasks", [])
    return len(subtasks) > 0

def delete_story(story_key):
    """删除 Story（若无子任务）"""
    if has_subtasks(story_key):
        print(f"⚠️ Story {story_key} 含有 Sub-task，禁止删除。请先删除子任务。")
        return
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{story_key}"
    auth = HTTPBasicAuth(EMAIL, TOKEN)
    headers = {"Accept": "application/json"}
    r = requests.delete(url, headers=headers, auth=auth)
    if r.status_code == 204:
        print(f"✅ Story 删除成功: {story_key}")
    else:
        print(f"❌ 删除失败: {r.status_code} - {r.text}")

if __name__ == "__main__":
    story_key = "CMT-5"  # 示例：要删除的 Story
    delete_story(story_key)
