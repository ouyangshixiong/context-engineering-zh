#!/bin/bash

# 机器学习框架 - 启动Jupyter Lab（Docker版本）
# 替代传统的venv激活和Jupyter启动脚本

set -e

echo "📚 启动机器学习框架Jupyter Lab..."

# 检查容器是否运行
if ! docker ps | grep -q "cnn-tutorial"; then
    echo "⚠️  容器未运行，请先启动容器"
    echo ""
    echo "快速启动:"
    echo "  ./docker-setup.sh"
    echo ""
    echo "或者手动启动:"
    echo "  ./deploy/shared/docker-utils.sh start-cpu   # CPU版本"
    echo "  ./deploy/shared/docker-utils.sh start-gpu   # GPU版本"
    echo ""
    exit 1
fi

# 判断使用哪个容器
if docker ps | grep -q "cnn-cpu"; then
    CONTAINER="cnn-cpu"
elif docker ps | grep -q "cnn-gpu"; then
    CONTAINER="cnn-gpu"
else
    echo "❌ 未找到运行中的容器"
    exit 1
fi

echo "🎯 使用容器: $CONTAINER"

# 启动Jupyter Lab
echo "🚀 启动Jupyter Lab..."
echo "🔗 访问地址: http://localhost:8888"
echo "📖 浏览器将自动打开..."

# 尝试自动打开浏览器（如果可用）
if command -v open >/dev/null 2>&1; then
    # macOS
    sleep 3 && open http://localhost:8888 &
elif command -v xdg-open >/dev/null 2>&1; then
    # Linux
    sleep 3 && xdg-open http://localhost:8888 &
fi

# 连接到正在运行的Jupyter服务
echo "✅ Jupyter Lab 已在容器中运行"
echo ""
echo "容器信息:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep cnn-tutorial

echo ""
echo "📋 其他操作:"
echo "  - 停止服务: ./deploy/shared/docker-utils.sh stop"
echo "  - 查看日志: ./deploy/shared/docker-utils.sh logs"
echo "  - 进入容器: ./deploy/shared/docker-utils.sh shell"