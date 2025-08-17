FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# 设置Python环境变量
ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 复制依赖文件
COPY requirements*.txt ./
COPY cnn-visual-tutorial/requirements*.txt ./cnn-visual-tutorial/

# 安装Python依赖（CPU版本）
RUN pip install --no-cache-dir -r requirements.txt || true
RUN pip install --no-cache-dir -r cnn-visual-tutorial/requirements.txt || true

# 安装CPU版本的PyTorch和PaddlePaddle
RUN pip install --no-cache-dir \
torch==2.4.1+cpu \
    torchvision==0.19.1+cpu \
    torchaudio==2.4.1+cpu \
    -f https://download.pytorch.org/whl/torch_stable.html

RUN pip install --no-cache-dir \
    paddlepaddle==2.6.0

# 复制应用代码
COPY . .

# 暴露端口（如使用Jupyter）
EXPOSE 8888 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import torch; import paddle; print('ML libraries loaded successfully')" || exit 1

# 启动命令
CMD ["python", "--version"]