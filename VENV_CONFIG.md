# 🔧 CPU调试环境配置指南

> 专为代码验证设计的CPU-only环境，避免GPU配置复杂性

## 🎯 环境概述

| 组件 | 版本 | 用途 | 备注 |
|------|------|------|------|
| Python | 3.9-3.10 | 运行环境 | 支持PyTorch和PaddlePaddle |
| PyTorch | 2.6.0+cpu | 深度学习框架 | CPU专用版本 |
| PaddlePaddle | 2.6.0+cpu | 深度学习框架 | CPU专用版本 |
| 内存需求 | ≥ 4GB | 运行要求 | 支持batch_size=32 |

## 🚀 一键安装

### 方案1: Python虚拟环境（推荐 - AI Agent友好）

```bash
# 创建虚拟环境
python -m venv ml-debug
source ml-debug/bin/activate  # Linux/Mac
# 或 ml-debug\Scripts\activate  # Windows

# 升级pip
python -m pip install --upgrade pip

# 安装CPU版本依赖
pip install -r requirements-cpu.txt

# 验证安装
python -c "import torch; print('✅ PyTorch CPU OK')"
python -c "import paddle; print('✅ PaddlePaddle CPU OK')"
```

### 方案2: Conda环境（可选）

```bash
# 创建并激活环境
conda create -n ml-debug python=3.10 -y
conda activate ml-debug

# 安装CPU版本依赖
pip install -r requirements-cpu.txt

# 验证安装
python -c "import torch; print('✅ PyTorch CPU OK')"
python -c "import paddle; print('✅ PaddlePaddle CPU OK')"
```

## 📋 详细安装步骤

### 1. Python环境准备（基于ML.md版本约束）

```bash
# 检查Python版本（参考ML.md版本兼容性章节）
python --version  # 期望: Python 3.9-3.10（避免3.11测试版）

# 验证CPU架构（ML.md性能基准章节参考）
python -c "import platform; print(f'CPU: {platform.processor()}')"

# 检查内存需求（ML.md性能基准章节数据）
python -c "
import psutil
mem_gb = psutil.virtual_memory().total / 1024**3
print(f'系统内存: {mem_gb:.1f}GB (最低要求: 4GB)')
if mem_gb < 4:
    print('⚠️ 内存不足，建议使用更小batch_size')
"

# 更新pip
python -m pip install --upgrade pip setuptools wheel
```

### 2. PyTorch CPU安装（基于ML.md版本矩阵）

```bash
# PyTorch CPU版本（ML.md版本兼容性章节CUDA12.6对应版本）
pip install torch==2.6.0+cpu torchvision==0.15.0+cpu torchaudio==2.0.0+cpu \
  --index-url https://download.pytorch.org/whl/cpu

# 验证安装（ML.md验证标准章节）
python -c "
import torch
print(f'PyTorch版本: {torch.__version__}')
print(f'CUDA可用: {torch.cuda.is_available()}')  # 必须为False
print(f'CPU线程数: {torch.get_num_threads()}')

# 性能基准测试（ML.md性能基准章节）
import time
x = torch.randn(1000, 1000)
start = time.time()
y = torch.matmul(x, x)
elapsed = time.time() - start
print(f'CPU计算速度: {elapsed:.3f}s (参考值: Intel i7-12700 ~0.1s)')
"
```

### 3. PaddlePaddle CPU安装（基于ML.md版本矩阵）

```bash
# PaddlePaddle CPU版本（ML.md版本兼容性章节CUDA12.6对应版本）
pip install paddlepaddle==2.6.0 \
  -f https://www.paddlepaddle.org.cn/whl/linux/cpu-mkl/avx/stable.html

# 验证安装（ML.md验证标准章节）
python -c "
import paddle
print(f'PaddlePaddle版本: {paddle.__version__}')
print(f'GPU编译: {paddle.is_compiled_with_cuda()}')  # 必须为False
print(f'CPU线程数: {paddle.get_num_threads()}')

# 性能基准测试（ML.md第274-277行）
import time
x = paddle.randn([1000, 1000])
start = time.time()
y = paddle.matmul(x, x)
elapsed = time.time() - start
print(f'PaddlePaddle CPU计算速度: {elapsed:.3f}s')
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
  rich==13.4.0
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
# 1-epoch快速测试
python scripts/train.py \
  model=yolov10n \
  data=coco128 \
  trainer.max_epochs=1 \
  trainer.limit_train_batches=5 \
  trainer.limit_val_batches=5 \
  trainer.fast_dev_run=true

# 验证训练结果
ls -la logs/lightning_logs/version_0/
```

## 🔍 性能优化（基于ML.md基准数据）

### CPU性能调优（ML.md性能基准章节参考）

```bash
# 基于硬件自动设置线程数（ML.md性能基准章节参考）
CPU_CORES=$(python -c "import multiprocessing; print(multiprocessing.cpu_count())")
OPTIMAL_THREADS=$((CPU_CORES / 2))  # 避免超线程影响

export OMP_NUM_THREADS=$OPTIMAL_THREADS
export MKL_NUM_THREADS=$OPTIMAL_THREADS

# PyTorch CPU优化（ML.md性能基准章节验证标准）
python -c "
import torch
import time
torch.set_num_threads($OPTIMAL_THREADS)
torch.set_num_interop_threads($OPTIMAL_THREADS)

# 性能基准验证
x = torch.randn(2000, 2000)
start = time.time()
y = torch.matmul(x, x)
elapsed = time.time() - start
print(f'优化后CPU计算: {elapsed:.3f}s')
print(f'性能参考值: Intel i7-12700 ~0.4s/2000x2000矩阵乘法')
"

# PaddlePaddle CPU优化
python -c "
import paddle
import time
paddle.set_device('cpu')
paddle.set_num_threads($OPTIMAL_THREADS)

# 性能基准验证
x = paddle.randn([2000, 2000])
start = time.time()
y = paddle.matmul(x, x)
elapsed = time.time() - start
print(f'PaddlePaddle优化后: {elapsed:.3f}s')
"
```

### 内存管理（基于ML.md性能基准章节）

```bash
# 监控内存使用（基于ML.md性能基准）
python -c "
import psutil
mem = psutil.virtual_memory()
print(f'内存使用: {mem.percent}%')
print(f'可用内存: {mem.available // 1024**3} GB')

# 基于ML.md性能基准章节
print('=== 内存需求评估 ===')
print('CIFAR-10 + ResNet18: ~1GB')
print('ImageNet + ResNet50: ~2GB')  
print('COCO128 + YOLOv10: ~3GB')
print(f'当前可用: {mem.available // 1024**3}GB (建议≥4GB)')

# 内存优化建议
if mem.available < 4 * 1024**3:
    print('⚠️ 内存紧张，建议使用更小batch_size')
    print('建议: CIFAR-10 batch_size=16, ImageNet batch_size=8')
"
```

## 🚨 常见问题解决

### 问题1: 安装失败
```bash
# 错误: No matching distribution found
# 解决方案：更新pip和setuptools
python -m pip install --upgrade pip setuptools wheel

# 重新安装
pip install --no-cache-dir -r requirements-cpu.txt
```

### 问题2: 版本冲突
```bash
# 错误: Package version conflicts
# 解决方案：创建干净环境
# 虚拟环境方案
rm -rf ml-debug
python -m venv ml-debug
source ml-debug/bin/activate
pip install -r requirements-cpu.txt

# 或Conda方案
conda remove -n ml-debug --all -y
conda create -n ml-debug python=3.10 -y
conda activate ml-debug
pip install -r requirements-cpu.txt
```

### 问题3: 导入错误
```bash
# 错误: ImportError
# 解决方案：检查PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python -c "import sys; print(sys.path)"
```

## 📊 资源使用基准（基于ML.md第266-277行）

### 内存使用参考（ML.md第266-277行验证数据）
| 任务类型 | Batch Size | 内存使用 | 训练时间/epoch | 数据来源 |
|----------|------------|----------|----------------|----------|
| CIFAR-10 | 32 | ~1GB | ~45秒 | ML.md第266行 |
| ImageNet | 32 | ~2GB | ~45分钟 | ML.md第267行 |
| COCO128 | 16 | ~3GB | ~5分钟 | ML.md第267行 |

### CPU性能参考（ML.md第274-277行基准数据）
| CPU类型 | 线程数 | CIFAR-10训练时间 | ImageNet训练时间 | 数据来源 |
|---------|--------|------------------|------------------|----------|
| Intel i7-12700 | 8 | ~30秒/epoch | ~30分钟/epoch | ML.md第274行 |
| Apple M1 | 8 | ~25秒/epoch | ~25分钟/epoch | ML.md第274行 |
| AMD Ryzen 5800X | 8 | ~35秒/epoch | ~35分钟/epoch | ML.md第275行 |

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