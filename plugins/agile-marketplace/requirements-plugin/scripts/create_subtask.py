import requests
import json
from requests.auth import HTTPBasicAuth

# ===== Jira 配置 =====
JIRA = ""
EMAIL = ""
TOKEN = ""
PROJECT = ""
# =====================

def create_subtask(story_id, summary, description):
    """
    创建 Sub-task（子需求）并挂在指定 Story 下
    story_id: Story 的内部 ID（parent.id）
    summary: 子需求标题
    description: 子需求描述
    """
    url = f"https://{JIRA}/rest/api/3/issue"
    auth = HTTPBasicAuth(EMAIL, TOKEN)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    payload = {
        "fields": {
            "project": {"key": PROJECT},
            "issuetype": {"name": "Subtask"},  # 注意改为 Subtask
            "summary": summary,
            "parent": {"id": story_id},  # 挂在 Story 下
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
        print(f"✅ Sub-task 创建成功: {r.json()['key']}")
    else:
        print(f"❌ 创建失败: {r.status_code} - {r.text}")

if __name__ == "__main__":
    # 示例：Story 内部 ID（通过 curl 获取）
    story_id = "10144"  # Story: 实现图像归一化、数据增强及批处理逻辑
    create_subtask(
        story_id=story_id,
        summary="对输入图片进行增强2 / Image Augmentation2",
        description="2-对输入图片进行旋转、缩放、翻转和颜色扰动等增强操作，以提高模型鲁棒性。"
    )
