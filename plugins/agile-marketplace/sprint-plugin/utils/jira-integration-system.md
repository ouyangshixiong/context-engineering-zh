# JIRA集成系统

## 🎯 核心功能
- JIRA评论系统集成
- 任务状态实时跟踪
- 智能状态流转管理
- 进度同步和报告生成

## JIRA评论系统集成

### 1. 评论管理
```bash
# 添加JIRA评论
function add_jira_comment() {
    local issue_key=$1
    local comment_body=$2

    echo "💬 添加JIRA评论: $issue_key"

    # 构建评论数据
    local comment_data=$(cat << EOF
{
    "body": {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "$comment_body"
                    }
                ]
            }
        ]
    }
}
EOF
)

    # 调用JIRA API
    local response=$(curl -s -u "$EMAIL:$API_TOKEN" \
        -X POST \
        -H "Content-Type: application/json" \
        "https://$JIRA_DOMAIN/rest/api/3/issue/$issue_key/comment" \
        -d "$comment_data")

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        echo "✅ 评论添加成功"
        return 0
    else
        echo "❌ 评论添加失败"
        echo "错误响应: $response"
        return 1
    fi
}

# 获取JIRA评论
function get_jira_comments() {
    local issue_key=$1

    echo "📋 获取JIRA评论: $issue_key"

    # 调用JIRA API获取评论
    local response=$(curl -s -u "$EMAIL:$API_TOKEN" \
        -X GET \
        -H "Accept: application/json" \
        "https://$JIRA_DOMAIN/rest/api/3/issue/$issue_key/comment")

    if echo "$response" | jq -e '.comments' > /dev/null 2>&1; then
        local comments=$(echo "$response" | jq -r '.comments[] | "\(.id)|\(.author.displayName)|\(.body.content[0].content[0].text)"')

        if [ -n "$comments" ]; then
            echo "📝 评论列表:"
            echo "$comments"
            echo "$comments"
            return 0
        else
            echo "⚠️ 无评论"
            return 1
        fi
    else
        echo "❌ 获取评论失败"
        return 1
    fi
}

# 获取最新评论
function get_latest_comment() {
    local issue_key=$1

    echo "🔍 获取最新评论: $issue_key"

    local comments=$(get_jira_comments "$issue_key")

    if [ -n "$comments" ]; then
        local latest_comment=$(echo "$comments" | tail -1)
        local comment_text=$(echo "$latest_comment" | cut -d'|' -f3)

        echo "📝 最新评论: $comment_text"
        echo "$comment_text"
    else
        echo "⚠️ 无评论"
        echo ""
    fi
}

# 添加进度评论
function add_progress_comment() {
    local issue_key=$1
    local progress_type=$2
    local details=$3

    echo "📊 添加进度评论: $issue_key - $progress_type"

    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local comment_body=""

    case "$progress_type" in
        "requirement_clarification")
            comment_body="📝 需求澄清完成 - $timestamp\n$details"
            ;;
        "development_start")
            comment_body="🔧 开发开始 - $timestamp\n$details"
            ;;
        "development_complete")
            comment_body="✅ 开发完成 - $timestamp\n$details"
            ;;
        "testing_start")
            comment_body="🧪 测试开始 - $timestamp\n$details"
            ;;
        "testing_complete")
            comment_body="🔍 测试完成 - $timestamp\n$details"
            ;;
        "verification_failed")
            comment_body="❌ 验证不通过 - $timestamp\n$details"
            ;;
        "verification_passed")
            comment_body="✅ 验证通过 - $timestamp\n$details"
            ;;
        "blocked")
            comment_body="⚠️ 任务阻塞 - $timestamp\n$details"
            ;;
        "unblocked")
            comment_body="🔄 任务解除阻塞 - $timestamp\n$details"
            ;;
        *)
            comment_body="📋 进度更新 - $timestamp\n$details"
            ;;
    esac

    add_jira_comment "$issue_key" "$comment_body"
}
```

### 2. 智能评论分析
```bash
# 分析评论内容
function analyze_comment_content() {
    local comment_text=$1

    echo "🔍 分析评论内容"

    local analysis_result=""

    # 检测进度关键词
    if echo "$comment_text" | grep -qi -E "(完成|完成|finished|done)"; then
        analysis_result="progress_complete"
    elif echo "$comment_text" | grep -qi -E "(开始|启动|started|begin)"; then
        analysis_result="progress_started"
    elif echo "$comment_text" | grep -qi -E "(阻塞|卡住|blocked|stuck)"; then
        analysis_result="progress_blocked"
    elif echo "$comment_text" | grep -qi -E "(问题|错误|issue|error)"; then
        analysis_result="progress_issue"
    elif echo "$comment_text" | grep -qi -E "(成功|通过|success|passed)"; then
        analysis_result="progress_success"
    elif echo "$comment_text" | grep -qi -E "(失败|不通过|failed|rejected)"; then
        analysis_result="progress_failed"
    else
        analysis_result="progress_update"
    fi

    echo "📊 评论分析结果: $analysis_result"
    echo "$analysis_result"
}

# 提取评论中的关键信息
function extract_key_info_from_comment() {
    local comment_text=$1

    echo "🔍 提取评论关键信息"

    local key_info=()

    # 提取时间信息
    local time_pattern="[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}"
    local timestamp=$(echo "$comment_text" | grep -oE "$time_pattern" | head -1)

    if [ -n "$timestamp" ]; then
        key_info+=("timestamp:$timestamp")
    fi

    # 提取状态信息
    if echo "$comment_text" | grep -qi "需求澄清"; then
        key_info+=("stage:requirement_clarification")
    elif echo "$comment_text" | grep -qi "开发"; then
        key_info+=("stage:development")
    elif echo "$comment_text" | grep -qi "测试"; then
        key_info+=("stage:testing")
    elif echo "$comment_text" | grep -qi "验证"; then
        key_info+=("stage:verification")
    fi

    # 提取结果信息
    if echo "$comment_text" | grep -qi -E "(完成|成功|通过)"; then
        key_info+=("result:success")
    elif echo "$comment_text" | grep -qi -E "(失败|错误|不通过)"; then
        key_info+=("result:failure")
    fi

    echo "📋 提取的关键信息: ${key_info[*]}"
    echo "${key_info[@]}"
}
```

## 任务状态跟踪系统

### 1. 状态管理
```bash
# 获取任务状态
function get_issue_status() {
    local issue_key=$1

    echo "🔍 获取任务状态: $issue_key"

    # 调用JIRA API获取任务信息
    local response=$(curl -s -u "$EMAIL:$API_TOKEN" \
        -X GET \
        -H "Accept: application/json" \
        "https://$JIRA_DOMAIN/rest/api/3/issue/$issue_key")

    if echo "$response" | jq -e '.fields.status.name' > /dev/null 2>&1; then
        local status=$(echo "$response" | jq -r '.fields.status.name')
        echo "📊 任务状态: $status"
        echo "$status"
        return 0
    else
        echo "❌ 获取任务状态失败"
        return 1
    fi
}

# 获取任务优先级
function get_issue_priority() {
    local issue_key=$1

    echo "🔍 获取任务优先级: $issue_key"

    local response=$(curl -s -u "$EMAIL:$API_TOKEN" \
        -X GET \
        -H "Accept: application/json" \
        "https://$JIRA_DOMAIN/rest/api/3/issue/$issue_key")

    if echo "$response" | jq -e '.fields.priority.name' > /dev/null 2>&1; then
        local priority=$(echo "$response" | jq -r '.fields.priority.name')
        echo "📊 任务优先级: $priority"
        echo "$priority"
        return 0
    else
        echo "❌ 获取任务优先级失败"
        return 1
    fi
}

# 获取任务摘要
function get_issue_summary() {
    local issue_key=$1

    echo "🔍 获取任务摘要: $issue_key"

    local response=$(curl -s -u "$EMAIL:$API_TOKEN" \
        -X GET \
        -H "Accept: application/json" \
        "https://$JIRA_DOMAIN/rest/api/3/issue/$issue_key")

    if echo "$response" | jq -e '.fields.summary' > /dev/null 2>&1; then
        local summary=$(echo "$response" | jq -r '.fields.summary')
        echo "📋 任务摘要: $summary"
        echo "$summary"
        return 0
    else
        echo "❌ 获取任务摘要失败"
        return 1
    fi
}

# 更新任务状态
function update_issue_status() {
    local issue_key=$1
    local target_status=$2

    echo "🔄 更新任务状态: $issue_key -> $target_status"

    # 获取状态ID
    local status_id=$(get_status_id "$target_status")

    if [ -z "$status_id" ]; then
        echo "❌ 无法获取状态ID: $target_status"
        return 1
    fi

    # 构建更新数据
    local update_data=$(cat << EOF
{
    "fields": {
        "status": {
            "id": "$status_id"
        }
    }
}
EOF
)

    # 调用JIRA API更新状态
    local response=$(curl -s -u "$EMAIL:$API_TOKEN" \
        -X PUT \
        -H "Content-Type: application/json" \
        "https://$JIRA_DOMAIN/rest/api/3/issue/$issue_key" \
        -d "$update_data")

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        echo "✅ 状态更新成功: $target_status"

        # 添加状态更新评论
        add_progress_comment "$issue_key" "status_update" "状态已更新为: $target_status"

        return 0
    else
        echo "❌ 状态更新失败"
        echo "错误响应: $response"
        return 1
    fi
}
```

### 2. 状态流转管理
```bash
# 智能状态流转
function smart_status_transition() {
    local issue_key=$1
    local current_status=$2
    local target_status=$3

    echo "🔄 智能状态流转: $current_status -> $target_status"

    # 检查状态流转是否允许
    if ! validate_status_transition "$current_status" "$target_status"; then
        echo "❌ 状态流转不允许: $current_status -> $target_status"
        return 1
    fi

    # 执行状态更新
    if update_issue_status "$issue_key" "$target_status"; then
        echo "✅ 状态流转成功"

        # 记录状态流转历史
        record_status_transition "$issue_key" "$current_status" "$target_status"

        return 0
    else
        echo "❌ 状态流转失败"
        return 1
    fi
}

# 验证状态流转
function validate_status_transition() {
    local from_status=$1
    local to_status=$2

    echo "🔍 验证状态流转: $from_status -> $to_status"

    # 定义允许的状态流转
    declare -A allowed_transitions=(
        ["To Do"]="Ready for Dev"
        ["Ready for Dev"]="In Progress"
        ["In Progress"]="Ready for Test"
        ["Ready for Test"]="Testing"
        ["Testing"]="Ready for Release"
        ["Ready for Release"]="Done"
        ["Testing"]="Ready for Dev"  # 验证不通过回退
        ["Ready for Release"]="Ready for Dev"  # 发布前回退
    )

    local allowed_targets=${allowed_transitions[$from_status]}

    if [ -n "$allowed_targets" ] && echo "$allowed_targets" | grep -q "$to_status"; then
        echo "✅ 状态流转允许"
        return 0
    else
        echo "❌ 状态流转不允许"
        return 1
    fi
}

# 记录状态流转历史
function record_status_transition() {
    local issue_key=$1
    local from_status=$2
    local to_status=$3

    echo "📚 记录状态流转历史: $issue_key"

    local history_file="jira_status_history.txt"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "$timestamp|$issue_key|$from_status|$to_status" >> "$history_file"

    echo "✅ 状态流转历史已记录"
}

# 获取状态流转历史
function get_status_transition_history() {
    local issue_key=$1

    echo "📋 获取状态流转历史: $issue_key"

    local history_file="jira_status_history.txt"

    if [ -f "$history_file" ]; then
        local history=$(grep "^.*|$issue_key|" "$history_file" 2>/dev/null)

        if [ -n "$history" ]; then
            echo "📊 状态流转历史:"
            echo "$history"
            echo "$history"
        else
            echo "⚠️ 无状态流转历史"
        fi
    else
        echo "⚠️ 状态历史文件不存在"
    fi
}
```

## 进度同步和报告系统

### 1. 进度跟踪
```bash
# 跟踪任务进度
function track_task_progress() {
    local issue_key=$1

    echo "📊 跟踪任务进度: $issue_key"

    # 获取当前状态
    local current_status=$(get_issue_status "$issue_key")
    local summary=$(get_issue_summary "$issue_key")

    echo "📋 任务信息:"
    echo "  • 任务: $issue_key"
    echo "  • 摘要: $summary"
    echo "  • 状态: $current_status"

    # 获取最新评论
    local latest_comment=$(get_latest_comment "$issue_key")

    if [ -n "$latest_comment" ]; then
        echo "📝 最新评论: $latest_comment"
    fi

    # 分析进度
    local progress_analysis=$(analyze_task_progress "$current_status" "$latest_comment")

    echo "📊 进度分析: $progress_analysis"

    # 生成进度报告
    generate_progress_report "$issue_key" "$current_status" "$progress_analysis"
}

# 分析任务进度
function analyze_task_progress() {
    local status=$1
    local latest_comment=$2

    echo "🔍 分析任务进度"

    local progress_level=0

    # 基于状态判断进度
    case "$status" in
        "To Do")
            progress_level=0
            ;;
        "Ready for Dev")
            progress_level=10
            ;;
        "In Progress")
            progress_level=30
            ;;
        "Ready for Test")
            progress_level=60
            ;;
        "Testing")
            progress_level=80
            ;;
        "Ready for Release")
            progress_level=90
            ;;
        "Done")
            progress_level=100
            ;;
        *)
            progress_level=0
            ;;
    esac

    # 基于评论调整进度
    if [ -n "$latest_comment" ]; then
        local comment_analysis=$(analyze_comment_content "$latest_comment")

        case "$comment_analysis" in
            "progress_complete")
                progress_level=$((progress_level + 10))
                ;;
            "progress_blocked")
                progress_level=$((progress_level - 20))
                ;;
            "progress_issue")
                progress_level=$((progress_level - 10))
                ;;
        esac
    fi

    # 确保进度在0-100之间
    if [ $progress_level -lt 0 ]; then
        progress_level=0
    elif [ $progress_level -gt 100 ]; then
        progress_level=100
    fi

    echo "📊 进度级别: $progress_level%"
    echo "$progress_level"
}

# 生成进度报告
function generate_progress_report() {
    local issue_key=$1
    local status=$2
    local progress_level=$3

    echo "📄 生成进度报告: $issue_key"

    local report_file="progress_reports/${issue_key}_progress_report.md"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "progress_reports"

    cat > "$report_file" << EOF
# 进度报告 - $issue_key

## 📅 报告时间
$timestamp

## 📊 进度概览
- **当前状态**: $status
- **进度级别**: $progress_level%
- **最后更新**: $timestamp

## 📋 状态历史
$(get_status_transition_history "$issue_key")

## 📝 最新活动
$(get_latest_comment "$issue_key")

## 🎯 下一步行动
$(generate_next_actions "$status" "$progress_level")

EOF

    echo "✅ 进度报告已生成: $report_file"
}

# 生成下一步行动
function generate_next_actions() {
    local status=$1
    local progress_level=$2

    echo "🎯 生成下一步行动"

    local next_actions=""

    case "$status" in
        "To Do")
            next_actions="- 进行需求澄清\n- 创建技术方案\n- 分解开发任务"
            ;;
        "Ready for Dev")
            next_actions="- 启动开发工作\n- 设置开发环境\n- 编写初始代码"
            ;;
        "In Progress")
            next_actions="- 继续开发工作\n- 定期提交代码\n- 进行代码审查"
            ;;
        "Ready for Test")
            next_actions="- 准备测试环境\n- 编写测试用例\n- 执行功能测试"
            ;;
        "Testing")
            next_actions="- 执行全面测试\n- 记录测试结果\n- 修复发现的问题"
            ;;
        "Ready for Release")
            next_actions="- 准备发布文档\n- 进行最终验证\n- 安排发布时间"
            ;;
        "Done")
            next_actions="- 进行项目总结\n- 收集用户反馈\n- 规划后续改进"
            ;;
        *)
            next_actions="- 检查任务状态\n- 分析当前问题\n- 制定解决方案"
            ;;
    esac

    echo "$next_actions"
}
```

### 2. 批量进度同步
```bash
# 批量同步Sprint进度
function batch_sync_sprint_progress() {
    local sprint_id=$1

    echo "🔄 批量同步Sprint进度: $sprint_id"

    # 获取Sprint中的所有任务
    local issues=$(get_sprint_issues "$sprint_id")

    if [ -z "$issues" ]; then
        echo "❌ 无法获取Sprint任务"
        return 1
    fi

    echo "📋 同步任务列表:"
    echo "$issues"

    local synced_count=0
    local failed_count=0

    # 同步每个任务的进度
    for issue in $issues; do
        echo ""
        echo "🔄 同步任务: $issue"

        if track_task_progress "$issue"; then
            ((synced_count++))
            echo "✅ 同步成功"
        else
            ((failed_count++))
            echo "❌ 同步失败"
        fi
    done

    echo ""
    echo "📊 批量同步结果:"
    echo "  • 成功: $synced_count"
    echo "  • 失败: $failed_count"
    echo "  • 总计: $((synced_count + failed_count))"

    if [ $failed_count -eq 0 ]; then
        echo "✅ 所有任务同步成功"
        return 0
    else
        echo "⚠️ 部分任务同步失败"
        return 1
    fi
}

# 生成Sprint进度报告
function generate_sprint_progress_report() {
    local sprint_id=$1

    echo "📄 生成Sprint进度报告: $sprint_id"

    local report_file="progress_reports/sprint_${sprint_id}_progress_report.md"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # 获取Sprint信息
    local sprint_info=$(get_sprint_info "$sprint_id")
    local issues=$(get_sprint_issues "$sprint_id")

    cat > "$report_file" << EOF
# Sprint进度报告 - $sprint_id

## 📅 报告时间
$timestamp

## 📋 Sprint信息
$sprint_info

## 📊 任务统计

EOF

    # 统计任务状态
    local todo_count=0
    local ready_for_dev_count=0
    local in_progress_count=0
    local ready_for_test_count=0
    local testing_count=0
    local ready_for_release_count=0
    local done_count=0

    for issue in $issues; do
        local status=$(get_issue_status "$issue")

        case "$status" in
            "To Do")
                ((todo_count++))
                ;;
            "Ready for Dev")
                ((ready_for_dev_count++))
                ;;
            "In Progress")
                ((in_progress_count++))
                ;;
            "Ready for Test")
                ((ready_for_test_count++))
                ;;
            "Testing")
                ((testing_count++))
                ;;
            "Ready for Release")
                ((ready_for_release_count++))
                ;;
            "Done")
                ((done_count++))
                ;;
        esac
    done

    local total_count=$((todo_count + ready_for_dev_count + in_progress_count + ready_for_test_count + testing_count + ready_for_release_count + done_count))

    cat >> "$report_file" << EOF
- **总任务数**: $total_count
- **待办**: $todo_count
- **准备开发**: $ready_for_dev_count
- **进行中**: $in_progress_count
- **准备测试**: $ready_for_test_count
- **测试中**: $testing_count
- **准备发布**: $ready_for_release_count
- **已完成**: $done_count

## 📈 完成率
- **完成率**: $((done_count * 100 / total_count))%

## 🎯 关键任务
$(get_key_tasks "$sprint_id")

## ⚠️ 阻塞任务
$(get_blocked_tasks "$sprint_id")

EOF

    echo "✅ Sprint进度报告已生成: $report_file"
}
```

## Sprint Story状态验证系统

### 1. Story状态验证
```bash
# 验证Sprint中所有Story状态
function validate_sprint_stories_status() {
    local sprint_id=$1

    echo "🔍 验证Sprint Story状态: $sprint_id"
    echo "========================================"

    # 获取Sprint中的所有Story
    local stories=$(get_sprint_stories "$sprint_id")

    if [ -z "$stories" ]; then
        echo "❌ 无法获取Sprint中的Story"
        return 1
    fi

    echo "📋 Sprint Story列表:"
    echo "$stories"

    local all_done=true
    local blocked_stories=()
    local done_stories=()

    # 检查每个Story的状态
    for story in $stories; do
        echo ""
        echo "🔍 检查Story: $story"

        local status=$(get_issue_status "$story")
        local summary=$(get_issue_summary "$story")

        echo "  📋 摘要: $summary"
        echo "  📊 状态: $status"

        if [ "$status" = "Done" ]; then
            echo "  ✅ Story已完成"
            done_stories+=("$story")
        else
            echo "  ❌ Story未完成 - 当前状态: $status"
            all_done=false
            blocked_stories+=("$story|$status|$summary")
        fi
    done

    echo ""
    echo "📊 验证结果:"
    echo "  • 总Story数: ${#stories[@]}"
    echo "  • 已完成: ${#done_stories[@]}"
    echo "  • 未完成: ${#blocked_stories[@]}"

    if [ "$all_done" = "true" ]; then
        echo "✅ 所有Story都已完成，可以关闭Sprint"
        return 0
    else
        echo "❌ 存在未完成的Story，无法关闭Sprint"
        echo ""
        echo "⚠️ 阻塞Story列表:"
        for blocked in "${blocked_stories[@]}"; do
            local story_key=$(echo "$blocked" | cut -d'|' -f1)
            local status=$(echo "$blocked" | cut -d'|' -f2)
            local summary=$(echo "$blocked" | cut -d'|' -f3)
            echo "  • $story_key - $status - $summary"
        done
        return 1
    fi
}

# 获取Sprint中的Story
function get_sprint_stories() {
    local sprint_id=$1

    echo "📋 获取Sprint中的Story: $sprint_id"

    # 获取Sprint中的所有Issue
    local response=$(smart_jira_api_call "GET" "/rest/agile/1.0/sprint/$sprint_id/issue")

    if [ $? -eq 0 ]; then
        # 过滤出Story类型的Issue
        local stories=$(echo "$response" | jq -r '.issues[] | select(.fields.issuetype.name == "Story") | .key')

        if [ -n "$stories" ]; then
            echo "📋 Sprint Story列表:"
            echo "$stories"
            echo "$stories"
            return 0
        else
            echo "⚠️ Sprint中没有Story"
            return 1
        fi
    else
        echo "❌ 无法获取Sprint Issue"
        return 1
    fi
}

# 生成Story状态验证报告
function generate_story_validation_report() {
    local sprint_id=$1

    echo "📄 生成Story状态验证报告: $sprint_id"

    local report_file="validation_reports/sprint_${sprint_id}_story_validation.md"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "validation_reports"

    # 获取Sprint信息
    local sprint_info=$(get_sprint_info "$sprint_id")
    local stories=$(get_sprint_stories "$sprint_id")

    cat > "$report_file" << EOF
# Sprint Story状态验证报告 - $sprint_id

## 📅 验证时间
$timestamp

## 📋 Sprint信息
$sprint_info

## 📊 Story状态概览

EOF

    local done_count=0
    local blocked_count=0
    local total_count=0

    # 统计Story状态
    for story in $stories; do
        local status=$(get_issue_status "$story")
        local summary=$(get_issue_summary "$story")

        if [ "$status" = "Done" ]; then
            ((done_count++))
            cat >> "$report_file" << EOF
### ✅ $story - $summary
- **状态**: $status
- **验证结果**: 已完成

EOF
        else
            ((blocked_count++))
            cat >> "$report_file" << EOF
### ❌ $story - $summary
- **状态**: $status
- **验证结果**: 未完成
- **建议行动**: 需要将状态更新为Done

EOF
        fi
        ((total_count++))
    done

    cat >> "$report_file" << EOF
## 📈 验证总结

- **总Story数**: $total_count
- **已完成**: $done_count
- **未完成**: $blocked_count
- **完成率**: $((done_count * 100 / total_count))%

## 🎯 建议

EOF

    if [ $blocked_count -eq 0 ]; then
        cat >> "$report_file" << EOF
✅ 所有Story都已完成，可以安全关闭Sprint。

EOF
    else
        cat >> "$report_file" << EOF
⚠️ 存在 $blocked_count 个未完成的Story，建议先完成这些Story再关闭Sprint。

### 阻塞Story处理建议:
1. 检查每个阻塞Story的当前状态
2. 分析阻塞原因并制定解决方案
3. 更新Story状态为Done
4. 重新验证Sprint状态

EOF
    fi

    echo "✅ Story状态验证报告已生成: $report_file"
}

# 智能Sprint关闭验证
function smart_sprint_closure_validation() {
    local sprint_id=$1

    echo "🤖 智能Sprint关闭验证: $sprint_id"
    echo "========================================"

    # 验证Story状态
    if validate_sprint_stories_status "$sprint_id"; then
        echo ""
        echo "✅ Sprint关闭验证通过"
        echo "🎯 建议: 可以安全关闭Sprint"

        # 生成验证报告
        generate_story_validation_report "$sprint_id"

        return 0
    else
        echo ""
        echo "❌ Sprint关闭验证失败"
        echo "🎯 建议: 先完成所有Story再关闭Sprint"

        # 生成验证报告
        generate_story_validation_report "$sprint_id"

        return 1
    fi
}
```

## 使用示例

### 基本使用
```bash
# 加载JIRA集成系统
source jira-integration-system.md

# 添加评论
add_jira_comment "FC-123" "需求澄清完成，开始技术方案设计"

# 获取任务状态
get_issue_status "FC-123"

# 更新任务状态
update_issue_status "FC-123" "In Progress"

# 跟踪任务进度
track_task_progress "FC-123"
```

### 高级使用
```bash
# 智能状态流转
smart_status_transition "FC-123" "In Progress" "Ready for Test"

# 批量同步进度
batch_sync_sprint_progress "456"

# 生成进度报告
generate_sprint_progress_report "456"

# 分析评论内容
analyze_comment_content "开发完成，开始测试"

# Story状态验证
validate_sprint_stories_status "789"

# 智能Sprint关闭验证
smart_sprint_closure_validation "789"

# 生成Story验证报告
generate_story_validation_report "789"
```

这个JIRA集成系统提供了完整的评论管理、状态跟踪、进度同步、报告生成和Story状态验证功能，实现了多智能体协作与JIRA系统的深度集成，确保Sprint关闭前的质量保证。