#!/bin/bash

# 机器学习框架 - Docker设置脚本
# 替代传统的venv设置，使用Docker容器化部署

set -e

echo "🐳 设置机器学习框架Docker环境..."

# 检查Docker是否已安装
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker未安装，请先安装Docker"
    echo "安装指南: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查Docker Compose是否已安装
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    echo "安装指南: https://docs.docker.com/compose/install/"
    exit 1
fi

# 检查GPU支持（可选）
echo "🔍 检查GPU支持..."
if command -v nvidia-smi >/dev/null 2>&1; then
    echo "✅ NVIDIA GPU驱动已安装"
    if docker run --rm --gpus all nvidia/cuda:12.6-base-ubuntu24.04 nvidia-smi >/dev/null 2>&1; then
        echo "✅ NVIDIA Docker运行时可用"
        GPU_AVAILABLE=true
    else
        echo "⚠️  NVIDIA Docker运行时未安装，将使用CPU版本"
        GPU_AVAILABLE=false
    fi
else
    echo "💻 未检测到NVIDIA GPU，将使用CPU版本"
    GPU_AVAILABLE=false
fi

echo ""
echo "📋 设置选项:"
echo "1) CPU版本部署"
echo "2) GPU版本部署"
echo "3) 开发环境"

# 根据GPU可用性推荐选择
if [ "$GPU_AVAILABLE" = true ]; then
    DEFAULT_CHOICE=2
    echo "推荐: GPU版本 (选项2)"
else
    DEFAULT_CHOICE=1
    echo "推荐: CPU版本 (选项1)"
fi

read -p "请选择部署类型 [$DEFAULT_CHOICE]: " choice
choice=${choice:-$DEFAULT_CHOICE}

case $choice in
    1)
        echo "🔧 设置CPU版本..."
        ./deploy/shared/docker-utils.sh build-cpu
        ./deploy/shared/docker-utils.sh start-cpu
        echo ""
        echo "✅ CPU版本设置完成！"
        echo "🔗 访问: http://localhost:8888"
        ;;
    2)
        if [ "$GPU_AVAILABLE" = true ]; then
            echo "🔧 设置GPU版本..."
            ./deploy/shared/docker-utils.sh build-gpu
            ./deploy/shared/docker-utils.sh start-gpu
            echo ""
            echo "✅ GPU版本设置完成！"
            echo "🔗 访问: http://localhost:8888"
        else
            echo "❌ GPU不可用，请使用CPU版本"
            exit 1
        fi
        ;;
    3)
        echo "🔧 设置开发环境..."
        ./deploy/shared/docker-utils.sh build-cpu
        echo "✅ 开发环境镜像构建完成"
        echo ""
        echo "使用开发环境:"
        echo "docker-compose -f docker-compose.yml --profile dev up -d"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "📖 后续操作:"
echo "  - 查看状态: ./deploy/shared/docker-utils.sh status"
echo "  - 查看日志: ./deploy/shared/docker-utils.sh logs"
echo "  - 停止服务: ./deploy/shared/docker-utils.sh stop"
echo "  - 进入容器: ./deploy/shared/docker-utils.sh shell"
echo ""
echo "🎯 开始使用机器学习框架！"