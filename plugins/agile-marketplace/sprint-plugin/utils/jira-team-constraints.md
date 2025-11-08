# JIRA团队版约束管理器

## 🎯 核心功能
- JIRA团队版Issue类型检查
- Sprint合规性验证
- 类型约束强制执行
- 错误处理和用户指导

## 类型约束定义

### 1. 允许的Issue类型
```bash
# JIRA团队版允许的Sprint Issue类型
ALLOWED_SPRINT_TYPES=("Story" "Task")

# 不允许的Issue类型
DISALLOWED_TYPES=("Sub-task" "Epic" "Bug" "Improvement" "New Feature")
```

### 2. 类型检查函数

```bash
# 验证单个Issue类型
function validate_issue_type() {
    local issue_key=$1

    echo "🔍 验证Issue类型: $issue_key"

    # 获取Issue类型
    local issue_type=$(get_issue_type "$issue_key")

    if [ -z "$issue_type" ]; then
        echo "❌ 无法获取Issue类型"
        return 1
    fi

    echo "📋 Issue类型: $issue_type"

    # 检查是否在允许列表中
    for allowed_type in "${ALLOWED_SPRINT_TYPES[@]}"; do
        if [ "$issue_type" = "$allowed_type" ]; then
            echo "✅ 类型检查通过: $issue_type"
            return 0
        fi
    done

    # 检查是否在不允许列表中
    for disallowed_type in "${DISALLOWED_TYPES[@]}"; do
        if [ "$issue_type" = "$disallowed_type" ]; then
            echo "❌ 类型检查失败: $issue_type (不允许加入Sprint)"
            return 1
        fi
    done

    # 未知类型
    echo "⚠️ 未知Issue类型: $issue_type (建议检查项目配置)"
    return 1
}

# 获取Issue类型
function get_issue_type() {
    local issue_key=$1

    local response=$(smart_jira_api_call "GET" "/rest/api/3/issue/$issue_key?fields=issuetype")

    if [ $? -eq 0 ]; then
        local issue_type=$(echo "$response" | jq -r '.fields.issuetype.name')
        echo "$issue_type"
        return 0
    else
        echo "❌ 获取Issue类型失败"
        return 1
    fi
}

# 批量验证Sprint Issues类型
function validate_sprint_issues_type() {
    local issue_keys=$1

    echo "🔍 批量验证Sprint Issues类型"
    echo "=============================="

    local all_valid=true
    local invalid_issues=()
    local valid_issues=()

    # 分割Issue keys
    IFS=' ' read -ra issues <<< "$issue_keys"

    for issue_key in "${issues[@]}"; do
        if validate_issue_type "$issue_key"; then
            valid_issues+=("$issue_key")
        else
            invalid_issues+=("$issue_key")
            all_valid=false
        fi
    done

    echo ""
    echo "📊 类型验证结果:"
    echo "  ✅ 合规Issues (${#valid_issues[@]}): ${valid_issues[*]}"
    echo "  ❌ 不合规Issues (${#invalid_issues[@]}): ${invalid_issues[*]}"

    if [ "$all_valid" = "true" ]; then
        echo "🎉 所有Issues类型检查通过"
        return 0
    else
        echo "❌ 存在不合规的Issue类型"
        echo ""
        echo "💡 建议:"
        echo "  • 只允许Story和Task类型加入Sprint"
        echo "  • 检查项目Issue类型配置"
        echo "  • 使用--no-type-check跳过类型检查"
        return 1
    fi
}
```

### 3. Sprint合规性检查

```bash
# 检查整个Sprint的合规性
function validate_sprint_compliance() {
    local sprint_id=$1

    echo "🔍 检查Sprint合规性: $sprint_id"
    echo "=============================="

    # 获取Sprint中的所有Issues
    local sprint_issues=$(get_sprint_issues "$sprint_id")

    if [ -z "$sprint_issues" ]; then
        echo "⚠️ Sprint中没有Issues"
        return 0
    fi

    echo "📋 Sprint包含Issues: $sprint_issues"

    # 验证所有Issues类型
    validate_sprint_issues_type "$sprint_issues"
}

# 获取Sprint中的Issues
function get_sprint_issues() {
    local sprint_id=$1

    local response=$(smart_jira_api_call "GET" "/rest/agile/1.0/sprint/$sprint_id/issue?maxResults=100")

    if [ $? -eq 0 ]; then
        local issue_keys=$(echo "$response" | jq -r '.issues[].key' | tr '\n' ' ')
        echo "$issue_keys"
        return 0
    else
        echo "❌ 获取Sprint Issues失败"
        return 1
    fi
}
```

### 4. 智能Issue推荐

```bash
# 推荐合规的Issues
function recommend_compliant_issues() {
    local project_key=$1
    local sprint_goal=$2

    echo "🔍 推荐合规Issues: $project_key - $sprint_goal"
    echo "=========================================="

    # 搜索项目中的Story和Task
    local jql_query="project = $project_key AND issuetype in (Story, Task) AND status in (\"To Do\", \"Backlog\")"

    if [ -n "$sprint_goal" ]; then
        jql_query="$jql_query AND text ~ \"$sprint_goal\""
    fi

    echo "📋 搜索JQL: $jql_query"

    local response=$(smart_jira_api_call "GET" "/rest/api/3/search?jql=$(echo "$jql_query" | sed 's/ /%20/g')&maxResults=10")

    if [ $? -eq 0 ]; then
        local issues_count=$(echo "$response" | jq -r '.total')
        local issues=$(echo "$response" | jq -r '.issues[] | "\(.key): \(.fields.summary)"')

        echo "📊 找到 $issues_count 个合规Issues:"
        echo "$issues"

        # 提取Issue keys
        local issue_keys=$(echo "$response" | jq -r '.issues[].key' | tr '\n' ' ')
        echo "$issue_keys"
        return 0
    else
        echo "❌ 搜索合规Issues失败"
        return 1
    fi
}
```

### 5. 错误处理和用户指导

```bash
# 处理类型检查错误
function handle_type_check_error() {
    local invalid_issues=$1

    echo ""
    echo "🛠️ 类型检查错误处理"
    echo "=================="

    echo "❌ 以下Issues类型不合规:"
    for issue in $invalid_issues; do
        local issue_type=$(get_issue_type "$issue")
        echo "  • $issue ($issue_type)"
    done

    echo ""
    echo "💡 解决方案:"
    echo "  1. 使用合规的Issue类型 (Story/Task)"
    echo "  2. 重新创建合规的Issue"
    echo "  3. 使用--no-type-check跳过检查"
    echo "  4. 联系管理员调整项目配置"

    echo ""
    echo "📋 合规Issue类型说明:"
    echo "  • Story: 用户故事，描述用户需求"
    echo "  • Task: 开发任务，具体的技术实现"
    echo "  • 不允许: Sub-task, Epic, Bug, Improvement等"
}

# 生成类型检查报告
function generate_type_check_report() {
    local sprint_id=$1

    echo "📄 JIRA团队版类型检查报告"
    echo "=========================="
    echo "Sprint ID: $sprint_id"
    echo "检查时间: $(date)"
    echo ""

    validate_sprint_compliance "$sprint_id"
}
```

## 使用示例

### 基本使用
```bash
# 加载约束管理器
source jira-team-constraints.md

# 验证单个Issue类型
validate_issue_type "FC-123"

# 批量验证Issues
validate_sprint_issues_type "FC-123 FC-124 FC-125"

# 检查整个Sprint合规性
validate_sprint_compliance "456"

# 推荐合规Issues
recommend_compliant_issues "FC" "用户注册功能"
```

### 集成到快速sprint
```bash
# 在创建Sprint前进行类型检查
if [ "$ENABLE_TYPE_CHECK" = "true" ]; then
    echo "🔍 执行JIRA团队版类型检查..."
    if ! validate_sprint_issues_type "$issue_keys"; then
        echo "❌ 类型检查失败，无法创建Sprint"
        exit 1
    fi
    echo "✅ 类型检查通过"
fi
```

### 错误处理示例
```bash
# 处理类型检查错误
if ! validate_sprint_issues_type "$issue_keys"; then
    handle_type_check_error "$invalid_issues"
    exit 1
fi
```

## 配置说明

### 环境变量
```bash
# 允许的Issue类型 (可自定义)
ALLOWED_SPRINT_TYPES=("Story" "Task")

# 不允许的Issue类型
DISALLOWED_TYPES=("Sub-task" "Epic" "Bug" "Improvement" "New Feature")
```

### 项目特定配置
可以在项目目录下创建 `.jira-constraints` 文件来覆盖默认配置：
```bash
# .jira-constraints
ALLOWED_SPRINT_TYPES=("Story" "Task" "Custom-Type")
DISALLOWED_TYPES=("Sub-task" "Epic")
```

这个JIRA团队版约束管理器提供了完整的类型检查功能，确保Sprint只包含合规的Issue类型，符合JIRA团队版的最佳实践。