#!/bin/bash

# 机器学习框架 - 运行示例脚本（Docker版本）
# 替代传统的venv激活脚本，使用Docker容器运行示例

set -e

echo "🚀 使用Docker运行机器学习框架示例..."

# 检查容器是否运行
if ! docker ps | grep -q "cnn-tutorial"; then
    echo "⚠️  容器未运行，请先启动容器"
    echo ""
    echo "启动CPU版本:"
    echo "  ./deploy/shared/docker-utils.sh start-cpu"
    echo ""
    echo "启动GPU版本:"
    echo "  ./deploy/shared/docker-utils.sh start-gpu"
    echo ""
    exit 1
fi

# 判断使用哪个容器
if docker ps | grep -q "cnn-cpu"; then
    CONTAINER="cnn-cpu"
    COMPOSE_FILE="deploy/cpu/docker-compose.yml"
elif docker ps | grep -q "cnn-gpu"; then
    CONTAINER="cnn-gpu"
    COMPOSE_FILE="deploy/gpu/docker-compose.yml"
else
    echo "❌ 未找到运行中的容器"
    exit 1
fi

echo "📦 使用容器: $CONTAINER"

# 运行示例
echo "🎯 运行示例..."

# 检查示例文件是否存在
EXAMPLES=(
    "examples/pytorch/cat_dog_classifier.py"
    "examples/paddle/cat_dog_classifier.py"
    "cnn-visual-tutorial/examples/pytorch/cat_dog_classifier.py"
    "cnn-visual-tutorial/examples/paddle/cat_dog_classifier.py"
)

for example in "${EXAMPLES[@]}"; do
    if [ -f "$example" ]; then
        echo "运行: $example"
        docker-compose -f "$COMPOSE_FILE" exec "$CONTAINER" python "$example"
        echo ""
    fi
done

echo "✅ 示例运行完成！"
echo ""
echo "📊 查看结果:"
echo "  - 数据文件: ./data/"
echo "  - 日志文件: ./logs/"
echo "  - 模型文件: ./models/"