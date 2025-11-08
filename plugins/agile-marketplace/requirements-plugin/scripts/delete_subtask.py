import requests
from requests.auth import HTTPBasicAuth

# ===== Jira 配置 =====
JIRA_DOMAIN = ""
EMAIL = ""
TOKEN = ""
# =====================

def delete_subtask(subtask_key: str):
    """
    删除指定 Sub-task
    subtask_key: Sub-task Key（如 CMT-4，注意这是JIRA系统生成的Key，不是TASK编号）
    """
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{subtask_key}"
    auth = HTTPBasicAuth(EMAIL, TOKEN)
    headers = {"Accept": "application/json"}

    response = requests.delete(url, headers=headers, auth=auth)
    if response.status_code == 204:
        print(f"✅ Sub-task 删除成功: {subtask_key}")
    else:
        print(f"❌ 删除失败: {response.status_code} - {response.text}")

if __name__ == "__main__":
    # 示例：删除刚创建的 Sub-task
    # 注意：这里使用实际的JIRA Issue Key，不是TASK编号
    subtask_key = "CMT-4"  # 实际的JIRA Key，不是TASK-CMT-5-1
    delete_subtask(subtask_key)
