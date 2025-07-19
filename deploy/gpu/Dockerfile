FROM nvidia/cuda:12.6-devel-ubuntu24.04

# 避免交互式配置
ENV DEBIAN_FRONTEND=noninteractive

# 设置Python版本
ENV PYTHON_VERSION=3.10

# 安装Python和系统依赖
RUN apt-get update && apt-get install -y \
    software-properties-common \
    python${PYTHON_VERSION} \
    python${PYTHON_VERSION}-dev \
    python${PYTHON_VERSION}-venv \
    python3-pip \
    build-essential \
    curl \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 设置Python3.10为默认Python
RUN update-alternatives --install /usr/bin/python python /usr/bin/python${PYTHON_VERSION} 1
RUN update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1

# 升级pip
RUN pip install --upgrade pip

# 设置工作目录
WORKDIR /app

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

# 安装Python依赖（GPU版本）
RUN pip install --user --no-cache-dir -r requirements.txt || true
RUN pip install --user --no-cache-dir -r cnn-visual-tutorial/requirements.txt || true

# 安装GPU版本的PyTorch和PaddlePaddle
RUN pip install --user --no-cache-dir \
    torch==2.3.1+cu126 \
    torchvision==0.18.1+cu126 \
    torchaudio==2.3.1+cu126 \
    -f https://download.pytorch.org/whl/cu126

RUN pip install --user --no-cache-dir \
    paddlepaddle-gpu==2.6.1 \
    -f https://www.paddlepaddle.org.cn/whl/linux/mkl/avx/stable.html

# 复制应用代码
COPY --chown=developer:developer . .

# 暴露端口（如使用Jupyter）
EXPOSE 8888 8000 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import torch; import paddle; print('ML libraries loaded successfully')" || exit 1

# 启动命令
CMD ["python", "--version"]