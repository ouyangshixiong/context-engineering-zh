FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# 创建非root用户
RUN useradd -m -u 1000 developer && \
    chown -R developer:developer /app

# 切换到非root用户
USER developer

# 设置Python环境变量
ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 复制依赖文件
COPY --chown=developer:developer requirements*.txt ./
COPY --chown=developer:developer cnn-visual-tutorial/requirements*.txt ./cnn-visual-tutorial/

# 安装Python依赖（CPU版本）
RUN pip install --user --no-cache-dir -r requirements.txt || true
RUN pip install --user --no-cache-dir -r cnn-visual-tutorial/requirements.txt || true

# 安装CPU版本的PyTorch和PaddlePaddle
RUN pip install --user --no-cache-dir \
    torch==2.1.0+cpu \
    torchvision==0.16.0+cpu \
    -f https://download.pytorch.org/whl/torch_stable.html

RUN pip install --user --no-cache-dir \
    paddlepaddle==2.5.0

# 复制应用代码
COPY --chown=developer:developer . .

# 暴露端口（如使用Jupyter）
EXPOSE 8888 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import torch; import paddle; print('ML libraries loaded successfully')" || exit 1

# 启动命令
CMD ["python", "--version"]