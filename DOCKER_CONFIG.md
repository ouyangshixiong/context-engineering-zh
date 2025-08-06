# 🐳 GPU生产环境配置指南

> 专为高性能训练设计的Docker GPU环境，支持PyTorch和PaddlePaddle

## 🎯 环境概述

| 组件 | 版本 | 用途 | 备注 |
|------|------|------|------|
| CUDA | 12.6 | GPU计算 | 最新稳定版 |
| PyTorch | 2.6.0+cu126 | 深度学习框架 | GPU加速 |
| PaddlePaddle | 2.6.0+gpu | 深度学习框架 | GPU加速 |
| 内存需求 | ≥ 8GB | 运行要求 | 支持batch_size=64 |
| GPU需求 | ≥ 8GB显存 | 训练要求 | RTX 3060以上 |

## 🤖 部署编排智能体集成指南

### 部署编排智能体职责
部署编排智能体负责GPU生产环境的自动化配置与优化：

| 智能体功能 | 输入规范 | 输出标准 | 关联Agent | 验证标准 |
|------------|----------|----------|-----------|----------|
| **环境检测** | 系统硬件信息 | DOCKER_CONFIG.md配置 | 环境验证智能体 | 100%环境兼容性 |
| **性能优化** | 模型规格+硬件配置 | GPU利用率>90%策略 | 性能优化智能体 | 性能基准达标 |
| **一键部署** | 项目配置 | 生产就绪环境 | 部署编排智能体 | 5分钟部署完成 |

## 🚀 一键部署

### 方案1: Docker Compose（推荐）

```bash
# 启动GPU环境
docker-compose -f deploy/gpu/docker-compose.yml up -d

# 验证环境
docker exec yolov10 python -c "import torch; print(f'GPU数量: {torch.cuda.device_count()}')"
```

### 方案2: Docker命令行

```bash
# 构建镜像
docker build -t yolov10-gpu -f deploy/gpu/Dockerfile .

# 运行容器
docker run --gpus all -it --name yolov10 \
  -v $(pwd):/workspace \
  -p 8888:8888 -p 6006:6006 \
  yolov10-gpu bash
```

## 📋 详细配置步骤

### 1. 系统要求检查

```bash
# 检查NVIDIA驱动
nvidia-smi
# 期望输出: CUDA Version: 12.6

# 检查Docker
docker --version
# 期望: Docker version 20.10+

# 检查NVIDIA Docker
docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu20.04 nvidia-smi
```

### 2. Dockerfile配置

#### 基础Dockerfile
```dockerfile
FROM pytorch/pytorch:2.6.0-cuda12.6-cudnn9-devel

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    git wget unzip htop vim \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /workspace

# 安装Python依赖
COPY requirements-gpu.txt .
RUN pip install --no-cache-dir -r requirements-gpu.txt

# 复制项目文件
COPY . .

# 设置环境变量
ENV PYTHONPATH=/workspace
ENV CUDA_VISIBLE_DEVICES=0,1,2,3

# 暴露端口
EXPOSE 8888 6006

CMD ["python", "scripts/train.py"]
```

#### PaddlePaddle Dockerfile
```dockerfile
FROM paddlepaddle/paddle:2.6.0-gpu-cuda12.6-cudnn9

# 安装额外依赖
RUN pip install --no-cache-dir \
    pytorch-lightning==2.0.0 \
    omegaconf==2.3.0 \
    torchmetrics==0.11.0 \
    wandb==0.15.0 \
    tensorboard==2.13.0

WORKDIR /workspace
COPY . .
ENV PYTHONPATH=/workspace

CMD ["python", "scripts/train.py"]
```

### 3. Docker Compose配置

#### docker-compose.yml
```yaml
version: '3.8'
services:
  yolov10:
    build:
      context: .
      dockerfile: deploy/gpu/Dockerfile
    container_name: yolov10
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - CUDA_VISIBLE_DEVICES=0,1,2,3
    volumes:
      - ./:/workspace
      - ./data:/workspace/data
      - ./logs:/workspace/logs
    ports:
      - "8888:8888"  # Jupyter
      - "6006:6006"  # TensorBoard
    command: >
      bash -c "
        echo '=== GPU信息 ===' &&
        nvidia-smi &&
        echo '=== 环境验证 ===' &&
        python -c 'import torch; print(f\"PyTorch: {torch.__version__}\"); print(f\"GPU: {torch.cuda.device_count()}\")' &&
        echo '=== 启动训练 ===' &&
        python scripts/train.py model=yolov10n data=coco128 trainer.max_epochs=10
      "
```

### 4. 环境验证脚本

#### 创建验证脚本
```bash
cat > validate_gpu.py << 'EOF'
import torch
import paddle
import subprocess
import os

print("=== GPU环境验证 ===")

# 检查CUDA可用性
print(f"PyTorch CUDA可用: {torch.cuda.is_available()}")
print(f"PaddlePaddle GPU可用: {paddle.is_compiled_with_cuda()}")

# 检查GPU信息
if torch.cuda.is_available():
    print(f"GPU数量: {torch.cuda.device_count()}")
    for i in range(torch.cuda.device_count()):
        props = torch.cuda.get_device_properties(i)
        print(f"GPU {i}: {props.name}, {props.total_memory/1024**3:.1f}GB")

# 检查nvidia-smi
try:
    result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
    print("✅ nvidia-smi 可用")
except FileNotFoundError:
    print("❌ nvidia-smi 不可用")

print("=== 环境验证完成 ===")
EOF
```

## 🧪 GPU性能测试

### 1. 基础性能测试

```bash
# 运行GPU性能测试
docker exec yolov10 python -c "
import torch
import time

# 测试GPU计算性能
size = 8192
a = torch.randn(size, size, device='cuda')
b = torch.randn(size, size, device='cuda')

start = time.time()
c = torch.matmul(a, b)
torch.cuda.synchronize()
end = time.time()

print(f'GPU矩阵乘法: {size}x{size} 用时 {end-start:.2f}s')
print(f'GPU内存: {torch.cuda.memory_allocated()/1024**3:.1f}GB')
"
```

### 2. 训练性能基准

```bash
# 单GPU训练测试
docker exec yolov10 python scripts/train.py \
  model=yolov10n \
  data=coco128 \
  trainer.max_epochs=3 \
  trainer.accelerator=gpu \
  trainer.devices=1 \
  trainer.precision=16

# 多GPU训练测试  
docker exec yolov10 python scripts/train.py \
  model=yolov10n \
  data=coco128 \
  trainer.max_epochs=3 \
  trainer.accelerator=gpu \
  trainer.devices=4 \
  trainer.strategy=ddp \
  trainer.precision=16
```

### 3. 性能监控

```bash
# 实时监控GPU使用率
watch -n 1 nvidia-smi

# 监控容器资源
docker stats yolov10

# 查看训练日志
docker exec yolov10 tail -f logs/lightning_logs/version_0/metrics.csv
```

## 🔧 高级配置

### 1. 多GPU配置

#### 环境变量设置
```bash
# Docker运行时设置
docker run --gpus '"device=0,1,2,3"' -it yolov10-gpu bash

# 容器内设置
export CUDA_VISIBLE_DEVICES=0,1,2,3
export NCCL_DEBUG=INFO
```

#### 训练参数优化
```bash
# 多GPU训练配置
python scripts/train.py \
  model=yolov10n \
  data=coco2017 \
  trainer.max_epochs=300 \
  trainer.accelerator=gpu \
  trainer.devices=4 \
  trainer.strategy=ddp \
  trainer.precision=16 \
  trainer.gradient_clip_val=0.1 \
  trainer.accumulate_grad_batches=4
```

### 2. 内存优化

#### CUDA内存管理
```python
# 在训练脚本中添加
import torch

# 内存优化设置
torch.cuda.empty_cache()
torch.backends.cudnn.benchmark = True

# 监控内存使用
if torch.cuda.is_available():
    print(f'GPU内存: {torch.cuda.memory_allocated()/1024**3:.1f}GB')
    print(f'GPU缓存: {torch.cuda.memory_reserved()/1024**3:.1f}GB')
```

### 3. 性能调优

#### 训练加速配置
```yaml
# configs/trainer/gpu_speed.yaml
trainer:
  accelerator: gpu
  devices: auto
  precision: 16
  strategy: ddp
  gradient_clip_val: 0.1
  accumulate_grad_batches: 4
  sync_batchnorm: true
  benchmark: true
```

## 📊 性能基准

### 硬件性能对比
| GPU型号 | 显存 | COCO训练时间 | 内存使用 | 推荐batch_size |
|---------|------|--------------|----------|----------------|
| RTX 3060 | 12GB | ~45分钟/epoch | 8GB | 32 |
| RTX 3080 | 10GB | ~35分钟/epoch | 8GB | 32 |
| RTX 4090 | 24GB | ~25分钟/epoch | 12GB | 64 |
| A100 | 40GB | ~15分钟/epoch | 20GB | 128 |

### 多GPU性能
| GPU数量 | 速度提升 | 内存使用 | 同步开销 |
|---------|----------|----------|----------|
| 1x | 1x | 8GB | 0% |
| 2x | 1.8x | 16GB | 10% |
| 4x | 3.2x | 32GB | 20% |
| 8x | 6.0x | 64GB | 25% |

## 🚨 常见问题解决

### 问题1: CUDA版本不匹配
```bash
# 错误信息: CUDA version mismatch
# 解决方案：
docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu20.04 nvidia-smi
# 确认CUDA版本一致
```

### 问题2: GPU内存不足
```bash
# 错误信息: CUDA out of memory
# 解决方案：
# 1. 减小batch_size
# 2. 启用梯度累积
# 3. 使用混合精度
python scripts/train.py \
  model=yolov10n \
  data=coco2017 \
  trainer.precision=16 \
  data.batch_size=16
```

### 问题3: NCCL通信错误
```bash
# 错误信息: NCCL error
# 解决方案：
export NCCL_DEBUG=INFO
export NCCL_P2P_DISABLE=1
export NCCL_IB_DISABLE=1
```

### 问题4: Docker权限问题
```bash
# 错误信息: permission denied
# 解决方案：
sudo usermod -aG docker $USER
sudo systemctl restart docker
docker run hello-world
```

## 🔄 环境管理

### 容器管理命令
```bash
# 启动容器
docker-compose -f deploy/gpu/docker-compose.yml up -d

# 进入容器
docker exec -it yolov10 bash

# 停止容器
docker-compose -f deploy/gpu/docker-compose.yml down

# 查看日志
docker logs -f yolov10

# 清理容器
docker system prune -f
```

### 镜像管理
```bash
# 构建镜像
docker build -t yolov10-gpu -f deploy/gpu/Dockerfile .

# 标记镜像
docker tag yolov10-gpu your-registry/yolov10:latest

# 推送镜像
docker push your-registry/yolov10:latest

# 拉取镜像
docker pull your-registry/yolov10:latest
```

## 🤖 部署编排智能体验证清单

### 环境验证智能体检查项
- [ ] NVIDIA驱动 ≥ 535.00 (环境验证智能体检测)
- [ ] Docker ≥ 20.10 (环境验证智能体验证)
- [ ] nvidia-docker2 已安装 (环境验证智能体确认)
- [ ] CUDA 12.6 兼容 (规格验证智能体验证)

### 部署编排智能体验证标准
- [ ] GPU检测成功 (部署编排智能体自动化)
- [ ] 镜像构建成功 (部署编排智能体构建)
- [ ] 容器启动正常 (部署编排智能体部署)
- [ ] 多GPU识别正确 (性能优化智能体验证)
- [ ] 内存分配合理 (资源优化智能体计算)

### 性能优化智能体基准测试
- [ ] 单GPU训练正常 (性能优化智能体测试)
- [ ] 多GPU训练正常 (性能优化智能体验证)
- [ ] 混合精度工作 (性能优化智能体优化)
- [ ] GPU利用率>90% (性能优化智能体达标)

## 🎯 下一步

完成GPU环境配置后：
1. 查看 [DEPLOY.md](./DEPLOY.md) 进行生产部署
2. 更新 [PROJECT_BUILD_LOG.md](./PROJECT_BUILD_LOG.md)
3. 配置CI/CD流水线

**完整流程**：
- **规划阶段**：CREATE.md → INITIAL.md（需求规格）
- **验证阶段**：VENV_CONFIG.md → DEBUG_CODE.md → DOCKER_CONFIG.md
- **部署阶段**：DEPLOY.md → PROJECT_BUILD_LOG.md

---
**配置时间**: ~15分钟 | **验证时间**: ~10分钟 | **总计**: ~25分钟