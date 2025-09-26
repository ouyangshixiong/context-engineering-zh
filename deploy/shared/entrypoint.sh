#!/bin/bash

# 机器学习框架容器 - 入口脚本
set -e

echo "🚀 启动机器学习框架容器..."

# 检查Python环境
echo "📦 检查Python环境..."
python --version
pip --version

# 检查ML库加载
echo "🔍 检查ML库加载状态..."
python -c "import torch; print(f'✅ PyTorch版本: {torch.__version__}'); print(f'   类型: {'CPU' if 'cpu' in torch.__version__ else 'GPU'}版本')" 2>/dev/null || echo "⚠️  PyTorch未安装"
python -c "import paddle; print(f'✅ PaddlePaddle版本: {paddle.__version__}')" 2>/dev/null || echo "⚠️  PaddlePaddle未安装"
python -c "import numpy; print(f'✅ NumPy版本: {numpy.__version__}')" 2>/dev/null || echo "⚠️  NumPy未安装"

# 检查GPU可用性（如果适用）
if python -c "import torch; print(f'CUDA可用: {torch.cuda.is_available()}')" 2>/dev/null; then
    echo "🎮 GPU环境检测完成"
    python -c "import torch; print(f'GPU数量: {torch.cuda.device_count()}')"
    python -c "import torch; print(f'当前GPU: {torch.cuda.current_device()}')"
else
    echo "💻 使用CPU环境"
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p /app/data /app/logs /app/notebooks /app/models /app/results

# 设置目录权限
chown -R $(whoami):$(whoami) /app/data /app/logs /app/notebooks /app/models /app/results

# 显示工作目录内容
echo "📂 工作目录内容:"
ls -la /app/

# 如果提供了自定义命令，执行它
if [ $# -gt 0 ]; then
    echo "🎯 执行自定义命令: $@"
    exec "$@"
else
    echo "📚 启动Jupyter Lab..."
    echo "🔗 访问地址: http://localhost:8888"
    echo "📖 使用说明: 在浏览器中打开上述地址"
    exec jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root --notebook-dir=/app
fi