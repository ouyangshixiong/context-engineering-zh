# 讨论文件管理和知识库系统

## 🎯 核心功能
- 多轮协商文档自动生成和管理
- 知识库构建和维护
- 版本控制和历史追踪
- 智能文档检索和分析

## 讨论文件管理系统

### 1. 文件组织结构
```bash
# 讨论文件目录结构
function create_discussion_structure() {
    local project_key=$1
    local sprint_id=$2

    echo "📁 创建讨论文件目录结构..."

    # 基础目录结构
    local base_dir="discussion"
    local project_dir="$base_dir/$project_key"
    local sprint_dir="$project_dir/sprint_$sprint_id"

    # 创建目录
    mkdir -p "$sprint_dir/negotiation"
    mkdir -p "$sprint_dir/knowledge_base"
    mkdir -p "$sprint_dir/version_history"
    mkdir -p "$sprint_dir/analysis"

    echo "📋 目录结构:"
    echo "  • $sprint_dir/negotiation/     - 协商文档"
    echo "  • $sprint_dir/knowledge_base/  - 知识库"
    echo "  • $sprint_dir/version_history/ - 版本历史"
    echo "  • $sprint_dir/analysis/        - 分析报告"

    echo "✅ 讨论文件目录结构已创建"
}

# 标准化文件命名
function standardize_filename() {
    local task_key=$1
    local document_type=$2
    local version=${3:-1}

    echo "📝 标准化文件名: $task_key - $document_type"

    # 文件命名规范: {task_key}_{document_type}_v{version}.md
    local filename="${task_key}_${document_type}_v${version}.md"

    echo "📄 标准文件名: $filename"
    echo "$filename"
}

# 获取最新版本号
function get_latest_version() {
    local task_key=$1
    local document_type=$2

    echo "🔍 获取最新版本号: $task_key - $document_type"

    local pattern="${task_key}_${document_type}_v*.md"
    local latest_version=0

    # 查找所有版本文件
    for file in discussion/*/$pattern 2>/dev/null; do
        if [ -f "$file" ]; then
            local version=$(echo "$file" | grep -o 'v[0-9]*' | sed 's/v//')
            if [ "$version" -gt "$latest_version" ]; then
                latest_version=$version
            fi
        fi
    done

    echo "📊 最新版本: $latest_version"
    echo "$latest_version"
}
```

### 2. 文档版本控制
```bash
# 创建新版本文档
function create_new_version() {
    local task_key=$1
    local document_type=$2
    local content=$3

    echo "🔄 创建新版本文档: $task_key - $document_type"

    # 获取最新版本号
    local latest_version=$(get_latest_version "$task_key" "$document_type")
    local new_version=$((latest_version + 1))

    # 标准化文件名
    local filename=$(standardize_filename "$task_key" "$document_type" "$new_version")

    # 创建文档
    echo "📄 创建文档: $filename"
    echo "$content" > "discussion/$filename"

    # 记录版本历史
    record_version_history "$task_key" "$document_type" "$new_version" "$filename"

    echo "✅ 新版本文档已创建: v$new_version"
    echo "$filename"
}

# 记录版本历史
function record_version_history() {
    local task_key=$1
    local document_type=$2
    local version=$3
    local filename=$4

    echo "📚 记录版本历史: $task_key - $document_type v$version"

    local history_file="discussion/version_history/${task_key}_${document_type}_history.md"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # 创建或更新历史文件
    if [ ! -f "$history_file" ]; then
        cat > "$history_file" << EOF
# 版本历史 - $task_key - $document_type

## 文档信息
- **任务**: $task_key
- **类型**: $document_type
- **创建时间**: $timestamp

## 版本记录

EOF
    fi

    # 添加版本记录
    cat >> "$history_file" << EOF
### 版本 $version
- **文件名**: $filename
- **创建时间**: $timestamp
- **状态**: Active

EOF

    echo "✅ 版本历史已记录"
}

# 比较文档版本
function compare_versions() {
    local task_key=$1
    local document_type=$2
    local version1=$3
    local version2=$4

    echo "🔍 比较文档版本: $task_key - $document_type v$version1 vs v$version2"

    local file1="discussion/$(standardize_filename "$task_key" "$document_type" "$version1")"
    local file2="discussion/$(standardize_filename "$task_key" "$document_type" "$version2")"

    if [ ! -f "$file1" ] || [ ! -f "$file2" ]; then
        echo "❌ 无法找到要比较的文档"
        return 1
    fi

    # 使用diff比较文档
    echo "📊 文档差异分析:"
    diff -u "$file1" "$file2" | head -20

    echo "✅ 文档比较完成"
}
```

## 知识库管理系统

### 1. 知识库构建
```bash
# 构建知识库索引
function build_knowledge_index() {
    local project_key=$1

    echo "📚 构建知识库索引: $project_key"

    local knowledge_dir="discussion/$project_key/knowledge_base"
    local index_file="$knowledge_dir/knowledge_index.md"

    # 创建索引文件
    cat > "$index_file" << EOF
# 知识库索引 - $project_key

## 📅 生成时间
$(date '+%Y-%m-%d %H:%M:%S')

## 📋 文档分类

### 🔧 技术方案
EOF

    # 扫描技术方案文档
    local technical_files=$(find "discussion/$project_key" -name "*_technical_solution_*.md" 2>/dev/null)

    for file in $technical_files; do
        local task_key=$(basename "$file" | cut -d'_' -f1)
        local version=$(basename "$file" | grep -o 'v[0-9]*' | sed 's/v//')
        echo "- [$task_key - 技术方案 v$version]($file)" >> "$index_file"
    done

    cat >> "$index_file" << EOF

### 📝 需求澄清
EOF

    # 扫描需求澄清文档
    local requirement_files=$(find "discussion/$project_key" -name "*_requirements_*.md" 2>/dev/null)

    for file in $requirement_files; do
        local task_key=$(basename "$file" | cut -d'_' -f1)
        local version=$(basename "$file" | grep -o 'v[0-9]*' | sed 's/v//')
        echo "- [$task_key - 需求澄清 v$version]($file)" >> "$index_file"
    done

    cat >> "$index_file" << EOF

### 📋 任务分解
EOF

    # 扫描任务分解文档
    local breakdown_files=$(find "discussion/$project_key" -name "*_task_breakdown_*.md" 2>/dev/null)

    for file in $breakdown_files; do
        local task_key=$(basename "$file" | cut -d'_' -f1)
        local version=$(basename "$file" | grep -o 'v[0-9]*' | sed 's/v//')
        echo "- [$task_key - 任务分解 v$version]($file)" >> "$index_file"
    done

    echo "✅ 知识库索引已构建"
}

# 提取关键知识
function extract_key_knowledge() {
    local task_key=$1
    local document_type=$2

    echo "🧠 提取关键知识: $task_key - $document_type"

    local latest_version=$(get_latest_version "$task_key" "$document_type")
    local filename=$(standardize_filename "$task_key" "$document_type" "$latest_version")
    local file_path="discussion/$filename"

    if [ ! -f "$file_path" ]; then
        echo "❌ 文档不存在: $file_path"
        return 1
    fi

    # 提取关键信息
    local key_points=()

    case "$document_type" in
        "requirements")
            key_points+=("需求目标")
            key_points+=("验收标准")
            key_points+=("技术约束")
            ;;
        "technical_solution")
            key_points+=("架构设计")
            key_points+=("技术选型")
            key_points+=("实现步骤")
            ;;
        "task_breakdown")
            key_points+=("开发任务")
            key_points+=("测试任务")
            key_points+=("依赖关系")
            ;;
    esac

    echo "📋 提取的关键信息:"
    for point in "${key_points[@]}"; do
        echo "  • $point"
    done

    # 保存到知识库
    save_to_knowledge_base "$task_key" "$document_type" "${key_points[*]}"

    echo "✅ 关键知识已提取"
}

# 保存到知识库
function save_to_knowledge_base() {
    local task_key=$1
    local document_type=$2
    local key_points=$3

    echo "💾 保存到知识库: $task_key - $document_type"

    local knowledge_file="discussion/knowledge_base/${task_key}_knowledge.md"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # 创建或更新知识文件
    if [ ! -f "$knowledge_file" ]; then
        cat > "$knowledge_file" << EOF
# 知识总结 - $task_key

## 📅 更新时间
$timestamp

## 📋 关键知识

EOF
    fi

    # 添加关键知识
    cat >> "$knowledge_file" << EOF
### $document_type
- **提取时间**: $timestamp
- **关键点**: $key_points

EOF

    echo "✅ 知识已保存到知识库"
}
```

### 2. 智能检索系统
```bash
# 智能文档检索
function smart_document_search() {
    local query=$1
    local project_key=$2

    echo "🔍 智能文档检索: $query"

    local search_results=()
    local search_dir="discussion/$project_key"

    # 搜索所有相关文档
    local relevant_files=$(find "$search_dir" -name "*.md" -type f 2>/dev/null | xargs grep -l "$query" 2>/dev/null || true)

    if [ -z "$relevant_files" ]; then
        echo "❌ 未找到相关文档"
        return 1
    fi

    echo "📋 检索结果:"
    for file in $relevant_files; do
        local filename=$(basename "$file")
        local task_key=$(echo "$filename" | cut -d'_' -f1)
        local doc_type=$(echo "$filename" | cut -d'_' -f2)
        local version=$(echo "$filename" | grep -o 'v[0-9]*' | sed 's/v//')

        echo "  • $task_key - $doc_type v$version"
        echo "    📍 $file"

        search_results+=("$file")
    done

    echo "✅ 检索完成，找到 ${#search_results[@]} 个相关文档"
    echo "${search_results[@]}"
}

# 知识关联分析
function analyze_knowledge_relationships() {
    local task_key=$1

    echo "🔗 知识关联分析: $task_key"

    local analysis_file="discussion/analysis/${task_key}_relationships.md"

    # 查找相关文档
    local related_docs=$(find "discussion" -name "${task_key}_*.md" -type f 2>/dev/null)

    cat > "$analysis_file" << EOF
# 知识关联分析 - $task_key

## 📅 分析时间
$(date '+%Y-%m-%d %H:%M:%S')

## 📋 相关文档

EOF

    for doc in $related_docs; do
        local doc_type=$(basename "$doc" | cut -d'_' -f2)
        local version=$(basename "$doc" | grep -o 'v[0-9]*' | sed 's/v//')

        cat >> "$analysis_file" << EOF
### $doc_type v$version
- **文件**: $(basename "$doc")
- **路径**: $doc
- **状态**: Active

EOF
    done

    # 分析依赖关系
    cat >> "$analysis_file" << EOF
## 🔗 依赖关系

### 输入依赖
- 需求澄清文档
- 技术方案文档

### 输出依赖
- 任务分解文档
- 实现代码
- 测试用例

EOF

    echo "✅ 知识关联分析完成"
}
```

## 文档分析系统

### 1. 文档质量评估
```bash
# 评估文档质量
function assess_document_quality() {
    local file_path=$1

    echo "📊 评估文档质量: $file_path"

    if [ ! -f "$file_path" ]; then
        echo "❌ 文档不存在"
        return 1
    fi

    local quality_score=0
    local total_points=0

    # 检查文档完整性
    if grep -q "## 🎯" "$file_path"; then
        ((quality_score+=20))
        echo "✅ 包含目标描述 (+20)"
    fi
    ((total_points+=20))

    # 检查技术细节
    if grep -q -E "(技术方案|架构设计|实现步骤)" "$file_path"; then
        ((quality_score+=25))
        echo "✅ 包含技术细节 (+25)"
    fi
    ((total_points+=25))

    # 检查任务分解
    if grep -q -E "(任务分解|开发任务|测试任务)" "$file_path"; then
        ((quality_score+=25))
        echo "✅ 包含任务分解 (+25)"
    fi
    ((total_points+=25))

    # 检查验收标准
    if grep -q -E "(验收标准|测试用例|验证方法)" "$file_path"; then
        ((quality_score+=20))
        echo "✅ 包含验收标准 (+20)"
    fi
    ((total_points+=20))

    # 检查风险评估
    if grep -q -E "(风险评估|技术风险|依赖风险)" "$file_path"; then
        ((quality_score+=10))
        echo "✅ 包含风险评估 (+10)"
    fi
    ((total_points+=10))

    local quality_percentage=$((quality_score * 100 / total_points))

    echo "📊 文档质量评分: $quality_score/$total_points ($quality_percentage%)"

    # 质量等级评估
    if [ $quality_percentage -ge 90 ]; then
        echo "🎉 文档质量: 优秀"
    elif [ $quality_percentage -ge 70 ]; then
        echo "👍 文档质量: 良好"
    elif [ $quality_percentage -ge 50 ]; then
        echo "⚠️ 文档质量: 一般"
    else
        echo "❌ 文档质量: 需要改进"
    fi

    echo "$quality_percentage"
}

# 生成文档分析报告
function generate_document_analysis_report() {
    local task_key=$1

    echo "📄 生成文档分析报告: $task_key"

    local report_file="discussion/analysis/${task_key}_analysis_report.md"

    cat > "$report_file" << EOF
# 文档分析报告 - $task_key

## 📅 报告时间
$(date '+%Y-%m-%d %H:%M:%S')

## 📋 文档概览

EOF

    # 分析各类文档
    local doc_types=("requirements" "technical_solution" "task_breakdown")

    for doc_type in "${doc_types[@]}"; do
        local latest_version=$(get_latest_version "$task_key" "$doc_type")

        if [ "$latest_version" -gt 0 ]; then
            local filename=$(standardize_filename "$task_key" "$doc_type" "$latest_version")
            local file_path="discussion/$filename"
            local quality_score=$(assess_document_quality "$file_path")

            cat >> "$report_file" << EOF
### $doc_type 文档
- **版本**: v$latest_version
- **质量评分**: $quality_score%
- **文件**: $filename

EOF
        else
            cat >> "$report_file" << EOF
### $doc_type 文档
- **状态**: 缺失
- **建议**: 需要创建

EOF
        fi
    done

    # 总体评估
    cat >> "$report_file" << EOF
## 📊 总体评估

### 文档完整性
- 需求澄清: $(if [ $(get_latest_version "$task_key" "requirements") -gt 0 ]; then echo "✅"; else echo "❌"; fi)
- 技术方案: $(if [ $(get_latest_version "$task_key" "technical_solution") -gt 0 ]; then echo "✅"; else echo "❌"; fi)
- 任务分解: $(if [ $(get_latest_version "$task_key" "task_breakdown") -gt 0 ]; then echo "✅"; else echo "❌"; fi)

### 改进建议
1. 确保所有文档类型都创建
2. 定期更新文档版本
3. 提高文档质量评分
4. 加强知识库建设

EOF

    echo "✅ 文档分析报告已生成"
}
```

## 使用示例

### 基本使用
```bash
# 加载讨论文件管理器
source discussion-file-manager.md

# 创建目录结构
create_discussion_structure "FC" "123"

# 创建新版本文档
create_new_version "FC-123" "requirements" "需求内容..."

# 构建知识库索引
build_knowledge_index "FC"

# 智能文档检索
smart_document_search "用户注册" "FC"

# 生成分析报告
generate_document_analysis_report "FC-123"
```

### 高级使用
```bash
# 提取关键知识
extract_key_knowledge "FC-123" "requirements"

# 分析知识关联
analyze_knowledge_relationships "FC-123"

# 比较文档版本
compare_versions "FC-123" "requirements" 1 2

# 评估文档质量
assess_document_quality "discussion/FC-123_requirements_v1.md"
```

这个讨论文件管理和知识库系统提供了完整的文档管理、版本控制、知识提取和智能检索功能，显著提升了多智能体协作的知识沉淀和复用能力。