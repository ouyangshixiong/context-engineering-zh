# Sprint智能决策

## 🎯 核心功能
- 智能状态检测和动态映射
- Sprint继续模式智能决策
- 状态名称模式匹配和兼容性
- 项目配置自动检测

## 智能状态检测

### 1. 状态映射系统
```bash
# 完整状态检测
function complete_status_detection() {
    local project_key=$1
    local board_id=$2

    echo "🔍 完整状态检测 - 项目: $project_key"
    echo "========================================"

    # 1. 检测项目状态配置
    echo "📋 检测项目状态配置..."
    local project_statuses=$(detect_project_statuses "$project_key")

    if [ -z "$project_statuses" ]; then
        echo "❌ 无法检测项目状态"
        return 1
    fi

    echo "✅ 项目状态检测完成"

    # 2. 构建状态映射
    echo "🗺️ 构建状态映射..."
    build_status_mapping "$project_statuses"

    # 3. 保存状态ID映射
    echo "💾 保存状态ID映射..."
    save_status_ids

    echo "✅ 完整状态检测完成"
}

# 检测项目状态
function detect_project_statuses() {
    local project_key=$1

    echo "🔍 检测项目状态: $project_key"

    # 获取项目状态
    local response=$(smart_jira_api_call "GET" "/rest/api/3/project/$project_key/statuses")

    if [ $? -eq 0 ]; then
        # 解析状态信息
        local statuses=$(echo "$response" | jq -r '.[] | select(.name == "Story") | .statuses[] | .name' | tr '\n' ',' | sed 's/,$//')
        echo "📋 检测到的状态: $statuses"
        echo "$statuses"
        return 0
    else
        echo "❌ 无法获取项目状态"
        return 1
    fi
}

# 构建状态映射
function build_status_mapping() {
    local statuses=$1

    echo "🗺️ 构建状态映射..."

    # 标准状态映射
    declare -A status_patterns=(
        ["To Do"]="To Do|待办|待处理"
        ["Ready for Dev"]="Ready for Dev|准备开发|开发就绪"
        ["In Progress"]="In Progress|进行中|开发中"
        ["Ready for Test"]="Ready for Test|准备测试|测试就绪"
        ["Testing"]="Testing|测试中|验证中"
        ["Ready for Release"]="Ready for Release|准备发布|发布就绪"
        ["Done"]="Done|完成|已完成"
    )

    # 状态ID映射
    declare -A status_ids

    IFS=',' read -ra status_array <<< "$statuses"

    for detected_status in "${status_array[@]}"; do
        echo "  🔍 匹配状态: $detected_status"

        for standard_status in "${!status_patterns[@]}"; do
            local patterns=${status_patterns[$standard_status]}
            IFS='|' read -ra pattern_array <<< "$patterns"

            for pattern in "${pattern_array[@]}"; do
                if echo "$detected_status" | grep -qi "$pattern"; then
                    echo "    ✅ 匹配到标准状态: $standard_status"

                    # 获取状态ID
                    local status_id=$(get_status_id "$detected_status")
                    if [ -n "$status_id" ]; then
                        status_ids[$standard_status]="$status_id"
                        echo "      📍 状态ID: $status_id"
                    fi
                    break 2
                fi
            done
        done
    done

    # 保存状态映射
    for status in "${!status_ids[@]}"; do
        local var_name=$(echo "$status" | tr '[:lower:]' '[:upper:]' | tr ' ' '_')
        echo "${var_name}_ID=${status_ids[$status]}" >> status_ids.env
    done

    echo "✅ 状态映射构建完成"
}

# 获取状态ID
function get_status_id() {
    local status_name=$1

    # 这里需要实际的JIRA API调用来获取状态ID
    # 暂时返回模拟ID
    case "$status_name" in
        *"To Do"*)
            echo "10001"
            ;;
        *"Ready for Dev"*)
            echo "10002"
            ;;
        *"In Progress"*)
            echo "10003"
            ;;
        *"Ready for Test"*)
            echo "10004"
            ;;
        *"Testing"*)
            echo "10005"
            ;;
        *"Ready for Release"*)
            echo "10006"
            ;;
        *"Done"*)
            echo "10007"
            ;;
        *)
            echo ""
            ;;
    esac
}

# 保存状态ID
function save_status_ids() {
    echo "💾 保存状态ID映射..."

    # 创建状态ID环境文件
    cat > status_ids.env << EOF
# 状态ID映射 - 自动生成
TO_DO_ID=10001
READY_FOR_DEV_ID=10002
IN_PROGRESS_ID=10003
READY_FOR_TEST_ID=10004
TESTING_ID=10005
READY_FOR_RELEASE_ID=10006
DONE_ID=10007

# 加载状态映射
if [ -f "status_ids.env" ]; then
    source status_ids.env
    echo "✅ 状态ID映射已加载"
fi
EOF

    echo "✅ 状态ID映射已保存"
}
```

### 2. 状态名称模式匹配
```bash
# 智能状态名称匹配
function smart_status_name_matching() {
    local detected_status=$1

    echo "🔍 智能状态名称匹配: $detected_status"

    # 状态名称模式库
    declare -A status_patterns=(
        ["To Do"]="^To Do$|^待办$|^待处理$|^Backlog$"
        ["Ready for Dev"]="^Ready for Dev$|^准备开发$|^开发就绪$|^Ready$"
        ["In Progress"]="^In Progress$|^进行中$|^开发中$|^Progress$"
        ["Ready for Test"]="^Ready for Test$|^准备测试$|^测试就绪$|^Ready for QA$"
        ["Testing"]="^Testing$|^测试中$|^验证中$|^QA$"
        ["Ready for Release"]="^Ready for Release$|^准备发布$|^发布就绪$|^Ready$"
        ["Done"]="^Done$|^完成$|^已完成$|^Closed$"
    )

    for standard_status in "${!status_patterns[@]}"; do
        local pattern=${status_patterns[$standard_status]}

        if echo "$detected_status" | grep -qiE "$pattern"; then
            echo "✅ 匹配到标准状态: $standard_status"
            echo "$standard_status"
            return 0
        fi
    done

    echo "❌ 无法匹配到标准状态"
    return 1
}

# 状态兼容性检查
function check_status_compatibility() {
    local project_key=$1

    echo "🔍 检查状态兼容性: $project_key"

    # 检测项目状态
    local project_statuses=$(detect_project_statuses "$project_key")

    if [ -z "$project_statuses" ]; then
        echo "❌ 无法检测项目状态"
        return 1
    fi

    # 检查必需状态
    local required_statuses=("To Do" "In Progress" "Done")
    local missing_statuses=()

    IFS=',' read -ra status_array <<< "$project_statuses"

    for required_status in "${required_statuses[@]}"; do
        local found=false

        for detected_status in "${status_array[@]}"; do
            local matched_status=$(smart_status_name_matching "$detected_status")
            if [ "$matched_status" = "$required_status" ]; then
                found=true
                break
            fi
        done

        if [ "$found" = "false" ]; then
            missing_statuses+=("$required_status")
        fi
    done

    if [ ${#missing_statuses[@]} -eq 0 ]; then
        echo "✅ 状态兼容性检查通过"
        return 0
    else
        echo "❌ 缺少必需状态: ${missing_statuses[*]}"
        return 1
    fi
}
```

## Sprint智能决策

### 1. 智能Sprint决策
```bash
# 智能Sprint决策引擎
function smart_sprint_decision() {
    local project_key=$1
    local sprint_goal=$2
    local force_new=${3:-false}

    echo "🤖 智能Sprint决策引擎启动"
    echo "================================"
    echo "项目: $project_key"
    echo "目标: $sprint_goal"
    echo "强制新建: $force_new"

    # 如果强制新建，直接创建新Sprint
    if [ "$force_new" = "true" ]; then
        echo "🚀 强制创建新Sprint"
        echo "NEW"
        return 0
    fi

    # 检测现有活跃Sprint
    echo "🔍 检测现有活跃Sprint..."
    local active_sprints=$(detect_active_sprints "$project_key")

    if [ -n "$active_sprints" ]; then
        echo "📋 发现活跃Sprint:"
        echo "$active_sprints"

        # 分析现有Sprint状态
        local sprint_analysis=$(analyze_sprint_for_continuation "$active_sprints" "$sprint_goal")

        if [ "$sprint_analysis" = "CONTINUE" ]; then
            local sprint_name=$(echo "$active_sprints" | head -1 | cut -d'|' -f2)
            echo "🔄 决策: 继续现有Sprint - $sprint_name"
            echo "CONTINUE:$sprint_name"
            return 0
        else
            echo "🚀 决策: 创建新Sprint (现有Sprint不适用)"
            echo "NEW"
            return 0
        fi
    else
        echo "🚀 决策: 创建新Sprint (无活跃Sprint)"
        echo "NEW"
        return 0
    fi
}

# 检测活跃Sprint
function detect_active_sprints() {
    local project_key=$1

    echo "🔍 检测活跃Sprint: $project_key"

    # 获取活跃Sprint
    local response=$(smart_jira_api_call "GET" "/rest/agile/1.0/board?projectKeyOrId=$project_key")

    if [ $? -eq 0 ]; then
        local board_id=$(echo "$response" | jq -r '.values[0].id')

        if [ -n "$board_id" ] && [ "$board_id" != "null" ]; then
            # 获取活跃Sprint
            local sprint_response=$(smart_jira_api_call "GET" "/rest/agile/1.0/board/$board_id/sprint?state=active")

            if [ $? -eq 0 ]; then
                local sprints=$(echo "$sprint_response" | jq -r '.values[] | "\(.id)|\(.name)|\(.state)"')

                if [ -n "$sprints" ]; then
                    echo "📋 活跃Sprint:"
                    echo "$sprints"
                    echo "$sprints"
                    return 0
                fi
            fi
        fi
    fi

    echo "❌ 未找到活跃Sprint"
    return 1
}

# 分析Sprint继续可行性
function analyze_sprint_for_continuation() {
    local active_sprints=$1
    local new_goal=$2

    echo "📊 分析Sprint继续可行性..."

    # 获取第一个活跃Sprint
    local first_sprint=$(echo "$active_sprints" | head -1)
    local sprint_id=$(echo "$first_sprint" | cut -d'|' -f1)
    local sprint_name=$(echo "$first_sprint" | cut -d'|' -f2)

    echo "  🔍 分析Sprint: $sprint_name ($sprint_id)"

    # 获取Sprint中的Issue
    local sprint_issues=$(get_sprint_details "$sprint_id")

    if [ -z "$sprint_issues" ]; then
        echo "  ❌ Sprint中没有Issue"
        echo "NEW"
        return 0
    fi

    # 分析Issue状态
    local total_issues=0
    local done_issues=0
    local in_progress_issues=0

    for issue in $sprint_issues; do
        local status=$(get_issue_status "$issue")

        case "$status" in
            "Done")
                ((done_issues++))
                ;;
            "In Progress"|"Testing")
                ((in_progress_issues++))
                ;;
        esac
        ((total_issues++))
    done

    echo "  📊 Sprint状态统计:"
    echo "    • 总Issue数: $total_issues"
    echo "    • 已完成: $done_issues"
    echo "    • 进行中: $in_progress_issues"
    echo "    • 完成率: $((done_issues * 100 / total_issues))%"

    # 决策逻辑
    if [ $total_issues -eq 0 ]; then
        echo "  🚀 空Sprint，可以继续"
        echo "CONTINUE"
    elif [ $done_issues -eq $total_issues ]; then
        echo "  🚀 Sprint已完成，可以继续"
        echo "CONTINUE"
    elif [ $in_progress_issues -gt 0 ] && [ $((done_issues * 100 / total_issues)) -lt 80 ]; then
        echo "  ⚠️ Sprint进行中且完成率较低，建议完成后再继续"
        echo "NEW"
    else
        echo "  🚀 Sprint状态良好，可以继续"
        echo "CONTINUE"
    fi
}
```

### 2. Sprint继续模式
```bash
# 获取Sprint详情
function get_sprint_details() {
    local sprint_id=$1

    echo "📋 获取Sprint详情: $sprint_id"

    # 获取Sprint中的Issue
    local response=$(smart_jira_api_call "GET" "/rest/agile/1.0/sprint/$sprint_id/issue")

    if [ $? -eq 0 ]; then
        local issues=$(echo "$response" | jq -r '.issues[].key')

        if [ -n "$issues" ]; then
            echo "📋 Sprint中的Issue:"
            echo "$issues"
            echo "$issues"
            return 0
        fi
    fi

    echo "❌ 无法获取Sprint详情"
    return 1
}

# 继续模式并行执行引擎
function parallel_execution_engine_continue() {
    local sprint_name=$1
    local project_key=$2
    local goal=$3

    echo "🔄 继续模式并行执行引擎启动"

    # 获取Sprint中的Issue
    local sprint_issues=$(get_sprint_details "$project_key" "$sprint_name")

    echo "📋 处理Sprint中的Issue:"
    echo "$sprint_issues"

    # 并行处理所有Issue
    local issue_keys=$(echo "$sprint_issues" | jq -r '.key')

    for issue_key in $issue_keys; do
        echo "  🤖 并行处理: $issue_key"

        # 并行执行开发
        development_agent "$issue_key" "Development" &

        # 并行执行质量验证
        quality_agent "$issue_key" "Quality" &
    done

    # 等待所有并行任务完成
    wait

    echo "✅ 继续模式并行执行完成"
}

# 继续模式串行执行引擎
function serial_execution_engine_continue() {
    local sprint_name=$1
    local project_key=$2
    local goal=$3

    echo "  🔄 继续模式串行执行"

    # 获取Sprint中的Issue
    local sprint_issues=$(get_sprint_details "$project_key" "$sprint_name")

    echo "📋 处理Sprint中的Issue:"
    echo "$sprint_issues"

    # 串行处理所有Issue
    local issue_keys=$(echo "$sprint_issues" | jq -r '.key')

    for issue_key in $issue_keys; do
        echo "  🤖 处理: $issue_key"

        # 串行执行开发
        development_agent "$issue_key" "Development"

        # 串行执行质量验证
        quality_agent "$issue_key" "Quality"
    done

    echo "✅ 继续模式串行执行完成"
}
```

## 使用示例

### 基本使用
```bash
# 加载Sprint智能决策
source sprint-intelligence.md

# 完整状态检测
complete_status_detection "FC"

# 智能Sprint决策
local decision=$(smart_sprint_decision "FC" "实现用户注册功能" "false")

if [[ "$decision" == "CONTINUE:*" ]]; then
    local existing_sprint="${decision#CONTINUE:}"
    echo "继续现有Sprint: $existing_sprint"
else
    echo "创建新Sprint"
fi
```

### 状态兼容性检查
```bash
# 检查状态兼容性
check_status_compatibility "FC"

# 智能状态名称匹配
local matched_status=$(smart_status_name_matching "进行中")
echo "匹配状态: $matched_status"
```

### Sprint继续模式
```bash
# 检测活跃Sprint
local active_sprints=$(detect_active_sprints "FC")

# 分析继续可行性
local analysis=$(analyze_sprint_for_continuation "$active_sprints" "新目标")

# 继续模式执行
parallel_execution_engine_continue "现有Sprint名称" "FC" "继续开发目标"
```

这个Sprint智能决策模块整合了状态检测、Sprint决策和继续模式功能，提供了智能的Sprint管理和决策能力。