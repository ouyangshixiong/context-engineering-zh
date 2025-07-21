FROM pytorch/pytorch:2.6.0-cuda12.6-cudnn9-runtime

# 避免交互式配置
ENV DEBIAN_FRONTEND=noninteractive

# 设置Python环境变量
ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 复制依赖文件
COPY requirements*.txt ./
COPY cnn-visual-tutorial/requirements*.txt ./cnn-visual-tutorial/

# 安装Python依赖（GPU版本）
RUN pip install --no-cache-dir -r requirements.txt || true
RUN pip install --no-cache-dir -r cnn-visual-tutorial/requirements.txt || true

# 安装PaddlePaddle GPU版本
RUN pip install --no-cache-dir \
    paddlepaddle-gpu==3.1.0 \
    -f https://www.paddlepaddle.org.cn/whl/linux/mkl/avx/stable.html

# 复制应用代码
COPY . .

# 暴露端口（如使用Jupyter）
EXPOSE 8888 8000 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import torch; import paddle; print('ML libraries loaded successfully')" || exit 1

# 启动命令
CMD ["python", "--version"]