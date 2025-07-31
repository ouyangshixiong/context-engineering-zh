#!/bin/bash
# 🚀 一键数据集配置脚本
# 根据运行环境自动选择并配置合适的数据集

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 帮助信息
show_help() {
    echo "🚀 数据集配置管理脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  auto      自动选择数据集（默认）"
    echo "  debug     强制使用调试用小数据集"
    echo "  production 强制使用部署用大数据集"
    echo "  info      显示环境信息"
    echo "  clean     清理数据集缓存"
    echo "  validate  验证数据集完整性"
    echo "  -h, --help 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0           # 自动选择"
    echo "  $0 debug     # 使用COCO128调试"
    echo "  $0 production # 使用COCO2017部署"
    echo "  $0 info      # 查看环境信息"
}

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_info "检查依赖..."
    
    # 检查Python
    if ! command -v python &> /dev/null; then
        print_error "Python未安装"
        exit 1
    fi
    
    # 检查PyTorch
    if ! python -c "import torch" 2>/dev/null; then
        print_error "PyTorch未安装"
        exit 1
    fi
    
    # 检查YAML支持
    if ! python -c "import yaml" 2>/dev/null; then
        print_warning "PyYAML未安装，正在安装..."
        pip install PyYAML
    fi
    
    print_success "依赖检查通过"
}

# 显示环境信息
show_environment_info() {
    print_info "环境信息:"
    echo "========================================"
    
    # Python版本
    python --version
    
    # PyTorch信息
    python -c "
import torch
print(f'PyTorch版本: {torch.__version__}')
print(f'CUDA可用: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'GPU数量: {torch.cuda.device_count()}')
    for i in range(torch.cuda.device_count()):
        props = torch.cuda.get_device_properties(i)
        print(f'  GPU {i}: {props.name} ({props.total_memory/1024**3:.1f}GB)')
"
    
    echo "========================================"
}

# 自动检测环境并选择配置
auto_select_config() {
    print_info "正在检测环境并选择数据集配置..."
    
    # 使用Python脚本进行智能选择
    CONFIG_PATH=$(python -c "
import sys
sys.path.append('src')
from utils.dataset_selector import auto_select_dataset
print(auto_select_dataset())
")
    
    if [[ -z "$CONFIG_PATH" ]]; then
        print_error "无法自动选择配置，使用默认debug配置"
        CONFIG_PATH="configs/data/debug_datasets.yaml"
    fi
    
    print_success "选择的配置: $CONFIG_PATH"
    echo "$CONFIG_PATH" > .selected_dataset_config
}

# 下载数据集
download_dataset() {
    local config_path=$1
    local stage=$2
    
    print_info "开始下载数据集..."
    
    # 创建数据目录
    mkdir -p data/debug data/production
    
    # 根据阶段下载对应数据集
    if [[ "$stage" == "debug" ]]; then
        print_info "下载调试数据集..."
        python scripts/download.py --dataset coco128 --target debug --data-dir ./data/debug
    elif [[ "$stage" == "production" ]]; then
        print_info "下载生产数据集..."
        python scripts/download.py --dataset coco2017 --target production --data-dir ./data/production
    fi
}

# 验证数据集
validate_dataset() {
    local config_path=$1
    
    print_info "验证数据集完整性..."
    
    # 使用Python验证脚本
    python -c "
import yaml
import sys
from pathlib import Path

config_path = '$config_path'
if Path(config_path).exists():
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    print('✅ 配置文件存在')
    
    # 检查数据集目录
    if 'debug_datasets' in config:
        for name, info in config['debug_datasets'].items():
            data_dir = Path(info['data_dir'])
            if data_dir.exists():
                print(f'✅ {name}: {data_dir} 存在')
            else:
                print(f'❌ {name}: {data_dir} 不存在')
    
    if 'production_datasets' in config:
        for name, info in config['production_datasets'].items():
            data_dir = Path(info['data_dir'])
            if data_dir.exists():
                print(f'✅ {name}: {data_dir} 存在')
            else:
                print(f'❌ {name}: {data_dir} 不存在')
else:
    print(f'❌ 配置文件不存在: {config_path}')
    sys.exit(1)
"
}

# 清理数据集缓存
clean_datasets() {
    print_warning "清理数据集缓存文件..."
    
    read -p "确定要清理数据集缓存吗？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf data/debug/coco128/
        rm -rf data/production/coco2017/
        rm -rf data/debug/cifar10/
        rm -f .selected_dataset_config
        print_success "数据集缓存已清理"
    else
        print_info "取消清理操作"
    fi
}

# 生成训练命令
generate_train_command() {
    local config_path=$1
    
    # 提取数据集名称
    local dataset_name
    if [[ "$config_path" == *"debug"* ]]; then
        dataset_name="coco128"
    else
        dataset_name="coco2017"
    fi
    
    # 获取推荐batch size
    local batch_size
    batch_size=$(python -c "
import sys
sys.path.append('src')
from utils.dataset_selector import get_recommended_batch_size
print(get_recommended_batch_size('$dataset_name'))
")
    
    cat << EOF

🎯 训练命令示例:

# 快速训练测试（1个epoch）
python scripts/train.py \
  model=yolov10n \
  data=${dataset_name} \
  trainer.max_epochs=1 \
  trainer.limit_train_batches=5 \
  data.batch_size=${batch_size} \
  trainer.fast_dev_run=true

# 完整训练
python scripts/train.py \
  model=yolov10n \
  data=${dataset_name} \
  trainer.max_epochs=100 \
  data.batch_size=${batch_size}

EOF
}

# 主函数
main() {
    local action=${1:-auto}
    
    print_info "🚀 数据集配置管理脚本启动..."
    
    check_dependencies
    
    case "$action" in
        "auto")
            auto_select_config
            validate_dataset "$(cat .selected_dataset_config)"
            generate_train_command "$(cat .selected_dataset_config)"
            ;;
        "debug")
            CONFIG_PATH="configs/data/debug_datasets.yaml"
            print_success "强制使用调试配置: $CONFIG_PATH"
            echo "$CONFIG_PATH" > .selected_dataset_config
            download_dataset "$CONFIG_PATH" "debug"
            validate_dataset "$CONFIG_PATH"
            generate_train_command "$CONFIG_PATH"
            ;;
        "production")
            CONFIG_PATH="configs/data/production_datasets.yaml"
            print_success "强制使用生产配置: $CONFIG_PATH"
            echo "$CONFIG_PATH" > .selected_dataset_config
            download_dataset "$CONFIG_PATH" "production"
            validate_dataset "$CONFIG_PATH"
            generate_train_command "$CONFIG_PATH"
            ;;
        "info")
            show_environment_info
            ;;
        "clean")
            clean_datasets
            ;;
        "validate")
            if [[ -f .selected_dataset_config ]]; then
                validate_dataset "$(cat .selected_dataset_config)"
            else
                print_warning "未找到已选择的配置，使用自动选择..."
                auto_select_config
                validate_dataset "$(cat .selected_dataset_config)"
            fi
            ;;
        "-h"|"--help"|"help")
            show_help
            ;;
        *)
            print_error "未知选项: $action"
            show_help
            exit 1
            ;;
    esac
    
    print_success "✅ 数据集配置完成！"
}

# 如果直接运行脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi