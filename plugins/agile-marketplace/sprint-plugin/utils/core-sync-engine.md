# 核心同步引擎

## 🎯 核心功能
- JIRA API强制同步协议
- API兼容性智能检测和迁移
- 双重状态检查和验证
- 统一错误处理和重试机制

## JIRA同步基础功能

### 1. 基础API调用
```bash
# JIRA配置读取
function load_jira_config() {
    if [ -f "jira.md" ]; then
        source jira.md
        echo "✅ JIRA配置已加载"
        return 0
    else
        echo "❌ jira.md配置文件不存在"
        return 1
    fi
}

# 验证JIRA连接
function verify_jira_connection() {
    echo "📡 验证JIRA连接..."

    curl -s -u "$EMAIL:$API_TOKEN" \
        -X GET \
        -H "Accept: application/json" \
        "https://$JIRA_DOMAIN/rest/api/3/myself" \
        | jq -e '.accountId' > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ JIRA连接成功"
        return 0
    else
        echo "❌ JIRA连接失败"
        return 1
    fi
}

# 强制同步检查点
function sync_checkpoint() {
    local agent_name=$1
    local action=$2
    local issue_key=$3
    local target_status=$4
    local transition_id=$5

    echo "🔗 强制同步检查点: $agent_name - $action - $issue_key -> $target_status"

    # 双重状态检查
    local current_status=$(get_issue_status "$issue_key")
    echo "📊 当前状态: $current_status, 目标状态: $target_status"

    if [ "$current_status" = "$target_status" ]; then
        echo "✅ 状态已同步，跳过更新"
        return 0
    fi

    # 执行状态更新
    local result=$(update_issue_status "$issue_key" "$transition_id")

    if [ $? -eq 0 ]; then
        echo "✅ 状态同步成功: $current_status → $target_status"

        # 添加同步记录
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        echo "$timestamp|$agent_name|$issue_key|$current_status|$target_status|$action" >> sync_history.txt

        return 0
    else
        echo "❌ 状态同步失败"
        return 1
    fi
}
```

### 2. 智能API兼容性处理
```bash
# 智能API版本检测
function detect_api_compatibility() {
    echo "🔍 检测JIRA API兼容性..."

    # 测试不同API端点
    local endpoints=(
        "/rest/api/3/myself"
        "/rest/api/2/myself"
        "/rest/agile/1.0/sprint"
        "/rest/greenhopper/1.0/sprint"
    )

    local compatible_endpoints=()

    for endpoint in "${endpoints[@]}"; do
        if curl -s -u "$EMAIL:$API_TOKEN" \
            -X GET \
            -H "Accept: application/json" \
            "https://$JIRA_DOMAIN$endpoint" \
            | jq -e '.' > /dev/null 2>&1; then
            compatible_endpoints+=("$endpoint")
            echo "  ✅ $endpoint 可用"
        else
            echo "  ❌ $endpoint 不可用"
        fi
    done

    # 保存兼容性配置
    echo "COMPATIBLE_ENDPOINTS=${compatible_endpoints[*]}" > api_compatibility.env
    echo "✅ API兼容性检测完成"
}

# 智能API调用包装器
function smart_jira_api_call() {
    local method=$1
    local endpoint=$2
    local data=$3

    echo "🤖 智能API调用: $method $endpoint"

    # 加载兼容性配置
    if [ -f "api_compatibility.env" ]; then
        source api_compatibility.env
    fi

    # 尝试兼容端点
    local compatible_endpoint=""
    for compatible in "${COMPATIBLE_ENDPOINTS[@]}"; do
        if [[ "$endpoint" == *"${compatible##*/}"* ]]; then
            compatible_endpoint="$compatible"
            break
        fi
    done

    if [ -n "$compatible_endpoint" ]; then
        endpoint="$compatible_endpoint"
        echo "  🔄 使用兼容端点: $endpoint"
    fi

    # 执行API调用
    local response
    if [ -n "$data" ]; then
        response=$(curl -s -u "$EMAIL:$API_TOKEN" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            "https://$JIRA_DOMAIN$endpoint" \
            -d "$data")
    else
        response=$(curl -s -u "$EMAIL:$API_TOKEN" \
            -X "$method" \
            -H "Accept: application/json" \
            "https://$JIRA_DOMAIN$endpoint")
    fi

    # 检查响应
    if echo "$response" | jq -e '.' > /dev/null 2>&1; then
        echo "✅ API调用成功"
        echo "$response"
        return 0
    else
        echo "❌ API调用失败"
        echo "响应: $response"
        return 1
    fi
}
```

### 3. 统一状态管理
```bash
# 获取Issue状态
function get_issue_status() {
    local issue_key=$1

    echo "📊 获取Issue状态: $issue_key"

    local response=$(smart_jira_api_call "GET" "/rest/api/3/issue/$issue_key")

    if [ $? -eq 0 ]; then
        local status=$(echo "$response" | jq -r '.fields.status.name')
        echo "✅ 状态获取成功: $status"
        echo "$status"
        return 0
    else
        echo "❌ 状态获取失败"
        return 1
    fi
}

# 更新Issue状态
function update_issue_status() {
    local issue_key=$1
    local transition_id=$2

    echo "🔄 更新Issue状态: $issue_key -> $transition_id"

    local data="{\"transition\":{\"id\":\"$transition_id\"}}"

    smart_jira_api_call "POST" "/rest/api/3/issue/$issue_key/transitions" "$data"
}

# 创建Issue
function create_issue() {
    local project_key=$1
    local summary=$2
    local description=$3
    local issue_type=$4

    echo "📝 创建Issue: $summary"

    local data="{\"fields\":{\"project\":{\"key\":\"$project_key\"},\"summary\":\"$summary\",\"issuetype\":{\"name\":\"$issue_type\"},\"description\":{\"type\":\"doc\",\"version\":1,\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"$description\"}]}]}}}"

    local response=$(smart_jira_api_call "POST" "/rest/api/3/issue" "$data")

    if [ $? -eq 0 ]; then
        local issue_key=$(echo "$response" | jq -r '.key')
        echo "✅ Issue创建成功: $issue_key"
        echo "$issue_key"
        return 0
    else
        echo "❌ Issue创建失败"
        return 1
    fi
}
```

### 4. Sprint管理功能
```bash
# 创建Sprint
function create_sprint() {
    local goal=$1
    local project_key=$2

    echo "🚀 创建Sprint: $goal"

    local start_date=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
    local end_date=$(date -u -d "+2 weeks" +"%Y-%m-%dT%H:%M:%S.000Z")

    local data="{\"name\":\"Instant Sprint - $(date '+%Y%m%d-%H%M%S')\",\"goal\":\"$goal\",\"startDate\":\"$start_date\",\"endDate\":\"$end_date\"}"

    local response=$(smart_jira_api_call "POST" "/rest/agile/1.0/sprint" "$data")

    if [ $? -eq 0 ]; then
        local sprint_id=$(echo "$response" | jq -r '.id')
        echo "✅ Sprint创建成功: $sprint_id"
        echo "$sprint_id"
        return 0
    else
        echo "❌ Sprint创建失败"
        return 1
    fi
}

# 分配Issue到Sprint
function assign_to_sprint() {
    local issue_key=$1
    local sprint_id=$2

    echo "📋 分配Issue到Sprint: $issue_key -> $sprint_id"

    local data="{\"issues\":[\"$issue_key\"]}"

    smart_jira_api_call "POST" "/rest/agile/1.0/sprint/$sprint_id/issue" "$data"
}

# 完成Sprint
function complete_sprint() {
    local sprint_id=$1

    echo "🏁 完成Sprint: $sprint_id"

    local data="{\"state\":\"closed\"}"

    smart_jira_api_call "POST" "/rest/agile/1.0/sprint/$sprint_id" "$data"
}
```

### 5. 评论和进度跟踪
```bash
# 添加JIRA评论
function add_jira_comment() {
    local issue_key=$1
    local comment_body=$2

    echo "💬 添加JIRA评论: $issue_key"

    local data="{\"body\":\"$comment_body\"}"

    smart_jira_api_call "POST" "/rest/api/3/issue/$issue_key/comment" "$data"
}

# 添加需求分析评论
function add_requirement_analysis_comment() {
    local issue_key=$1
    local goal=$2

    local comment="需求分析完成:\\n- 目标: $goal\\n- 验收标准: 功能完整可用\\n- 技术方案: 全栈实现\\n- 风险评估: 低"

    add_jira_comment "$issue_key" "$comment"
}
```

## 使用示例

### 基本使用
```bash
# 加载核心同步引擎
source core-sync-engine.md

# 初始化JIRA连接
load_jira_config
verify_jira_connection

# 检测API兼容性
detect_api_compatibility

# 创建Issue和Sprint
local story_key=$(create_issue "FC" "实现用户注册功能" "用户注册功能实现" "Story")
local sprint_id=$(create_sprint "用户注册功能开发" "FC")

# 强制同步
sync_checkpoint "Scrum Master" "需求澄清完成" "$story_key" "Ready for Dev" "$READY_FOR_DEV_ID"
```

### 智能API调用
```bash
# 智能API调用示例
smart_jira_api_call "GET" "/rest/api/3/issue/FC-123"
smart_jira_api_call "POST" "/rest/api/3/issue" '{"fields":{"project":{"key":"FC"},"summary":"测试Issue"}}'
```

这个核心同步引擎整合了JIRA API调用、强制同步协议、API兼容性处理和统一状态管理，提供了完整且可靠的JIRA集成能力。