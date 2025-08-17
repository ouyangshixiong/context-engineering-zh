# 🔧 GPU调试环境配置指南

> 专为GPU训练验证设计的高性能环境，支持PyTorch和PaddlePaddle GPU加速

## 🎯 环境概述

| 组件 | 版本 | 用途 | 备注 |
|------|------|------|------|
| Python | 3.9-3.10 | 运行环境 | 支持PyTorch和PaddlePaddle |
| PyTorch | 2.4.1 | 深度学习框架 | GPU加速版本 |
| PaddlePaddle | 2.6.0+gpu | 深度学习框架 | GPU加速版本 |
| CUDA | 12.4.1 | GPU计算 | 稳定兼容版 |
| GPU需求 | ≥ 6GB显存 | 训练要求 | RTX 3060以上 |
| 内存需求 | ≥ 8GB | 运行要求 | 支持batch_size=64 |

## 🚀 一键安装

### 方案1: Python虚拟环境（推荐 - AI Agent友好）

```bash
# 创建虚拟环境
python -m venv ml-gpu-debug
source ml-gpu-debug/bin/activate  # Linux/Mac
# 或 ml-gpu-debug\Scripts\activate  # Windows

# 升级pip
python -m pip install --upgrade pip

# 安装GPU版本依赖
pip install -r requirements-gpu.txt

# 验证安装
python -c "import torch; print('✅ PyTorch GPU OK'); print(f'CUDA: {torch.version.cuda}')"
python -c "import paddle; print('✅ PaddlePaddle GPU OK'); print(f'GPU: {paddle.is_compiled_with_cuda()}')"
```

### 方案2: Conda环境（可选）

```bash
# 创建并激活环境
conda create -n ml-gpu-debug python=3.10 -y
conda activate ml-gpu-debug

# 安装GPU版本依赖
pip install -r requirements-gpu.txt

# 验证安装
python -c "import torch; print('✅ PyTorch GPU OK'); print(f'CUDA: {torch.version.cuda}')"
python -c "import paddle; print('✅ PaddlePaddle GPU OK'); print(f'GPU: {paddle.is_compiled_with_cuda()}')"
```

## 📋 详细安装步骤

### 1. Python环境准备（基于ML.md版本约束）

```bash
# 检查Python版本（参考ML.md版本兼容性章节）
python --version  # 期望: Python 3.9-3.10（避免3.11测试版）

# 验证GPU硬件（ML.md性能基准章节数据）
python -c "
import subprocess
try:
    result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
    if result.returncode == 0:
        print('✅ NVIDIA GPU检测成功')
        print(result.stdout.split('\n')[8])
    else:
        print('❌ 未检测到NVIDIA GPU')
except:
    print('❌ nvidia-smi命令不可用')
"

# 检查GPU内存需求（ML.md性能基准章节数据）
python -c "
import subprocess
import re
try:
    result = subprocess.run(['nvidia-smi', '--query-gpu=memory.total', '--format=csv,noheader,nounits'], 
                          capture_output=True, text=True)
    memory_mb = int(result.stdout.strip())
    memory_gb = memory_mb / 1024
    print(f'GPU内存: {memory_gb:.1f}GB (最低要求: 6GB)')
    if memory_gb < 6:
        print('⚠️ GPU内存不足，建议使用更小batch_size')
except:
    print('❌ 无法检测GPU内存')
"

# 更新pip
python -m pip install --upgrade pip setuptools wheel
```

### 2. PyTorch GPU安装（基于ML.md版本矩阵）

```bash
# PyTorch GPU版本（ML.md版本兼容性章节CUDA12.4对应版本）
pip install torch==2.4.1 torchvision==0.19.1 torchaudio==2.4.1 \
-i https://mirrors.aliyun.com/pypi/simple/

# 验证安装（ML.md验证标准章节）
python -c "
import torch
print(f'PyTorch版本: {torch.__version__}')
print(f'CUDA可用: {torch.cuda.is_available()}')  # 必须为True
print(f'GPU数量: {torch.cuda.device_count()}')
print(f'GPU名称: {torch.cuda.get_device_name(0)}')

# GPU性能基准测试（ML.md性能基准章节）
import time
if torch.cuda.is_available():
    x = torch.randn(1000, 1000).cuda()
    torch.cuda.synchronize()
    start = time.time()
    y = torch.matmul(x, x)
    torch.cuda.synchronize()
    elapsed = time.time() - start
    print(f'GPU计算速度: {elapsed:.3f}s (参考值: RTX 3060 ~0.002s)')
    print(f'GPU内存: {torch.cuda.memory_allocated()/1024**3:.1f}GB')
"
```

### 3. PaddlePaddle GPU安装（基于ML.md版本矩阵）

```bash
# PaddlePaddle GPU版本（ML.md版本兼容性章节CUDA12.4对应版本）
pip install paddlepaddle-gpu==2.6.0.post126 \
  -f https://www.paddlepaddle.org.cn/whl/linux/mkl/avx/stable.html

# 验证安装（ML.md验证标准章节）
python -c "
import paddle
print(f'PaddlePaddle版本: {paddle.__version__}')
print(f'GPU编译: {paddle.is_compiled_with_cuda()}')  # 必须为True
print(f'GPU设备: {paddle.device.get_device()}')

# GPU性能基准测试（ML.md第274-277行）
import time
if paddle.is_compiled_with_cuda():
    paddle.set_device('gpu:0')
    x = paddle.randn([1000, 1000])
    start = time.time()
    y = paddle.matmul(x, x)
    elapsed = time.time() - start
    print(f'PaddlePaddle GPU计算速度: {elapsed:.3f}s')
    print(f'GPU内存: {paddle.device.cuda.max_memory_allocated()/1024**3:.1f}GB')
"
```

### 4. 通用依赖安装

```bash
# 安装通用依赖
pip install pytorch-lightning==2.0.0 \
  omegaconf==2.3.0 \
  torchmetrics==0.11.0 \
  scikit-learn==1.3.0 \
  matplotlib==3.7.0 \
  seaborn==0.12.0 \
  tensorboard==2.13.0 \
  wandb==0.15.0 \
  ipdb==0.13.13 \
  rich==13.4.0 -i https://mirrors.aliyun.com/pypi/simple/
```

## 🧪 环境验证

### 1. 基础验证

```bash
# 创建验证脚本
cat > validate_env.py << 'EOF'
import torch
import paddle
import pytorch_lightning as pl
import omegaconf
import torchmetrics

print("=== 环境验证报告 ===")
print(f"Python版本: {torch.__import__('sys').version}")
print(f"PyTorch版本: {torch.__version__}")
print(f"PaddlePaddle版本: {paddle.__version__}")
print(f"PyTorch Lightning版本: {pl.__version__}")
print(f"OmegaConf版本: {omegaconf.__version__}")
print(f"TorchMetrics版本: {torchmetrics.__version__}")

# 测试CPU计算
x = torch.randn(1000, 1000)
y = torch.matmul(x, x)
print(f"✅ CPU计算测试: {y.shape}")

# 测试PaddlePaddle
x_paddle = paddle.randn([1000, 1000])
y_paddle = paddle.matmul(x_paddle, x_paddle)
print(f"✅ PaddlePaddle计算测试: {y_paddle.shape}")

print("=== 环境验证完成 ===")
EOF

# 运行验证
python validate_env.py
```

### 2. 项目集成验证

```bash
# 验证项目导入
python -c "
import sys
sys.path.append('.')
from src.models.pytorch.yolov10 import YOLOv10
from src.datasets.coco_detection import COCODetection
print('✅ 项目模块导入成功')
"

# 验证配置文件
python -c "
from omegaconf import OmegaConf
cfg = OmegaConf.load('configs/config.yaml')
print('✅ 配置文件加载成功')
print(f'模型: {cfg.model.get("name", "yolov10")}')
print(f'数据集: {cfg.data.get("name", "coco2017")}')
"
```

### 3. 快速训练测试

```bash
# GPU 1-epoch快速测试
python scripts/train.py \
  model=yolov10n \
  data=coco128 \
  trainer.max_epochs=1 \
  trainer.accelerator=gpu \
  trainer.devices=1 \
  trainer.limit_train_batches=5 \
  trainer.limit_val_batches=5 \
  trainer.fast_dev_run=true \
  trainer.precision=16

# 验证训练结果
ls -la logs/lightning_logs/version_0/
```

## 🔍 性能优化（基于ML.md基准数据）

### GPU性能调优（ML.md性能基准章节参考）

```bash
# GPU性能优化设置
python -c "
import torch
import time

# GPU设备检测和优化
if torch.cuda.is_available():
    print(f'检测到 {torch.cuda.device_count()} 个GPU')
    
    # 性能基准验证
    x = torch.randn(8192, 8192).cuda()
    torch.cuda.synchronize()
    start = time.time()
    y = torch.matmul(x, x)
    torch.cuda.synchronize()
    elapsed = time.time() - start
    print(f'GPU矩阵乘法: 8192×8192 用时 {elapsed:.3f}s')
    print(f'GPU利用率: {torch.cuda.utilization()}%')
    print(f'GPU内存: {torch.cuda.memory_allocated()/1024**3:.1f}GB')
    
    # 自动优化设置
    torch.backends.cudnn.benchmark = True
    torch.backends.cudnn.deterministic = False
    
    # 内存管理
    torch.cuda.empty_cache()
    print('✅ GPU性能优化完成')
else:
    print('❌ 未检测到GPU')
"
```

### GPU内存管理（基于ML.md性能基准章节）

```bash
# GPU内存精确计算（基于ML.md第2章内存需求公式）
python -c "
import torch
import psutil

# GPU内存精确计算
print('=== GPU内存需求评估 ===')
if torch.cuda.is_available():
    gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
    print(f'GPU总内存: {gpu_memory:.1f}GB')
    
    # 基于ML.md第2章的精确计算公式
    memory_requirements = {
        'YOLOv10n': {
            'model_params': 3.5,      # GB
            'activation': 1.2,        # GB per batch=16
            'optimizer': 7.0,         # GB (参数*2)
            'data_cache': 2.0,        # GB
            'total': 13.7             # GB with 50%安全余量
        },
        'YOLOv10s': {
            'model_params': 5.0,      # GB
            'activation': 2.4,        # GB per batch=32
            'optimizer': 10.0,        # GB
            'data_cache': 3.0,        # GB
            'total': 20.0             # GB
        },
        'YOLOv10m': {
            'model_params': 8.0,      # GB
            'activation': 4.8,        # GB per batch=64
            'optimizer': 16.0,        # GB
            'data_cache': 4.0,        # GB
            'total': 32.0             # GB
        }
    }
    
    for model, specs in memory_requirements.items():
        if gpu_memory >= specs['total'] * 1.2:  # 20%安全余量
            max_batch = int((gpu_memory / specs['total']) * 16)
            print(f'{model}: ✅ 推荐batch_size={max_batch} (需要{specs[\"total\"]}GB)')
        else:
            print(f'{model}: ⚠️ 内存不足 (需要{specs[\"total\"]}GB)')

print('=== 系统内存监控 ===')
mem = psutil.virtual_memory()
print(f'系统内存使用: {mem.percent}%')
print(f'系统可用内存: {mem.available // 1024**3} GB')

# 内存优化策略（基于ML.md性能基准）
memory_strategies = {
    'RTX 3060 (12GB)': {'batch_size': 32, 'precision': 16, 'accumulate': 2},
    'RTX 3080 (10GB)': {'batch_size': 24, 'precision': 16, 'accumulate': 3},
    'RTX 4090 (24GB)': {'batch_size': 64, 'precision': 16, 'accumulate': 1},
    'A100 (40GB)': {'batch_size': 128, 'precision': 16, 'accumulate': 1}
}

for gpu, config in memory_strategies.items():
    print(f'{gpu}: batch={config[\"batch_size\"]}, precision={config[\"precision\"]}, accumulate={config[\"accumulate\"]}')

# 自动内存优化建议
if torch.cuda.is_available():
    gpu_name = torch.cuda.get_device_name(0)
    gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
    
    if gpu_memory >= 20:
        print('🚀 推荐配置：大批量训练 + 混合精度')
    elif gpu_memory >= 8:
        print('⚡ 推荐配置：中批量训练 + 梯度累积')
    else:
        print('⚠️ 推荐配置：小批量训练 + CPU辅助')
"
```

## 🚨 常见问题解决

### 问题1: CUDA版本不匹配
```bash
# 错误: CUDA driver version is insufficient
# 解决方案：检查NVIDIA驱动版本
nvidia-smi
# 要求驱动版本 ≥ 530.x (支持CUDA 12.4)

# 如果版本过低，升级驱动
# Ubuntu示例：
sudo apt update && sudo apt install nvidia-driver-535
```

### 问题2: GPU内存不足
```bash
# 错误: CUDA out of memory
# 解决方案：基于ML.md内存计算公式自动调整
python -c "
import torch
import math

# 获取GPU内存信息
gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
print(f'GPU内存: {gpu_memory:.1f}GB')

# 基于ML.md内存计算公式推荐batch_size
# 公式: GPU内存 = 模型参数 + 激活值 + 优化器状态 + 数据缓存
model_memory = {
    'yolov10n': 3.5,  # GB
    'yolov10s': 5.0,  # GB  
    'yolov10m': 8.0,  # GB
    'yolov10l': 12.0, # GB
    'yolov10x': 24.0  # GB
}

# 计算推荐batch_size
for model, mem in model_memory.items():
    if gpu_memory >= mem * 1.2:  # 20%安全余量
        batch_size = int(gpu_memory / mem * 8)  # 经验公式
        print(f'{model} 推荐batch_size: {max(4, min(batch_size, 64))}')
"

# 实际应用示例
python scripts/train.py \
  model=yolov10n \
  data=coco128 \
  trainer.batch_size=16 \
  trainer.accumulate_grad_batches=2 \
  trainer.precision=16
```

### 问题3: 版本冲突
```bash
# 错误: PyTorch CUDA版本不匹配
# 解决方案：使用精确版本匹配
pip uninstall torch torchvision torchaudio
pip install torch==2.4.1 torchvision==0.19.1 torchaudio==2.4.1 \
  -i https://mirrors.aliyun.com/pypi/simple/

# 验证CUDA版本匹配
python -c "
import torch
print(f'PyTorch版本: {torch.__version__}')
print(f'CUDA版本: {torch.version.cuda}')
print(f'期望CUDA: 12.4')
assert torch.version.cuda == '12.4', 'CUDA版本不匹配'
print('✅ CUDA版本匹配成功')
"

# PaddlePaddle版本匹配
pip uninstall paddlepaddle-gpu
pip install paddlepaddle-gpu==2.6.0.post126 \
  -f https://www.paddlepaddle.org.cn/whl/linux/mkl/avx/stable.html

# 验证PaddlePaddle GPU
python -c "
import paddle
print(f'PaddlePaddle版本: {paddle.__version__}')
print(f'GPU编译: {paddle.is_compiled_with_cuda()}')
assert paddle.is_compiled_with_cuda(), 'PaddlePaddle未启用GPU'
print('✅ PaddlePaddle GPU验证成功')
"
```

## 📊 资源使用基准（基于ML.md第266-277行）

### GPU内存使用参考（ML.md第266-277行验证数据）
| 任务类型 | Batch Size | GPU内存使用 | 训练时间/epoch | GPU利用率 | 数据来源 |
|----------|------------|-------------|----------------|-----------|----------|
| CIFAR-10 | 32 | ~2GB | ~8秒 | 95% | ML.md第266行 |
| ImageNet | 32 | ~8GB | ~8分钟 | 94% | ML.md第267行 |
| COCO128 | 16 | ~4GB | ~45秒 | 95% | ML.md第267行 |
| COCO2017 | 32 | ~8GB | ~45分钟 | 93% | ML.md第267行 |

### GPU性能基准（ML.md第274-277行基准数据）
| GPU型号 | 显存 | COCO128训练时间 | COCO2017训练时间 | GPU利用率 | 数据来源 |
|---------|------|-----------------|------------------|-----------|----------|
| RTX 3060 | 12GB | ~45秒/epoch | ~45分钟/epoch | 95% | ML.md第274行 |
| RTX 3080 | 10GB | ~35秒/epoch | ~35分钟/epoch | 94% | ML.md第274行 |
| RTX 4090 | 24GB | ~25秒/epoch | ~25分钟/epoch | 93% | ML.md第275行 |
| A100 | 40GB | ~15秒/epoch | ~15分钟/epoch | 92% | ML.md第275行 |

### CPU部署性能参考（用于生产环境推理）
| CPU类型 | 线程数 | COCO128推理时间 | COCO2017推理时间 | 内存使用 | 数据来源 |
|---------|--------|-----------------|------------------|----------|----------|
| Intel i7-12700 | 8 | ~200ms/张 | ~200ms/张 | ~2GB RAM | ML.md第274行 |
| Apple M1 | 8 | ~180ms/张 | ~180ms/张 | ~1.5GB RAM | ML.md第274行 |
| AMD Ryzen 5800X | 8 | ~220ms/张 | ~220ms/张 | ~2GB RAM | ML.md第275行 |

## 🔄 环境切换

### 从CPU切换到GPU环境

```bash
# 备份CPU环境（虚拟环境）
source ml-debug/bin/activate
pip freeze > cpu-requirements.txt

# 或Conda环境备份
conda env export > cpu-environment.yml

# 创建GPU环境（推荐虚拟环境）
python -m venv ml-gpu
source ml-gpu/bin/activate
pip install -r requirements-gpu.txt

# 或Conda GPU环境
conda create -n ml-gpu python=3.10 -y
conda activate ml-gpu
pip install -r requirements-gpu.txt

# 验证GPU环境
python -c "
import torch
print(f'GPU可用: {torch.cuda.is_available()}')
print(f'GPU数量: {torch.cuda.device_count()}')
"
```

## 📋 环境检查清单

### 安装验证
- [ ] Python 3.9-3.10
- [ ] PyTorch CPU版本
- [ ] PaddlePaddle CPU版本
- [ ] 所有依赖安装成功

### 功能验证
- [ ] 基础导入测试
- [ ] 配置文件加载
- [ ] 模型定义测试
- [ ] 数据集加载
- [ ] 1-epoch训练测试

### 性能验证
- [ ] CPU线程设置正确
- [ ] 内存使用合理
- [ ] 训练速度达标

## 🎯 下一步

完成CPU环境配置后：
1. 运行 [DEBUG_CODE.md](./DEBUG_CODE.md) 进行代码验证
2. 配置 [DOCKER_CONFIG.md](./DOCKER_CONFIG.md) 进行GPU部署
3. 更新 [PROJECT_BUILD_LOG.md](./PROJECT_BUILD_LOG.md)

**注意**：项目创建前请先完成CREATE.md的think hard规划，将结果写入INITIAL.md

---
**配置时间**: ~5分钟 | **验证时间**: ~2分钟 | **总计**: ~7分钟