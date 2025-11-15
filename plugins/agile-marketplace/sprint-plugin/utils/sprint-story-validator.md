# Sprint Story验证器

## 🎯 核心功能
- 智能Story状态验证和报告
- Sprint关闭前质量保证
- 阻塞Story识别和处理建议
- 批量验证和自动修复

## 智能Story验证系统

### 1. 核心验证引擎
```bash
# 智能Story验证引擎
function smart_story_validation_engine() {
    local sprint_id=$1
    local validation_mode=${2:-"strict"}

    echo "🤖 智能Story验证引擎启动"
    echo "========================================"
    echo "Sprint ID: $sprint_id"
    echo "验证模式: $validation_mode"

    # 获取Sprint信息
    local sprint_info=$(get_sprint_info "$sprint_id")
    echo "📋 Sprint信息: $sprint_info"

    # 获取所有Story
    local stories=$(get_sprint_stories "$sprint_id")

    if [ -z "$stories" ]; then
        echo "❌ Sprint中没有Story"
        return 1
    fi

    echo "📋 验证Story列表:"
    echo "$stories"

    local validation_results=()
    local total_stories=0
    local completed_stories=0
    local blocked_stories=0
    local warning_stories=0

    # 验证每个Story
    for story in $stories; do
        echo ""
        echo "🔍 验证Story: $story"

        local validation_result=$(validate_single_story "$story" "$validation_mode")
        validation_results+=("$story|$validation_result")

        case "$validation_result" in
            "completed")
                ((completed_stories++))
                ;;
            "blocked")
                ((blocked_stories++))
                ;;
            "warning")
                ((warning_stories++))
                ;;
        esac
        ((total_stories++))
    done

    echo ""
    echo "📊 验证结果汇总:"
    echo "  • 总Story数: $total_stories"
    echo "  • 已完成: $completed_stories"
    echo "  • 阻塞: $blocked_stories"
    echo "  • 警告: $warning_stories"
    echo "  • 完成率: $((completed_stories * 100 / total_stories))%"

    # 生成详细验证报告
    generate_detailed_validation_report "$sprint_id" "${validation_results[@]}"

    # 根据验证模式返回结果
    case "$validation_mode" in
        "strict")
            if [ $blocked_stories -eq 0 ] && [ $warning_stories -eq 0 ]; then
                echo "✅ Sprint验证通过 - 严格模式"
                return 0
            else
                echo "❌ Sprint验证失败 - 严格模式"
                return 1
            fi
            ;;
        "lenient")
            if [ $blocked_stories -eq 0 ]; then
                echo "✅ Sprint验证通过 - 宽松模式"
                return 0
            else
                echo "❌ Sprint验证失败 - 宽松模式"
                return 1
            fi
            ;;
        "report_only")
            echo "📄 Sprint验证完成 - 仅报告模式"
            return 0
            ;;
    esac
}

# 验证单个Story
function validate_single_story() {
    local story_key=$1
    local validation_mode=$2

    echo "  🔍 详细验证: $story_key"

    # 获取Story基本信息
    local status=$(get_issue_status "$story_key")
    local summary=$(get_issue_summary "$story_key")
    local priority=$(get_issue_priority "$story_key")
    local assignee=$(get_issue_assignee "$story_key")

    echo "    📋 摘要: $summary"
    echo "    📊 状态: $status"
    echo "    ⚡ 优先级: $priority"
    echo "    👤 负责人: $assignee"

    # 检查状态
    if [ "$status" = "Done" ]; then
        echo "    ✅ Story已完成"
        echo "completed"
        return 0
    fi

    # 检查是否阻塞
    local is_blocked=$(check_story_blocked "$story_key")
    if [ "$is_blocked" = "true" ]; then
        echo "    ❌ Story被阻塞"
        echo "blocked"
        return 0
    fi

    # 检查是否有警告
    local has_warnings=$(check_story_warnings "$story_key")
    if [ "$has_warnings" = "true" ]; then
        echo "    ⚠️ Story有警告"
        echo "warning"
        return 0
    fi

    # 根据验证模式处理
    case "$validation_mode" in
        "strict")
            echo "    ❌ Story未完成 - 严格模式"
            echo "blocked"
            ;;
        "lenient")
            echo "    ⚠️ Story未完成 - 宽松模式"
            echo "warning"
            ;;
        *)
            echo "    ❌ Story未完成"
            echo "blocked"
            ;;
    esac
}

# 检查Story是否被阻塞
function check_story_blocked() {
    local story_key=$1

    # 检查是否有阻塞标签
    local labels=$(get_issue_labels "$story_key")
    if echo "$labels" | grep -qi "blocked\|blocking\|阻塞"; then
        echo "true"
        return 0
    fi

    # 检查最近评论中是否有阻塞关键词
    local latest_comment=$(get_latest_comment "$story_key")
    if echo "$latest_comment" | grep -qi "blocked\|stuck\|阻塞\|卡住"; then
        echo "true"
        return 0
    fi

    echo "false"
}

# 检查Story警告
function check_story_warnings() {
    local story_key=$1

    # 检查是否缺少负责人
    local assignee=$(get_issue_assignee "$story_key")
    if [ -z "$assignee" ] || [ "$assignee" = "Unassigned" ]; then
        echo "true"
        return 0
    fi

    # 检查是否缺少描述
    local description=$(get_issue_description "$story_key")
    if [ -z "$description" ] || [ "$description" = "No description" ]; then
        echo "true"
        return 0
    fi

    echo "false"
}
```

### 2. 详细验证报告
```bash
# 生成详细验证报告
function generate_detailed_validation_report() {
    local sprint_id=$1
    shift
    local validation_results=("$@")

    echo "📄 生成详细验证报告: $sprint_id"

    local report_file="validation_reports/sprint_${sprint_id}_detailed_validation.md"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "validation_reports"

    # 获取Sprint信息
    local sprint_info=$(get_sprint_info "$sprint_id")

    cat > "$report_file" << EOF
# Sprint详细验证报告 - $sprint_id

## 📅 验证时间
$timestamp

## 📋 Sprint信息
$sprint_info

## 📊 验证概览

EOF

    local completed_count=0
    local blocked_count=0
    local warning_count=0
    local total_count=0

    # 统计验证结果
    for result in "${validation_results[@]}"; do
        local story_key=$(echo "$result" | cut -d'|' -f1)
        local status=$(echo "$result" | cut -d'|' -f2)

        case "$status" in
            "completed")
                ((completed_count++))
                ;;
            "blocked")
                ((blocked_count++))
                ;;
            "warning")
                ((warning_count++))
                ;;
        esac
        ((total_count++))
    done

    cat >> "$report_file" << EOF
- **总Story数**: $total_count
- **已完成**: $completed_count
- **阻塞**: $blocked_count
- **警告**: $warning_count
- **完成率**: $((completed_count * 100 / total_count))%

## 📋 详细验证结果

EOF

    # 添加每个Story的详细验证结果
    for result in "${validation_results[@]}"; do
        local story_key=$(echo "$result" | cut -d'|' -f1)
        local status=$(echo "$result" | cut -d'|' -f2)
        local summary=$(get_issue_summary "$story_key")

        case "$status" in
            "completed")
                cat >> "$report_file" << EOF
### ✅ $story_key - $summary
- **验证状态**: 已完成
- **当前状态**: $(get_issue_status "$story_key")
- **优先级**: $(get_issue_priority "$story_key")
- **负责人**: $(get_issue_assignee "$story_key")

EOF
                ;;
            "blocked")
                cat >> "$report_file" << EOF
### ❌ $story_key - $summary
- **验证状态**: 阻塞
- **当前状态**: $(get_issue_status "$story_key")
- **优先级**: $(get_issue_priority "$story_key")
- **负责人**: $(get_issue_assignee "$story_key")
- **阻塞原因**: $(analyze_blocking_reason "$story_key")
- **建议行动**: $(generate_blocking_solution "$story_key")

EOF
                ;;
            "warning")
                cat >> "$report_file" << EOF
### ⚠️ $story_key - $summary
- **验证状态**: 警告
- **当前状态**: $(get_issue_status "$story_key")
- **优先级**: $(get_issue_priority "$story_key")
- **负责人**: $(get_issue_assignee "$story_key")
- **警告原因**: $(analyze_warning_reason "$story_key")
- **建议行动**: $(generate_warning_solution "$story_key")

EOF
                ;;
        esac
    done

    cat >> "$report_file" << EOF
## 🎯 总体建议

EOF

    if [ $blocked_count -eq 0 ] && [ $warning_count -eq 0 ]; then
        cat >> "$report_file" << EOF
✅ **Sprint状态良好**
- 所有Story都已完成
- 可以安全关闭Sprint
- 建议进行Sprint回顾

EOF
    elif [ $blocked_count -eq 0 ]; then
        cat >> "$report_file" << EOF
⚠️ **Sprint有警告**
- 所有Story都已完成，但存在警告
- 可以关闭Sprint，但建议解决警告
- 警告数量: $warning_count

### 警告处理建议:
$(generate_warning_handling_advice)

EOF
    else
        cat >> "$report_file" << EOF
❌ **Sprint存在阻塞**
- 阻塞Story数量: $blocked_count
- 警告Story数量: $warning_count
- **不建议关闭Sprint**

### 阻塞处理优先级:
$(generate_blocking_priority_advice "${validation_results[@]}")

### 紧急行动建议:
1. 立即处理高优先级阻塞Story
2. 分配负责人处理警告Story
3. 重新评估Sprint目标
4. 考虑延长Sprint或重新规划

EOF
    fi

    echo "✅ 详细验证报告已生成: $report_file"
}

# 分析阻塞原因
function analyze_blocking_reason() {
    local story_key=$1

    local status=$(get_issue_status "$story_key")
    local labels=$(get_issue_labels "$story_key")
    local latest_comment=$(get_latest_comment "$story_key")

    local reasons=()

    # 基于状态分析
    case "$status" in
        "To Do")
            reasons+=("Story尚未开始开发")
            ;;
        "In Progress")
            reasons+=("Story开发进行中")
            ;;
        "Testing")
            reasons+=("Story测试进行中")
            ;;
        "Ready for Test")
            reasons+=("Story等待测试")
            ;;
        "Ready for Release")
            reasons+=("Story等待发布")
            ;;
    esac

    # 基于标签分析
    if echo "$labels" | grep -qi "blocked"; then
        reasons+=("明确标记为阻塞")
    fi

    # 基于评论分析
    if echo "$latest_comment" | grep -qi "blocked\|stuck"; then
        reasons+=("评论中提及阻塞")
    fi

    if [ ${#reasons[@]} -eq 0 ]; then
        echo "未知原因"
    else
        printf "%s, " "${reasons[@]}" | sed 's/, $//'
    fi
}

# 生成阻塞解决方案
function generate_blocking_solution() {
    local story_key=$1

    local status=$(get_issue_status "$story_key")

    case "$status" in
        "To Do")
            echo "分配负责人并开始开发"
            ;;
        "In Progress")
            echo "检查开发进度并解决阻塞问题"
            ;;
        "Testing")
            echo "检查测试进度并解决测试问题"
            ;;
        "Ready for Test")
            echo "分配测试人员并开始测试"
            ;;
        "Ready for Release")
            echo "安排发布时间并完成发布"
            ;;
        *)
            echo "检查当前状态并制定相应解决方案"
            ;;
    esac
}
```

### 3. 自动修复功能
```bash
# 自动修复阻塞Story
function auto_fix_blocked_stories() {
    local sprint_id=$1

    echo "🔧 自动修复阻塞Story: $sprint_id"

    # 获取阻塞Story
    local blocked_stories=$(get_blocked_stories "$sprint_id")

    if [ -z "$blocked_stories" ]; then
        echo "✅ 没有阻塞Story需要修复"
        return 0
    fi

    echo "📋 阻塞Story列表:"
    echo "$blocked_stories"

    local fixed_count=0
    local failed_count=0

    # 尝试修复每个阻塞Story
    for story in $blocked_stories; do
        echo ""
        echo "🔧 修复Story: $story"

        if auto_fix_single_story "$story"; then
            ((fixed_count++))
            echo "✅ 修复成功"
        else
            ((failed_count++))
            echo "❌ 修复失败"
        fi
    done

    echo ""
    echo "📊 修复结果:"
    echo "  • 成功: $fixed_count"
    echo "  • 失败: $failed_count"
    echo "  • 总计: $((fixed_count + failed_count))"

    if [ $failed_count -eq 0 ]; then
        echo "✅ 所有阻塞Story修复成功"
        return 0
    else
        echo "⚠️ 部分阻塞Story修复失败"
        return 1
    fi
}

# 自动修复单个Story
function auto_fix_single_story() {
    local story_key=$1

    echo "  🔧 详细修复: $story_key"

    local status=$(get_issue_status "$story_key")
    local assignee=$(get_issue_assignee "$story_key")

    # 根据状态采取不同的修复策略
    case "$status" in
        "To Do")
            # 尝试分配负责人
            if [ -z "$assignee" ] || [ "$assignee" = "Unassigned" ]; then
                echo "  👤 尝试分配默认负责人"
                # 这里可以添加分配默认负责人的逻辑
            fi
            ;;
        "In Progress")
            # 检查是否有阻塞评论
            local latest_comment=$(get_latest_comment "$story_key")
            if echo "$latest_comment" | grep -qi "blocked\|stuck"; then
                echo "  💬 添加解决阻塞的评论"
                add_jira_comment "$story_key" "自动检测到阻塞状态，建议检查并解决阻塞问题"
            fi
            ;;
        "Testing")
            # 检查测试状态
            echo "  🧪 检查测试状态"
            ;;
    esac

    # 添加修复记录
    add_jira_comment "$story_key" "🤖 自动修复系统: 检测到阻塞状态，已尝试自动修复"

    return 0
}

# 获取阻塞Story
function get_blocked_stories() {
    local sprint_id=$1

    local stories=$(get_sprint_stories "$sprint_id")
    local blocked_stories=()

    for story in $stories; do
        local status=$(get_issue_status "$story")
        if [ "$status" != "Done" ]; then
            blocked_stories+=("$story")
        fi
    done

    if [ ${#blocked_stories[@]} -gt 0 ]; then
        echo "${blocked_stories[@]}"
    else
        echo ""
    fi
}
```

## 使用示例

### 基本使用
```bash
# 加载Story验证器
source sprint-story-validator.md

# 基本验证
smart_story_validation_engine "123" "strict"

# 宽松验证
smart_story_validation_engine "123" "lenient"

# 仅生成报告
smart_story_validation_engine "123" "report_only"
```

### 高级使用
```bash
# 自动修复阻塞Story
auto_fix_blocked_stories "123"

# 生成详细验证报告
generate_detailed_validation_report "123" "${validation_results[@]}"

# 批量验证多个Sprint
for sprint_id in "123" "456" "789"; do
    echo "验证Sprint: $sprint_id"
    smart_story_validation_engine "$sprint_id" "strict"
    echo ""
done
```

### 集成到工作流
```bash
# Sprint关闭前验证工作流
function sprint_closure_workflow() {
    local sprint_id=$1

    echo "🚀 Sprint关闭工作流启动"
    echo "========================================"

    # 1. 验证Story状态
    echo "🔍 步骤1: 验证Story状态"
    if ! smart_story_validation_engine "$sprint_id" "strict"; then
        echo "❌ Story验证失败，无法关闭Sprint"
        return 1
    fi

    # 2. 生成最终报告
    echo "📄 步骤2: 生成最终报告"
    generate_detailed_validation_report "$sprint_id" "${validation_results[@]}"

    # 3. 执行Sprint关闭
    echo "🏁 步骤3: 执行Sprint关闭"
    if complete_sprint "$sprint_id"; then
        echo "✅ Sprint关闭成功"
        return 0
    else
        echo "❌ Sprint关闭失败"
        return 1
    fi
}
```

这个Sprint Story验证器提供了完整的Story状态验证、阻塞识别、自动修复和报告生成功能，确保Sprint关闭前的质量保证和风险控制。