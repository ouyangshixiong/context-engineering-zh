# 故事分解三可原则

## 🎯 核心功能
- 三可原则任务分解：独立执行、自动化验证、回滚隔离
- 智能体/人工任务分配
- 20分钟粒度控制
- 依赖关系管理

## 三可原则定义

### 1. 原则定义
```bash
# 三可原则定义
THREE_PRINCIPLES=(
    "可独立执行"
    "可自动化验证"
    "可回滚隔离"
)

# 原则详细说明
PRINCIPLE_DESCRIPTIONS=(
    "每个子任务可以独立完成，不依赖其他子任务的结果"
    "每个子任务具备明确的自动化验收标准和验证方法"
    "每个子任务失败时可以安全回滚，不影响其他任务"
)
```

### 2. 原则检查函数

```bash
# 检查可独立执行原则
function check_independent_execution() {
    local task_description=$1

    echo "🔍 检查可独立执行原则: $task_description"

    local passed=true
    local warnings=()

    # 检查是否包含外部依赖
    if [[ "$task_description" == *"依赖"* ]] || [[ "$task_description" == *"需要"* ]] || [[ "$task_description" == *"等待"* ]]; then
        warnings+=("任务可能包含外部依赖")
        passed=false
    fi

    # 检查是否包含顺序要求
    if [[ "$task_description" == *"先"* ]] || [[ "$task_description" == *"后"* ]] || [[ "$task_description" == *"顺序"* ]]; then
        warnings+=("任务可能包含顺序依赖")
        passed=false
    fi

    if [ "$passed" = "true" ]; then
        echo "  ✅ 可独立执行原则通过"
        return 0
    else
        echo "  ⚠️ 可独立执行原则警告: ${warnings[*]}"
        return 1
    fi
}

# 检查可自动化验证原则
function check_automated_verification() {
    local task_description=$1

    echo "🔍 检查可自动化验证原则: $task_description"

    local passed=true
    local warnings=()

    # 检查是否包含主观判断
    if [[ "$task_description" == *"美观"* ]] || [[ "$task_description" == *"用户体验"* ]] || [[ "$task_description" == *"感觉"* ]]; then
        warnings+=("任务包含主观判断，难以自动化验证")
        passed=false
    fi

    # 检查是否包含手动操作
    if [[ "$task_description" == *"手动"* ]] || [[ "$task_description" == *"人工"* ]] || [[ "$task_description" == *"检查"* ]]; then
        warnings+=("任务包含手动操作，难以自动化验证")
        passed=false
    fi

    # 检查是否包含明确的结果
    if [[ "$task_description" != *"成功"* ]] && [[ "$task_description" != *"失败"* ]] && [[ "$task_description" != *"显示"* ]] && [[ "$task_description" != *"返回"* ]]; then
        warnings+=("任务结果不够明确，难以自动化验证")
        passed=false
    fi

    if [ "$passed" = "true" ]; then
        echo "  ✅ 可自动化验证原则通过"
        return 0
    else
        echo "  ⚠️ 可自动化验证原则警告: ${warnings[*]}"
        return 1
    fi
}

# 检查可回滚隔离原则
function check_rollback_isolation() {
    local task_description=$1

    echo "🔍 检查可回滚隔离原则: $task_description"

    local passed=true
    local warnings=()

    # 检查是否包含不可逆操作
    if [[ "$task_description" == *"删除"* ]] || [[ "$task_description" == *"清空"* ]] || [[ "$task_description" == *"销毁"* ]]; then
        warnings+=("任务包含不可逆操作，回滚困难")
        passed=false
    fi

    # 检查是否包含数据迁移
    if [[ "$task_description" == *"迁移"* ]] || [[ "$task_description" == *"转换"* ]] || [[ "$task_description" == *"导入"* ]]; then
        warnings+=("任务包含数据操作，需要备份机制")
        passed=false
    fi

    # 检查是否影响其他系统
    if [[ "$task_description" == *"集成"* ]] || [[ "$task_description" == *"接口"* ]] || [[ "$task_description" == *"系统"* ]]; then
        warnings+=("任务可能影响其他系统，需要隔离措施")
        passed=false
    fi

    if [ "$passed" = "true" ]; then
        echo "  ✅ 可回滚隔离原则通过"
        return 0
    else
        echo "  ⚠️ 可回滚隔离原则警告: ${warnings[*]}"
        return 1
    fi
}

# 综合三可原则检查
function check_three_principles() {
    local task_description=$1

    echo "🎯 综合三可原则检查: $task_description"
    echo "======================================"

    local all_passed=true
    local failed_principles=()

    # 检查可独立执行原则
    if ! check_independent_execution "$task_description"; then
        failed_principles+=("可独立执行")
        all_passed=false
    fi

    # 检查可自动化验证原则
    if ! check_automated_verification "$task_description"; then
        failed_principles+=("可自动化验证")
        all_passed=false
    fi

    # 检查可回滚隔离原则
    if ! check_rollback_isolation "$task_description"; then
        failed_principles+=("可回滚隔离")
        all_passed=false
    fi

    if [ "$all_passed" = "true" ]; then
        echo "✅ 三可原则检查全部通过"
        return 0
    else
        echo "❌ 三可原则检查失败"
        echo "   失败原则: ${failed_principles[*]}"
        return 1
    fi
}
```

### 3. 故事分解函数

```bash
# 分解Story为子任务
function decompose_story() {
    local story_key=$1
    local story_summary=$2

    echo "📖 分解Story: $story_key - $story_summary"
    echo "========================================"

    # 分析Story复杂度
    local complexity=$(analyze_story_complexity "$story_summary")
    echo "📊 Story复杂度: $complexity"

    # 根据复杂度确定分解策略
    case "$complexity" in
        "simple")
            echo "🎯 简单Story，直接执行"
            decompose_simple_story "$story_key" "$story_summary"
            ;;
        "medium")
            echo "🎯 中等复杂度Story，标准分解"
            decompose_medium_story "$story_key" "$story_summary"
            ;;
        "complex")
            echo "🎯 复杂Story，详细分解"
            decompose_complex_story "$story_key" "$story_summary"
            ;;
        *)
            echo "⚠️ 未知复杂度，使用标准分解"
            decompose_medium_story "$story_key" "$story_summary"
            ;;
    esac
}

# 分析Story复杂度
function analyze_story_complexity() {
    local story_summary=$1

    echo "🔍 分析Story复杂度: $story_summary"

    local complexity="medium"  # 默认中等复杂度

    # 简单Story关键词
    local simple_keywords=("bug fix" "small change" "minor update" "样式调整" "文字修改")
    # 复杂Story关键词
    local complex_keywords=("new feature" "major refactor" "architecture" "integration" "性能优化" "安全加固")

    for keyword in "${simple_keywords[@]}"; do
        if echo "$story_summary" | grep -qi "$keyword"; then
            complexity="simple"
            break
        fi
    done

    for keyword in "${complex_keywords[@]}"; do
        if echo "$story_summary" | grep -qi "$keyword"; then
            complexity="complex"
            break
        fi
    done

    echo "📊 复杂度分析结果: $complexity"
    echo "$complexity"
}

# 分解简单Story
function decompose_simple_story() {
    local story_key=$1
    local story_summary=$2

    echo "🎯 分解简单Story"

    # 简单Story通常只需要一个任务
    local subtasks=("$story_summary")

    echo "📋 生成子任务:"
    for task in "${subtasks[@]}"; do
        echo "  • $task"
    done

    # 返回子任务列表
    echo "${subtasks[@]}"
}

# 分解中等复杂度Story
function decompose_medium_story() {
    local story_key=$1
    local story_summary=$2

    echo "🎯 分解中等复杂度Story"

    # 中等复杂度Story分解为2-3个任务
    local subtasks=(
        "实现核心功能: $story_summary"
        "编写单元测试: $story_summary"
        "更新相关文档: $story_summary"
    )

    echo "📋 生成子任务:"
    for task in "${subtasks[@]}"; do
        echo "  • $task"
    done

    # 返回子任务列表
    echo "${subtasks[@]}"
}

# 分解复杂Story
function decompose_complex_story() {
    local story_key=$1
    local story_summary=$2

    echo "🎯 分解复杂Story"

    # 复杂Story分解为3-5个任务
    local subtasks=(
        "设计技术方案: $story_summary"
        "实现核心逻辑: $story_summary"
        "开发用户界面: $story_summary"
        "编写集成测试: $story_summary"
        "性能和安全优化: $story_summary"
    )

    echo "📋 生成子任务:"
    for task in "${subtasks[@]}"; do
        echo "  • $task"
    done

    # 返回子任务列表
    echo "${subtasks[@]}"
}
```

### 4. 智能体分配决策

```bash
# 智能体分配决策
function assign_agent_decision() {
    local task_description=$1

    echo "🤖 智能体分配决策: $task_description"

    # 重复性任务关键词（适合智能体）
    local agent_keywords=(
        "代码生成" "单元测试" "集成测试" "文档生成"
        "配置更新" "数据迁移" "样式调整" "bug修复"
    )

    # 复杂决策任务关键词（适合人工）
    local human_keywords=(
        "设计决策" "架构设计" "业务逻辑" "用户体验"
        "性能优化" "安全审查" "代码审查" "需求分析"
    )

    # 检查任务类型
    local assign_to_agent=true

    for keyword in "${human_keywords[@]}"; do
        if echo "$task_description" | grep -qi "$keyword"; then
            assign_to_agent=false
            echo "  👤 分配给人工: 包含复杂决策 ($keyword)"
            break
        fi
    done

    if [ "$assign_to_agent" = "true" ]; then
        for keyword in "${agent_keywords[@]}"; do
            if echo "$task_description" | grep -qi "$keyword"; then
                echo "  🤖 分配给智能体: 包含重复性任务 ($keyword)"
                echo "agent"
                return 0
            fi
        done
    fi

    # 默认分配给人工
    echo "  👤 默认分配给人工: 需要专业判断"
    echo "human"
}

# 20分钟完成检查
function check_20min_completion() {
    local task_description=$1

    echo "⏱️ 20分钟完成检查: $task_description"

    # 长时间任务关键词
    local long_task_keywords=(
        "重构" "重写" "迁移" "集成" "性能优化"
        "安全加固" "架构调整" "数据库设计"
    )

    for keyword in "${long_task_keywords[@]}"; do
        if echo "$task_description" | grep -qi "$keyword"; then
            echo "  ⚠️ 任务可能超过20分钟: 包含复杂操作 ($keyword)"
            echo "false"
            return 1
        fi
    done

    echo "  ✅ 任务预计在20分钟内完成"
    echo "true"
}
```

### 5. 依赖关系管理

```bash
# 分析任务依赖关系
function analyze_task_dependencies() {
    local subtasks=$1

    echo "🔗 分析任务依赖关系"

    local dependencies=()

    # 这里应该实现实际的依赖关系分析逻辑
    # 基于任务描述分析可能的依赖关系

    for task in $subtasks; do
        if [[ "$task" == *"测试"* ]] && [[ "$task" != *"单元测试"* ]]; then
            dependencies+=("$task 依赖开发完成")
        elif [[ "$task" == *"文档"* ]]; then
            dependencies+=("$task 依赖功能实现")
        fi
    done

    if [ ${#dependencies[@]} -gt 0 ]; then
        echo "📋 识别到依赖关系:"
        for dep in "${dependencies[@]}"; do
            echo "  • $dep"
        done
    else
        echo "✅ 无依赖关系，所有任务可并行执行"
    fi

    # 返回依赖关系
    echo "${dependencies[@]}"
}

# 生成任务执行计划
function generate_execution_plan() {
    local story_key=$1
    local subtasks=$2

    echo "📋 生成任务执行计划: $story_key"
    echo "================================"

    local execution_plan=()

    # 分析每个子任务
    for task in $subtasks; do
        echo ""
        echo "🔍 分析任务: $task"

        # 三可原则检查
        local principles_passed=$(check_three_principles "$task")

        # 智能体分配决策
        local assign_to=$(assign_agent_decision "$task")

        # 20分钟完成检查
        local within_20min=$(check_20min_completion "$task")

        # 生成任务信息
        local task_info="$task|$principles_passed|$assign_to|$within_20min"
        execution_plan+=("$task_info")

        echo "📊 任务分析结果:"
        echo "  • 三可原则: $principles_passed"
        echo "  • 分配给: $assign_to"
        echo "  • 20分钟内: $within_20min"
    done

    echo ""
    echo "🎯 最终执行计划:"
    for plan in "${execution_plan[@]}"; do
        IFS='|' read -r task principles assign_to within_20min <<< "$plan"
        echo "  • $task"
        echo "    - 三可原则: $principles"
        echo "    - 分配给: $assign_to"
        echo "    - 20分钟内: $within_20min"
    done

    # 返回执行计划
    echo "${execution_plan[@]}"
}
```

## 使用示例

### 基本使用
```bash
# 加载故事分解工具
source story-decomposition-principles.md

# 三可原则检查
check_three_principles "实现用户登录功能"

# 故事分解
decompose_story "FC-123" "实现用户注册功能包含邮箱验证"

# 智能体分配决策
assign_agent_decision "编写用户注册单元测试"

# 20分钟完成检查
check_20min_completion "重构用户认证模块"

# 生成执行计划
generate_execution_plan "FC-123" "任务1 任务2 任务3"
```

### 集成到快速sprint
```bash
# 在需求澄清后分解Story
local subtasks=$(decompose_story "$story_key" "$story_summary")

# 生成执行计划
local execution_plan=$(generate_execution_plan "$story_key" "$subtasks")

# 根据执行计划分配任务
for plan in $execution_plan; do
    IFS='|' read -r task principles assign_to within_20min <<< "$plan"

    if [ "$assign_to" = "agent" ]; then
        echo "🤖 分配给智能体: $task"
        # 调用智能体执行
    else
        echo "👤 分配给人工: $task"
        # 添加到人工队列
    fi
done
```

这个故事分解三可原则工具提供了完整的任务分解、智能体分配和依赖管理功能，确保每个子任务都符合独立执行、自动化验证和回滚隔离的原则。