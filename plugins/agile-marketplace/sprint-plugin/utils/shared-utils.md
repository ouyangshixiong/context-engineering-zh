# 共享工具库

## 🎯 核心功能
- 通用工具函数和辅助方法
- 时间处理和格式化
- 日志记录和调试工具
- 配置管理和环境变量

## 通用工具函数

### 1. 时间处理工具
```bash
# 获取当前时间戳
function get_current_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# 获取UTC时间
function get_utc_timestamp() {
    date -u '+%Y-%m-%dT%H:%M:%S.000Z'
}

# 计算时间差（秒）
function calculate_time_difference() {
    local start_time=$1
    local end_time=$2

    local start_seconds=$(date -d "$start_time" +%s 2>/dev/null || echo "0")
    local end_seconds=$(date -d "$end_time" +%s 2>/dev/null || echo "0")

    echo $((end_seconds - start_seconds))
}

# 格式化时间显示
function format_duration() {
    local seconds=$1

    if [ $seconds -lt 60 ]; then
        echo "${seconds}秒"
    elif [ $seconds -lt 3600 ]; then
        local minutes=$((seconds / 60))
        local remaining_seconds=$((seconds % 60))
        echo "${minutes}分${remaining_seconds}秒"
    else
        local hours=$((seconds / 3600))
        local minutes=$(((seconds % 3600) / 60))
        echo "${hours}小时${minutes}分"
    fi
}
```

### 2. 日志记录工具
```bash
# 通用日志函数
function log_info() {
    local message=$1
    local timestamp=$(get_current_timestamp)
    echo "[INFO] $timestamp - $message"
    echo "[INFO] $timestamp - $message" >> execution.log
}

function log_warning() {
    local message=$1
    local timestamp=$(get_current_timestamp)
    echo "[WARN] $timestamp - $message"
    echo "[WARN] $timestamp - $message" >> execution.log
}

function log_error() {
    local message=$1
    local timestamp=$(get_current_timestamp)
    echo "[ERROR] $timestamp - $message"
    echo "[ERROR] $timestamp - $message" >> execution.log
}

function log_success() {
    local message=$1
    local timestamp=$(get_current_timestamp)
    echo "[SUCCESS] $timestamp - $message"
    echo "[SUCCESS] $timestamp - $message" >> execution.log
}

# 调试日志（仅在调试模式启用）
function log_debug() {
    local message=$1

    if [ "$DEBUG_MODE" = "true" ]; then
        local timestamp=$(get_current_timestamp)
        echo "[DEBUG] $timestamp - $message"
        echo "[DEBUG] $timestamp - $message" >> debug.log
    fi
}

# 性能日志
function log_performance() {
    local operation=$1
    local duration=$2
    local timestamp=$(get_current_timestamp)

    echo "[PERF] $timestamp - $operation 耗时: ${duration}秒"
    echo "$timestamp|$operation|$duration" >> performance.log
}
```

### 3. 配置管理工具
```bash
# 加载环境配置
function load_environment_config() {
    echo "🔧 加载环境配置..."

    # 加载JIRA配置
    if [ -f "jira.md" ]; then
        source jira.md
        log_info "JIRA配置已加载"
    else
        log_error "jira.md配置文件不存在"
        return 1
    fi

    # 加载状态ID映射
    if [ -f "status_ids.env" ]; then
        source status_ids.env
        log_info "状态ID映射已加载"
    else
        log_warning "status_ids.env文件不存在，将自动检测状态"
    fi

    # 加载API兼容性配置
    if [ -f "api_compatibility.env" ]; then
        source api_compatibility.env
        log_info "API兼容性配置已加载"
    fi

    log_success "环境配置加载完成"
}

# 保存配置
function save_config() {
    local config_key=$1
    local config_value=$2

    echo "$config_key=$config_value" >> config.env
    log_debug "配置已保存: $config_key=$config_value"
}

# 获取配置
function get_config() {
    local config_key=$1

    if [ -f "config.env" ]; then
        source config.env
        eval "echo \$$config_key"
    else
        echo ""
    fi
}
```

### 4. 字符串处理工具
```bash
# 检查字符串是否为空
function is_empty() {
    local string=$1

    if [ -z "$string" ] || [ "$string" = "null" ] || [ "$string" = "undefined" ]; then
        return 0
    else
        return 1
    fi
}

# 去除字符串前后空格
function trim() {
    local string=$1
    echo "$string" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

# 检查字符串是否包含子串
function contains() {
    local string=$1
    local substring=$2

    if echo "$string" | grep -qi "$substring"; then
        return 0
    else
        return 1
    fi
}

# 生成随机字符串
function generate_random_string() {
    local length=${1:-8}
    tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c "$length"
}
```

### 5. 文件操作工具
```bash
# 检查文件是否存在
function file_exists() {
    local file_path=$1

    if [ -f "$file_path" ]; then
        return 0
    else
        return 1
    fi
}

# 创建目录（如果不存在）
function create_directory() {
    local dir_path=$1

    if [ ! -d "$dir_path" ]; then
        mkdir -p "$dir_path"
        log_info "目录已创建: $dir_path"
    fi
}

# 备份文件
function backup_file() {
    local file_path=$1
    local backup_suffix=${2:-.bak}

    if file_exists "$file_path"; then
        local backup_path="${file_path}${backup_suffix}"
        cp "$file_path" "$backup_path"
        log_info "文件已备份: $file_path -> $backup_path"
    fi
}

# 清理临时文件
function cleanup_temp_files() {
    echo "🧹 清理临时文件..."

    # 清理临时日志文件
    local temp_files=(
        "agent_status_log.txt"
        "task_status_history.txt"
        "status_rollback_history.txt"
        "verification_history.txt"
        "improvement_suggestions.txt"
        "sync_history.txt"
    )

    for file in "${temp_files[@]}"; do
        if file_exists "$file"; then
            rm "$file"
            log_debug "临时文件已删除: $file"
        fi
    done

    log_success "临时文件清理完成"
}
```

### 6. 验证和检查工具
```bash
# 验证命令是否存在
function command_exists() {
    local command=$1

    if command -v "$command" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 检查必需的命令
function check_required_commands() {
    echo "🔍 检查必需命令..."

    local required_commands=("curl" "jq" "date" "sleep")
    local missing_commands=()

    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            missing_commands+=("$cmd")
        fi
    done

    if [ ${#missing_commands[@]} -eq 0 ]; then
        log_success "所有必需命令都存在"
        return 0
    else
        log_error "缺少必需命令: ${missing_commands[*]}"
        return 1
    fi
}

# 验证JSON格式
function validate_json() {
    local json_string=$1

    if echo "$json_string" | jq -e '.' >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 检查网络连接
function check_network_connection() {
    echo "🌐 检查网络连接..."

    if ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1; then
        log_success "网络连接正常"
        return 0
    else
        log_error "网络连接失败"
        return 1
    fi
}
```

### 7. 进度显示工具
```bash
# 显示进度条
function show_progress_bar() {
    local current=$1
    local total=$2
    local width=${3:-50}
    local label=${4:-"进度"}

    local percentage=$((current * 100 / total))
    local completed=$((current * width / total))
    local remaining=$((width - completed))

    printf "\r%s [%s%s] %d%%" \
        "$label" \
        "$(printf '%*s' "$completed" | tr ' ' '#')" \
        "$(printf '%*s' "$remaining" | tr ' ' '-')" \
        "$percentage"
}

# 显示旋转进度指示器
function show_spinner() {
    local pid=$1
    local message=${2:-"处理中..."}

    local spin='-\|/'
    local i=0

    while kill -0 "$pid" 2>/dev/null; do
        i=$(( (i+1) % 4 ))
        printf "\r%s %s" "$message" "${spin:$i:1}"
        sleep 0.1
    done
    printf "\r%s ✅\n" "$message"
}

# 显示计数进度
function show_count_progress() {
    local current=$1
    local total=$2
    local label=${3:-"处理"}

    printf "\r%s: %d/%d (%.1f%%)" "$label" "$current" "$total" "$(echo "scale=1; $current*100/$total" | bc)"
}
```

### 8. 错误处理工具
```bash
# 优雅退出函数
function graceful_exit() {
    local exit_code=${1:-0}
    local message=${2:-""}

    if [ -n "$message" ]; then
        if [ $exit_code -eq 0 ]; then
            log_success "$message"
        else
            log_error "$message"
        fi
    fi

    # 清理临时文件
    cleanup_temp_files

    log_info "程序退出，代码: $exit_code"
    exit $exit_code
}

# 错误处理包装器
function with_error_handling() {
    local command=$1
    local error_message=${2:-"命令执行失败"}

    log_debug "执行命令: $command"

    if eval "$command"; then
        return 0
    else
        log_error "$error_message"
        return 1
    fi
}

# 重试包装器
function with_retry() {
    local command=$1
    local max_retries=${2:-3}
    local delay=${3:-2}

    local retry_count=0

    while [ $retry_count -lt $max_retries ]; do
        log_debug "重试 $((retry_count + 1))/$max_retries: $command"

        if eval "$command"; then
            return 0
        fi

        ((retry_count++))

        if [ $retry_count -lt $max_retries ]; then
            log_warning "命令失败，${delay}秒后重试..."
            sleep $delay
        fi
    done

    log_error "达到最大重试次数 ($max_retries)，命令失败: $command"
    return 1
}
```

## 使用示例

### 基本使用
```bash
# 加载共享工具库
source shared-utils.md

# 初始化环境
load_environment_config
check_required_commands

# 使用日志功能
log_info "开始执行任务"
log_success "任务完成"

# 使用时间工具
local start_time=$(get_current_timestamp)
sleep 2
local end_time=$(get_current_timestamp)
local duration=$(calculate_time_difference "$start_time" "$end_time")
log_performance "任务执行" "$duration"

# 使用进度显示
show_progress_bar 25 100
```

### 错误处理示例
```bash
# 使用错误处理包装器
with_error_handling \
    "smart_jira_api_call 'GET' '/rest/api/3/myself'" \
    "JIRA连接失败"

# 使用重试包装器
with_retry \
    "sync_checkpoint 'Test' 'Test Action' 'FC-123' 'Done' '123'" \
    3 \
    5
```

### 文件操作示例
```bash
# 备份重要文件
backup_file "status_ids.env"

# 清理临时文件
cleanup_temp_files

# 优雅退出
graceful_exit 0 "程序执行完成"
```

这个共享工具库提供了通用的工具函数，包括时间处理、日志记录、配置管理、字符串处理、文件操作、验证检查、进度显示和错误处理等功能，为整个插件提供基础支持。