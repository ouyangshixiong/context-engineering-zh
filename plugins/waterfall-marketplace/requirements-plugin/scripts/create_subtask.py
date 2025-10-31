import requests
import json
import os
from requests.auth import HTTPBasicAuth

# ===== Jira 配置 =====
JIRA = ""
EMAIL = ""
TOKEN = ""
PROJECT = ""
# =====================

def read_jira_config():
    """读取JIRA配置文件"""
    # 尝试多种可能的配置文件路径
    possible_paths = [
        os.path.expanduser("~/jira.md"),
        os.path.expanduser("~/.jira.md"),
        os.path.join(os.path.dirname(__file__), "../../jira.md"),
        os.path.join(os.path.dirname(__file__), "../../../jira.md"),
        os.path.join(os.getcwd(), "jira.md")
    ]

    jira_file_path = None
    for path in possible_paths:
        if os.path.exists(path):
            jira_file_path = path
            break

    if not jira_file_path:
        print("❌ jira.md文件不存在，请先配置JIRA信息")
        print("   尝试的路径:")
        for path in possible_paths:
            print(f"   - {path}")
        return None

    try:
        with open(jira_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        config = {}
        for line in content.split('\n'):
            if '=' in line:
                key, value = line.split('=', 1)
                # 移除值中的引号
                value = value.strip().strip('\"\'')
                config[key.strip()] = value

        print(f"📋 从 {jira_file_path} 读取JIRA配置")
        return config
    except Exception as e:
        print(f"❌ 读取jira.md文件失败: {e}")
        return None

def get_story_key(story_id):
    """
    根据Story内部ID获取Story Key
    """
    # 读取JIRA配置
    config = read_jira_config()
    if not config:
        return None

    JIRA_DOMAIN = config.get("JIRA_DOMAIN", "")
    EMAIL = config.get("EMAIL", "")
    API_TOKEN = config.get("API_TOKEN", "")

    if not all([JIRA_DOMAIN, EMAIL, API_TOKEN]):
        print("❌ JIRA配置不完整，请检查jira.md文件")
        return None

    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{story_id}"
    auth = HTTPBasicAuth(EMAIL, API_TOKEN)
    headers = {"Accept": "application/json"}

    response = requests.get(url, headers=headers, auth=auth)
    if response.status_code == 200:
        return response.json()['key']
    else:
        print(f"❌ 获取Story信息失败: {response.status_code} - {response.text}")
        return None

def get_next_subtask_number(story_key):
    """
    获取下一个子需求序号
    """
    # 读取JIRA配置
    config = read_jira_config()
    if not config:
        return 1

    JIRA_DOMAIN = config.get("JIRA_DOMAIN", "")
    EMAIL = config.get("EMAIL", "")
    API_TOKEN = config.get("API_TOKEN", "")

    if not all([JIRA_DOMAIN, EMAIL, API_TOKEN]):
        print("❌ JIRA配置不完整，请检查jira.md文件")
        return 1

    # 查询该Story下已有的子需求数量
    jql = f'parent = {story_key} AND issuetype = Subtask'
    url = f"https://{JIRA_DOMAIN}/rest/api/3/search/jql"
    auth = HTTPBasicAuth(EMAIL, API_TOKEN)
    headers = {"Accept": "application/json"}

    params = {
        "jql": jql,
        "maxResults": 100
    }

    response = requests.get(url, headers=headers, auth=auth, params=params)
    if response.status_code == 200:
        subtasks = response.json()['issues']
        return len(subtasks) + 1
    else:
        print(f"❌ 查询子需求失败: {response.status_code} - {response.text}")
        return 1

def create_subtask(story_id, summary, description):
    """
    创建 Sub-task（子需求）并挂在指定 Story 下
    story_id: Story 的内部 ID（parent.id）
    summary: 子需求标题
    description: 子需求描述
    """
    # 读取JIRA配置
    config = read_jira_config()
    if not config:
        print("❌ 无法读取JIRA配置，创建失败")
        return

    JIRA_DOMAIN = config.get("JIRA_DOMAIN", "")
    EMAIL = config.get("EMAIL", "")
    API_TOKEN = config.get("API_TOKEN", "")

    if not all([JIRA_DOMAIN, EMAIL, API_TOKEN]):
        print("❌ JIRA配置不完整，请检查jira.md文件")
        return

    # 获取Story Key
    story_key = get_story_key(story_id)
    if not story_key:
        print("❌ 无法获取Story Key，创建失败")
        return

    # 获取下一个序号
    subtask_number = get_next_subtask_number(story_key)

    # 生成规范的需求编号
    requirement_number = f"REQ-{story_key}-{subtask_number}"

    # 在Summary中添加格式前缀
    formatted_summary = f"[{requirement_number}] {summary}"

    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue"
    auth = HTTPBasicAuth(EMAIL, API_TOKEN)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    payload = {
        "fields": {
            "project": {"key": story_key.split('-')[0]},  # 从Story Key中提取项目
            "issuetype": {"name": "Subtask"},  # 注意改为 Subtask
            "summary": formatted_summary,
            "parent": {"id": story_id},  # 挂在 Story 下
            "labels": ["requirement", f"REQ-{story_key}"],  # 添加规范标签
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
        created_key = r.json()['key']
        print(f"✅ Sub-task 创建成功: {created_key}")
        print(f"📋 需求编号: {requirement_number}")

        # 注意：开发任务通常在此之后创建，因此不在此处建立链接
        # 链接关系将在开发任务创建时自动建立

    else:
        print(f"❌ 创建失败: {r.status_code} - {r.text}")

# 链接功能已移至开发任务创建脚本

if __name__ == "__main__":
    # 示例：Story 内部 ID（通过 curl 获取）
    story_id = "10144"  # Story: 实现图像归一化、数据增强及批处理逻辑
    create_subtask(
        story_id=story_id,
        summary="对输入图片进行增强2 / Image Augmentation2",
        description="2-对输入图片进行旋转、缩放、翻转和颜色扰动等增强操作，以提高模型鲁棒性。"
    )
