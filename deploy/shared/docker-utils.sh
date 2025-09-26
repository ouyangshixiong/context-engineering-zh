#!/bin/bash

# CNN可视化教学项目 - Docker实用工具脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 帮助函数
show_help() {
    echo "CNN可视化教学项目 Docker 工具"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  build-cpu     构建CPU版本镜像"
    echo "  build-gpu     构建GPU版本镜像"
    echo "  start-cpu     启动CPU版本容器"
    echo "  start-gpu     启动GPU版本容器"
    echo "  stop          停止所有容器"
    echo "  logs          查看容器日志"
    echo "  clean         清理Docker资源"
    echo "  status        查看容器状态"
    echo "  shell         进入容器shell"
    echo "  test          运行健康检查"
    echo ""
    echo "选项:"
    echo "  -h, --help    显示帮助信息"
}

# 构建CPU镜像
build_cpu() {
    echo -e "${BLUE}🔨 构建CPU版本镜像...${NC}"
    docker build -t cnn-tutorial:cpu -f deploy/cpu/Dockerfile .
    echo -e "${GREEN}✅ CPU镜像构建完成${NC}"
}

# 构建GPU镜像
build_gpu() {
    echo -e "${BLUE}🔨 构建GPU版本镜像...${NC}"
    docker build -t cnn-tutorial:gpu -f deploy/gpu/Dockerfile .
    echo -e "${GREEN}✅ GPU镜像构建完成${NC}"
}

# 启动CPU容器
start_cpu() {
    echo -e "${BLUE}🚀 启动CPU版本容器...${NC}"
    docker-compose -f deploy/cpu/docker-compose.yml up -d
    echo -e "${GREEN}✅ CPU容器启动完成${NC}"
    show_urls
}

# 启动GPU容器
start_gpu() {
    echo -e "${BLUE}🚀 启动GPU版本容器...${NC}"
    docker-compose -f deploy/gpu/docker-compose.yml up -d
    echo -e "${GREEN}✅ GPU容器启动完成${NC}"
    show_urls
}

# 停止所有容器
stop_all() {
    echo -e "${YELLOW}🛑 停止所有容器...${NC}"
    docker-compose -f deploy/cpu/docker-compose.yml down 2>/dev/null || true
    docker-compose -f deploy/gpu/docker-compose.yml down 2>/dev/null || true
    echo -e "${GREEN}✅ 所有容器已停止${NC}"
}

# 显示访问地址
show_urls() {
    echo -e "${GREEN}🔗 访问地址：${NC}"
    echo "  Jupyter Lab: http://localhost:8888"
    echo "  如果端口冲突，请检查 docker-compose.yml 中的端口映射"
}

# 查看日志
show_logs() {
    local service=${1:-"cpu"}
    echo -e "${BLUE}📋 查看${service}容器日志...${NC}"
    docker-compose -f deploy/${service}/docker-compose.yml logs -f
}

# 清理Docker资源
clean_docker() {
    echo -e "${YELLOW}🧹 清理Docker资源...${NC}"
    docker system prune -f
    docker volume prune -f
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 查看容器状态
show_status() {
    echo -e "${BLUE}📊 容器状态：${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep cnn-tutorial || echo "没有运行中的容器"
}

# 进入容器shell
enter_shell() {
    local service=${1:-"cpu"}
    echo -e "${BLUE}🐚 进入${service}容器shell...${NC}"
    docker-compose -f deploy/${service}/docker-compose.yml exec cnn-${service} /bin/bash
}

# 运行健康检查
run_health_check() {
    local service=${1:-"cpu"}
    echo -e "${BLUE}🔍 运行${service}容器健康检查...${NC}"
    docker-compose -f deploy/${service}/docker-compose.yml exec cnn-${service} python -c "
import torch
import paddle
print('✅ PyTorch版本:', torch.__version__)
print('✅ PaddlePaddle版本:', paddle.__version__)
if 'cpu' in torch.__version__:
    print('💻 确认CPU版本安装成功')
else:
    print('🎯 GPU版本已安装')
if torch.cuda.is_available():
    print('✅ CUDA可用，GPU数量:', torch.cuda.device_count())
else:
    print('💻 使用CPU模式')
"
}

# 主函数
main() {
    case ${1:-"help"} in
        build-cpu)
            build_cpu
            ;;
        build-gpu)
            build_gpu
            ;;
        start-cpu)
            start_cpu
            ;;
        start-gpu)
            start_gpu
            ;;
        stop)
            stop_all
            ;;
        logs)
            show_logs ${2:-"cpu"}
            ;;
        clean)
            clean_docker
            ;;
        status)
            show_status
            ;;
        shell)
            enter_shell ${2:-"cpu"}
            ;;
        test)
            run_health_check ${2:-"cpu"}
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

main "$@" || exit 1