# 用户输入解析器

## 🎯 核心功能
- 智能解析自然语言输入，提取story keys
- 支持多种输入格式和语言
- 识别项目上下文和优先级
- 生成标准化的story列表

## 🔍 输入模式识别

### 1. 基础解析引擎
```bash
# 智能用户输入解析引擎
function smart_user_input_parser() {
    local user_input=$1
    local project_context=${2:-""}

    echo "🤖 用户输入解析引擎启动"
    echo "================================"
    echo "用户输入: $user_input"
    echo "项目上下文: $project_context"

    # 清理输入
    local cleaned_input=$(clean_user_input "$user_input")
    echo "🔧 清理后输入: $cleaned_input"

    # 识别输入模式
    local pattern=$(identify_input_pattern "$cleaned_input")
    echo "📋 识别模式: $pattern"

    # 根据模式提取story keys
    local story_keys=$(extract_story_keys_by_pattern "$cleaned_input" "$pattern")

    if [ -n "$story_keys" ]; then
        echo "✅ 成功提取story keys: $story_keys"
        echo "$story_keys"
        return 0
    else
        echo "❌ 无法提取story keys"
        return 1
    fi
}

# 清理用户输入
function clean_user_input() {
    local input=$1

    echo "🔧 清理用户输入..."

    # 移除多余空格
    input=$(echo "$input" | sed 's/\s\+/ /g' | sed 's/^\s*//' | sed 's/\s*$//')

    # 统一大小写
    input=$(echo "$input" | tr '[:upper:]' '[:lower:]')

    # 移除特殊字符但保留连字符
    input=$(echo "$input" | sed 's/[^a-zA-Z0-9\s-]//g')

    echo "  清理结果: $input"
    echo "$input"
}

# 识别输入模式
function identify_input_pattern() {
    local input=$1

    echo "🔍 识别输入模式..."

    # 模式识别规则
    declare -A patterns=(
        ["complete_story"]="完成.*story.*|complete.*story.*|finish.*story.*"
        ["multiple_stories"]=".*\s+[A-Z]+-[0-9]+\s+[A-Z]+-[0-9]+.*"
        ["single_story"]=".*[A-Z]+-[0-9]+.*"
        ["story_list"]="story.*:|stories.*:"
        ["project_story"]=".*project.*[A-Z]+-[0-9]+.*"
    )

    for pattern_name in "${!patterns[@]}"; do
        local pattern="${patterns[$pattern_name]}"

        if echo "$input" | grep -qiE "$pattern"; then
            echo "  匹配模式: $pattern_name"
            echo "$pattern_name"
            return 0
        fi
    done

    echo "  未匹配到已知模式"
    echo "unknown"
    return 1
}
```

### 2. Story Key提取器
```bash
# 根据模式提取story keys
function extract_story_keys_by_pattern() {
    local input=$1
    local pattern=$2

    echo "🔍 根据模式提取story keys: $pattern"

    case "$pattern" in
        "complete_story")
            extract_complete_story_keys "$input"
            ;;
        "multiple_stories")
            extract_multiple_story_keys "$input"
            ;;
        "single_story")
            extract_single_story_key "$input"
            ;;
        "story_list")
            extract_story_list_keys "$input"
            ;;
        "project_story")
            extract_project_story_keys "$input"
            ;;
        *)
            extract_fallback_story_keys "$input"
            ;;
    esac
}

# 提取"完成story"模式
function extract_complete_story_keys() {
    local input=$1

    echo "🎯 提取'完成story'模式..."

    # 匹配格式: 完成story LR-4, 完成story LR-4 LR-5
    local keys=$(echo "$input" | grep -oE '[A-Z]+-[0-9]+' | tr '\n' ' ' | sed 's/\s*$//')

    if [ -n "$keys" ]; then
        echo "  提取结果: $keys"
        echo "$keys"
    else
        echo "  未找到story keys"
        echo ""
    fi
}

# 提取多个story keys
function extract_multiple_story_keys() {
    local input=$1

    echo "🎯 提取多个story keys..."

    # 匹配多个连续的story keys
    local keys=$(echo "$input" | grep -oE '[A-Z]+-[0-9]+(\s+[A-Z]+-[0-9]+)*')

    if [ -n "$keys" ]; then
        echo "  提取结果: $keys"
        echo "$keys"
    else
        echo "  未找到多个story keys"
        echo ""
    fi
}

# 提取单个story key
function extract_single_story_key() {
    local input=$1

    echo "🎯 提取单个story key..."

    # 匹配单个story key
    local key=$(echo "$input" | grep -oE '[A-Z]+-[0-9]+' | head -1)

    if [ -n "$key" ]; then
        echo "  提取结果: $key"
        echo "$key"
    else
        echo "  未找到story key"
        echo ""
    fi
}

# 提取story列表
function extract_story_list_keys() {
    local input=$1

    echo "🎯 提取story列表..."

    # 匹配格式: story: LR-4, LR-5
    local keys=$(echo "$input" | sed 's/.*story.*://i' | grep -oE '[A-Z]+-[0-9]+' | tr '\n' ' ' | sed 's/\s*$//')

    if [ -n "$keys" ]; then
        echo "  提取结果: $keys"
        echo "$keys"
    else
        echo "  未找到story列表"
        echo ""
    fi
}

# 提取项目相关的story keys
function extract_project_story_keys() {
    local input=$1

    echo "🎯 提取项目相关story keys..."

    # 匹配项目前缀
    local project_prefix=$(echo "$input" | grep -oE '[A-Z]+' | head -1)

    if [ -n "$project_prefix" ]; then
        local keys=$(echo "$input" | grep -oE "$project_prefix-[0-9]+" | tr '\n' ' ' | sed 's/\s*$//')

        if [ -n "$keys" ]; then
            echo "  提取结果: $keys"
            echo "$keys"
        else
            echo "  未找到项目相关的story keys"
            echo ""
        fi
    else
        echo "  未识别项目前缀"
        echo ""
    fi
}

# 备用提取方法
function extract_fallback_story_keys() {
    local input=$1

    echo "🔄 使用备用提取方法..."

    # 尝试所有可能的提取方法
    local keys=""

    # 方法1: 直接匹配story key格式
    keys=$(echo "$input" | grep -oE '[A-Z]+-[0-9]+' | tr '\n' ' ' | sed 's/\s*$//')

    if [ -n "$keys" ]; then
        echo "  备用提取结果: $keys"
        echo "$keys"
        return 0
    fi

    # 方法2: 尝试从上下文推断
    keys=$(infer_story_keys_from_context "$input")

    if [ -n "$keys" ]; then
        echo "  上下文推断结果: $keys"
        echo "$keys"
        return 0
    fi

    echo "  备用提取失败"
    echo ""
    return 1
}

# 从上下文推断story keys
function infer_story_keys_from_context() {
    local input=$1

    echo "🤔 从上下文推断story keys..."

    # 这里可以添加更复杂的推断逻辑
    # 例如基于项目历史、当前活跃sprint等

    # 临时返回空值
    echo ""
}
```

### 3. 验证和标准化
```bash
# 验证story keys
function validate_story_keys() {
    local story_keys=$1
    local project_context=${2:-""}

    echo "🔍 验证story keys..."

    if [ -z "$story_keys" ]; then
        echo "❌ story keys为空"
        return 1
    fi

    local valid_keys=()
    local invalid_keys=()

    # 分割keys
    IFS=' ' read -ra key_array <<< "$story_keys"

    for key in "${key_array[@]}"; do
        if validate_single_story_key "$key" "$project_context"; then
            valid_keys+=("$key")
            echo "  ✅ $key - 有效"
        else
            invalid_keys+=("$key")
            echo "  ❌ $key - 无效"
        fi
    done

    if [ ${#valid_keys[@]} -eq 0 ]; then
        echo "❌ 没有有效的story keys"
        return 1
    fi

    if [ ${#invalid_keys[@]} -gt 0 ]; then
        echo "⚠️ 发现无效keys: ${invalid_keys[*]}"
    fi

    # 返回有效的keys
    local result=$(printf "%s " "${valid_keys[@]}" | sed 's/\s*$//')
    echo "✅ 验证完成，有效keys: $result"
    echo "$result"
    return 0
}

# 验证单个story key
function validate_single_story_key() {
    local key=$1
    local project_context=$2

    # 基本格式验证
    if ! echo "$key" | grep -qE '^[A-Z]+-[0-9]+$'; then
        return 1
    fi

    # 项目上下文验证（如果提供）
    if [ -n "$project_context" ]; then
        local project_prefix=$(echo "$key" | cut -d'-' -f1)
        if [ "$project_prefix" != "$project_context" ]; then
            echo "  ⚠️ 项目不匹配: $project_prefix vs $project_context"
            # 这里可以决定是否严格验证
        fi
    fi

    # 可以添加JIRA API验证（可选）
    # if ! validate_story_exists_in_jira "$key"; then
    #     return 1
    # fi

    return 0
}

# 标准化story keys输出
function normalize_story_keys_output() {
    local story_keys=$1

    echo "🔧 标准化story keys输出..."

    # 去重
    local unique_keys=$(echo "$story_keys" | tr ' ' '\n' | sort -u | tr '\n' ' ' | sed 's/\s*$//')

    # 排序
    local sorted_keys=$(echo "$unique_keys" | tr ' ' '\n' | sort -V | tr '\n' ' ' | sed 's/\s*$//')

    echo "  标准化结果: $sorted_keys"
    echo "$sorted_keys"
}
```

## 🚀 完整解析流程

### 1. 主解析函数
```bash
# 完整用户输入解析流程
function complete_user_input_parsing() {
    local user_input=$1
    local project_context=${2:-""}

    echo "🚀 完整用户输入解析流程启动"
    echo "================================"

    # 1. 智能解析
    local raw_story_keys=$(smart_user_input_parser "$user_input" "$project_context")

    if [ $? -ne 0 ] || [ -z "$raw_story_keys" ]; then
        echo "❌ 解析失败，无法提取story keys"
        return 1
    fi

    # 2. 验证
    local validated_keys=$(validate_story_keys "$raw_story_keys" "$project_context")

    if [ $? -ne 0 ] || [ -z "$validated_keys" ]; then
        echo "❌ 验证失败，没有有效的story keys"
        return 1
    fi

    # 3. 标准化
    local final_keys=$(normalize_story_keys_output "$validated_keys")

    echo "✅ 解析完成，最终story keys: $final_keys"
    echo "$final_keys"
    return 0
}
```

### 2. 错误处理和恢复
```bash
# 处理解析错误
function handle_parsing_error() {
    local user_input=$1
    local error_type=$2

    echo "🔄 处理解析错误: $error_type"

    case "$error_type" in
        "no_keys_found")
            echo "❌ 无法从输入中提取story keys"
            echo "💡 建议: 请使用格式 '完成story LR-4' 或 'LR-4 LR-5'"
            ;;
        "invalid_keys")
            echo "❌ 提取的story keys格式无效"
            echo "💡 建议: 请使用标准格式 '项目-编号' 如 'LR-4'"
            ;;
        "validation_failed")
            echo "❌ story keys验证失败"
            echo "💡 建议: 请检查story是否存在且项目上下文正确"
            ;;
        *)
            echo "❌ 未知解析错误"
            echo "💡 建议: 请重新输入或联系管理员"
            ;;
    esac

    return 1
}

# 交互式解析恢复
function interactive_parsing_recovery() {
    local user_input=$1

    echo "🔄 启动交互式解析恢复..."

    # 尝试提供建议
    local suggestions=$(generate_parsing_suggestions "$user_input")

    if [ -n "$suggestions" ]; then
        echo "💡 解析建议: $suggestions"
    fi

    # 这里可以添加交互式输入逻辑
    # 例如请求用户确认或重新输入

    return 1
}

# 生成解析建议
function generate_parsing_suggestions() {
    local user_input=$1

    echo "💡 生成解析建议..."

    local suggestions=""

    # 检测可能的输入问题
    if echo "$user_input" | grep -qi "完成"; then
        suggestions="检测到中文输入，请确保story key格式正确 (如: LR-4)"
    elif echo "$user_input" | grep -qi "story"; then
        suggestions="检测到英文输入，请确保story key格式正确 (如: LR-4)"
    else
        suggestions="请使用格式: '完成story LR-4' 或直接提供story keys 'LR-4 LR-5'"
    fi

    echo "$suggestions"
}
```

## 📋 使用示例

### 基本使用
```bash
# 加载用户输入解析器
source user-input-parser.md

# 基本解析
complete_user_input_parsing "完成story LR-4"
complete_user_input_parsing "LR-4 LR-5"
complete_user_input_parsing "story: LR-4, LR-5"

# 带项目上下文
complete_user_input_parsing "完成story LR-4" "LR"
```

### 集成到Scrum Master
```bash
# 在Scrum Master中集成
function scrum_master_input_analysis() {
    local user_input=$1
    local project_key=$2

    echo "🎯 Scrum Master - 用户输入分析"
    echo "================================"

    # 使用用户输入解析器
    local story_keys=$(complete_user_input_parsing "$user_input" "$project_key")

    if [ $? -eq 0 ] && [ -n "$story_keys" ]; then
        echo "✅ 输入分析成功，story keys: $story_keys"
        echo "$story_keys"
        return 0
    else
        echo "❌ 输入分析失败"
        handle_parsing_error "$user_input" "no_keys_found"
        return 1
    fi
}
```

### 测试用例
```bash
# 测试各种输入格式
echo "=== 测试用例 ==="

# 中文输入
echo "1. 中文输入:"
complete_user_input_parsing "完成story LR-4"

echo ""

# 英文输入
echo "2. 英文输入:"
complete_user_input_parsing "complete story LR-4"

echo ""

# 多个story
echo "3. 多个story:"
complete_user_input_parsing "完成story LR-4 LR-5"

echo ""

# 直接提供keys
echo "4. 直接提供keys:"
complete_user_input_parsing "LR-4 LR-5"

echo ""

# 列表格式
echo "5. 列表格式:"
complete_user_input_parsing "story: LR-4, LR-5"
```

这个用户输入解析器模块提供了强大的自然语言解析能力，能够从各种格式的用户输入中智能提取story keys，为快速sprint插件提供更好的用户体验。