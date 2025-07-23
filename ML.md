## 📊 框架版本矩阵与两阶段环境配置

### 环境配置总览

| 阶段 | 环境类型 | PyTorch版本 | PaddlePaddle版本 | CUDA版本 | 适用场景 |
|------|----------|-------------|------------------|----------|----------|
| **VENV调试** | CPU-only | 2.6.0+cpu | 2.6.0+cpu | N/A | 代码验证、快速调试 |
| **DOCKER部署** | GPU加速 | 2.6.0+cu126 | 2.6.0+gpu | 12.6 | 生产训练、性能优化 |

### VENV调试环境（CPU-only）

#### PyTorch CPU环境
```bash
# 创建调试环境
conda create -n ml-debug python=3.10
conda activate ml-debug

# PyTorch CPU版本
pip install torch==2.6.0+cpu torchvision==0.15.0+cpu torchaudio==2.0.0+cpu \
  --index-url https://download.pytorch.org/whl/cpu

# 验证安装
python -c "import torch; print(f'PyTorch: {torch.__version__}, CUDA: {torch.cuda.is_available()}')"
```

#### PaddlePaddle CPU环境
```bash
# PaddlePaddle CPU版本
pip install paddlepaddle==2.6.0 -f https://www.paddlepaddle.org.cn/whl/linux/cpu-mkl/avx/stable.html

# 验证安装
python -c "import paddle; print(f'PaddlePaddle: {paddle.__version__}, GPU: {paddle.is_compiled_with_cuda()}')"
```

#### 通用依赖（CPU环境）
```bash
pip install pytorch-lightning==2.0.0 omegaconf==2.3.0 \
  torchmetrics==0.11.0 scikit-learn==1.3.0 \
  matplotlib==3.7.0 seaborn==0.12.0 \
  tensorboard==2.13.0 wandb==0.15.0
```

### DOCKER部署环境（GPU加速）

#### 基础镜像选择

| 框架 | 官方镜像 | 标签 | 大小 |
|------|----------|------|------|
| PyTorch | pytorch/pytorch | 2.6.0-cuda12.6-cudnn9-devel | ~8GB |
| PaddlePaddle | paddlepaddle/paddle | 2.6.0-gpu-cuda12.6-cudnn9 | ~6GB |

#### Dockerfile模板

**PyTorch GPU版本**
```dockerfile
FROM pytorch/pytorch:2.6.0-cuda12.6-cudnn9-devel

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    git wget unzip \
    && rm -rf /var/lib/apt/lists/*

# 安装Python依赖
RUN pip install --no-cache-dir \
    pytorch-lightning==2.0.0 \
    omegaconf==2.3.0 \
    torchmetrics==0.11.0 \
    wandb==0.15.0 \
    tensorboard==2.13.0

WORKDIR /workspace
COPY . .
CMD ["python", "scripts/train.py"]
```

**PaddlePaddle GPU版本**
```dockerfile
FROM paddlepaddle/paddle:2.6.0-gpu-cuda12.6-cudnn9

# 安装Python依赖
RUN pip install --no-cache-dir \
    omegaconf==2.3.0 \
    scikit-learn==1.3.0 \
    matplotlib==3.7.0 \
    seaborn==0.12.0 \
    wandb==0.15.0 \
    tensorboard==2.13.0

WORKDIR /workspace
COPY . .
CMD ["python", "scripts/train.py"]
```

### 版本兼容性矩阵

#### Python版本支持
| Python | PyTorch | PaddlePaddle | 状态 |
|--------|---------|--------------|------|
| 3.8 | ✅ | ✅ | 稳定 |
| 3.9 | ✅ | ✅ | 推荐 |
| 3.10 | ✅ | ✅ | 推荐 |
| 3.11 | ⚠️ | ⚠️ | 测试版 |

#### CUDA版本兼容性
| CUDA版本 | PyTorch版本 | PaddlePaddle版本 | 驱动要求 |
|----------|-------------|------------------|----------|
| 11.8 | 2.0.0+ | 2.4.0+ | ≥ 515.00 |
| 12.1 | 2.1.0+ | 2.5.0+ | ≥ 530.00 |
| **12.6** | **2.6.0+** | **2.6.0+** | **≥ 535.00** |

#### 性能基准（ResNet-50 on ImageNet）

| 环境配置 | 训练时间/epoch | 内存使用 | GPU利用率 |
|----------|----------------|----------|-----------|
| **VENV CPU** | ~45分钟 | 2GB | N/A |
| **DOCKER 1xGPU** | ~8分钟 | 8GB | 95% |
| **DOCKER 4xGPU** | ~2.5分钟 | 32GB | 94% |

### 标准化项目结构模板

```
project_name/
├── src/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── {model_name}.py
│   ├── datasets/
│   │   ├── __init__.py
│   │   └── {dataset_name}.py
│   ├── configs/
│   │   ├── config.yaml
│   │   ├── model/
│   │   ├── data/
│   │   └── trainer/
│   └── utils/
│       └── visualization.py
├── scripts/
│   ├── __init__.py
│   ├── train.py
│   ├── eval.py
│   ├── download.py
│   └── test.py
├── deploy/
│   ├── cpu/
│   ├── gpu/
│   └── docker-compose.yml
├── requirements-cpu.txt
├── requirements-gpu.txt
├── README.md
└── PROJECT_BUILD_LOG.md
```

### 环境验证命令

#### VENV阶段验证
```bash
# Python版本
python --version  # 期望: Python 3.9-3.10

# PyTorch验证
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import torch; print(f'CPU可用: {torch.cuda.is_available()}')"

# PaddlePaddle验证
python -c "import paddle; print(f'PaddlePaddle: {paddle.__version__}')"
python -c "import paddle; print(f'GPU可用: {paddle.is_compiled_with_cuda()}')"

# 1-epoch快速测试
python scripts/train.py model=resnet18 data=cifar10 trainer.max_epochs=1 trainer.limit_train_batches=5
```

#### DOCKER阶段验证
```bash
# GPU检测
nvidia-smi

# Docker GPU支持
docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu20.04 nvidia-smi

# 容器内验证
docker exec my_project python -c "import torch; print(torch.cuda.device_count())"
```

### 依赖版本锁定

#### requirements-cpu.txt（调试环境）
```
torch==2.6.0+cpu
torchvision==0.15.0+cpu
pytorch-lightning==2.0.0
paddlepaddle==2.6.0
omegaconf==2.3.0
torchmetrics==0.11.0
```

#### requirements-gpu.txt（生产环境）
```
torch==2.6.0+cu126
torchvision==0.15.0+cu126
pytorch-lightning==2.0.0
paddlepaddle-gpu==2.6.0
omegaconf==2.3.0
torchmetrics==0.11.0
```

### 极简配置示例（OmegaConf驱动）

#### YAML配置文件结构
```
configs/
├── config.yaml           # 主配置（<20行）
├── model/
│   ├── resnet18.yaml     # ResNet18（<10行）
│   └── efficientnet.yaml # EfficientNet（<10行）
├── data/
│   ├── cifar10.yaml      # CIFAR-10（<10行）
│   └── imagenet.yaml     # ImageNet（<15行）
└── trainer/
    ├── default.yaml      # 默认训练（<15行）
    └── fast.yaml         # 快速训练（<10行）
```

#### 主配置文件示例
```yaml
# configs/config.yaml
defaults:
  - model: resnet18
  - data: cifar10  
  - trainer: default

model:
  num_classes: 10
  learning_rate: 1e-3

data:
  batch_size: 32
  num_workers: 4

trainer:
  max_epochs: 10
  accelerator: auto
  devices: auto
```

### 高层API实现（零样板代码）

#### PyTorch Lightning实现
```python
# 一行命令训练
python scripts/train.py model=resnet18 data=cifar10 trainer.max_epochs=10

# 多GPU训练（零代码修改）
python scripts/train.py trainer.devices=4 trainer.strategy=ddp

# 混合精度（单参数开关）
python scripts/train.py trainer.precision=16
```

#### PaddlePaddle高层API实现
```python
# 一行代码训练
model = ResNetClassifier(num_classes=10)
model.prepare(optimizer, loss, metrics)
model.fit(train_dataset, val_dataset, epochs=10)

# 多GPU训练（自动检测）
paddle.set_device('gpu:0,1,2,3')
model.fit(train_dataset, val_dataset, epochs=10)
```

### 故障排除

#### 常见问题
| 问题 | VENV阶段 | DOCKER阶段 | 解决方案 |
|------|----------|------------|----------|
| CUDA不可用 | 正常现象 | 检查驱动 | 更新NVIDIA驱动 |
| 内存不足 | 减小batch_size | 减小batch_size | 使用gradient accumulation |
| 版本冲突 | 重新创建环境 | 重建镜像 | 使用指定版本 |

#### 性能优化建议
- **VENV阶段**: 使用CPU的MKL加速
- **DOCKER阶段**: 启用混合精度训练
- **多GPU**: 使用DDP策略和梯度累积