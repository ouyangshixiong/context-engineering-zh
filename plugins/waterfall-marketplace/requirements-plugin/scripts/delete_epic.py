import requests
from requests.auth import HTTPBasicAuth

# ============ 你的JIRA信息 ============
JIRA_DOMAIN = ""
EMAIL = ""
API_TOKEN = ""
# ====================================


def delete_jira_epic(epic_key: str):
    """
    删除指定的Epic。
    epic_key: 例如 "CMT-123"
    """
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{epic_key}"
    auth = HTTPBasicAuth(EMAIL, API_TOKEN)
    headers = {"Accept": "application/json"}

    print(f"🗑 正在删除 Epic: {epic_key} ...")
    response = requests.delete(url, headers=headers, auth=auth)

    if response.status_code == 204:
        print(f"✅ Epic 删除成功: {epic_key}")
    elif response.status_code == 404:
        print(f"❌ 未找到该 Epic: {epic_key}")
    elif response.status_code == 403:
        print(f"❌ 无权限删除该 Epic: {epic_key}")
    else:
        print(f"❌ 删除失败: {response.status_code} - {response.text}")


if __name__ == "__main__":
    # 示例：删除一个Epic
    epic_to_delete = "CMT-1"  # 请替换为你要删除的Epic编号
    delete_jira_epic(epic_to_delete)
