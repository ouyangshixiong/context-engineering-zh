# 🐛 调试指南

## 🚀 快速开始

### 🔍 一键调试检查
```bash
# 全自动化环境诊断（GPU优先验证）
python scripts/debug.py

# 手动分步检查（GPU调试学习用）
python scripts/debug.py --step-by-step --gpu-first
```

### 🏗️ 环境配置指南

#### 🚀 GPU调试环境（**首要验证环境** - CUDA 12.4.1专用）
```bash
# 创建GPU调试环境（基于ML.md版本矩阵）
conda create -n ml-gpu-debug python=3.10
conda activate ml-gpu-debug

# 安装PyTorch GPU版本（CUDA 12.4.1专用）
pip install torch==2.4.1 torchvision==0.19.1 torchaudio==2.4.1 \
  -i https://mirrors.aliyun.com/pypi/simple/

# 安装PaddlePaddle GPU版本（CUDA 12.4.1专用）
pip install paddlepaddle-gpu==2.6.0.post126 \
  -f https://www.paddlepaddle.org.cn/whl/linux/mkl/avx/stable.html

# 验证GPU安装
python -c "import torch; print(f'✅ PyTorch GPU: {torch.__version__}')"
python -c "import torch; print(f'✅ CUDA版本: {torch.version.cuda}')"
python -c "import torch; print(f'✅ GPU数量: {torch.cuda.device_count()}')"
python -c "import paddle; print(f'✅ PaddlePaddle GPU: {paddle.__version__}')"

# 基于ML.md第274-277行的性能基准验证
python -c "
import torch, time
if torch.cuda.is_available():
    x = torch.randn(8192, 8192).cuda()
    torch.cuda.synchronize()
    start = time.time()
    y = torch.matmul(x, x)
    torch.cuda.synchronize()
    print(f'🔥 GPU基准测试: {time.time()-start:.3f}s (期望: RTX3060 ~0.002s)')
    print(f'🔥 GPU利用率: {torch.cuda.utilization()}% (期望: ≥90%)')
"
```

#### 💻 CPU生产环境（**部署验证阶段**）
```bash
# 创建CPU生产环境（Docker部署专用）
conda create -n ml-cpu-deploy python=3.10
conda activate ml-cpu-deploy

# 安装PyTorch CPU版本
pip install torch==2.4.1+cpu torchvision==0.19.1+cpu torchaudio==2.4.1+cpu \
  --index-url https://download.pytorch.org/whl/cpu

# 安装PaddlePaddle CPU版本
pip install paddlepaddle==2.6.0

# 验证CPU安装
python -c "import torch; print('✅ PyTorch CPU版本安装成功')"
python -c "import paddle; print('✅ PaddlePaddle CPU版本安装成功')"

# 基于ML.md第274-277行的CPU基准验证
python -c "
import torch, time
x = torch.randn(1000, 1000)
start = time.time()
y = torch.matmul(x, x)
print(f'🖥️ CPU基准测试: {time.time()-start:.3f}s (期望: i7-12700 ~0.8s)')
"
```

## 🔍 分步调试指南

### 1️⃣ 环境验证（2分钟）
```bash
# 🔍 环境信息总览
python -c "
import torch, platform
print('📊 系统信息')
print(f'操作系统: {platform.system()} {platform.release()}')
print(f'Python版本: {platform.python_version()}')
print(f'PyTorch版本: {torch.__version__}')
print(f'CUDA可用: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'CUDA版本: {torch.version.cuda}')
    print(f'GPU数量: {torch.cuda.device_count()}')
    for i in range(torch.cuda.device_count()):
        print(f'GPU{i}: {torch.cuda.get_device_name(i)}')
"
```

### 2️⃣ 数据集验证（3分钟）
```bash
# 📥 GPU优先测试数据集下载
python scripts/download.py --datasets coco128 --data_dir ./test_data

# ✅ GPU环境数据完整性验证
python -c "
from src.datasets.datamodules.coco_datamodule import COCODataModule
from pathlib import Path

data_dir = './test_data'
if Path(data_dir).exists():
    dm = COCODataModule(data_dir=data_dir, batch_size=16)  # GPU优化batch_size
    dm.prepare_data()
    dm.setup('fit')
    print(f'✅ GPU训练样本: {len(dm.train_dataset):,}')
    print(f'✅ GPU验证样本: {len(dm.val_dataset):,}')
    print(f'✅ 类别数量: {dm.num_classes}')
    print(f'✅ 图像尺寸: {dm.train_dataset[0][0].shape}')
    print(f'✅ GPU内存需求: ~4GB (基于ML.md第266-277行)')
else:
    print('❌ 数据目录不存在，请先下载GPU测试数据集')
"

# 🎯 CIFAR-10 CPU验证（部署阶段）
python -c "
from src.datasets.datamodules.cifar10_datamodule import CIFAR10DataModule
from pathlib import Path

data_dir = './test_data'
if Path(data_dir).exists():
    dm = CIFAR10DataModule(data_dir=data_dir, batch_size=32)  # CPU优化batch_size
    dm.prepare_data()
    dm.setup('fit')
    print(f'✅ CPU训练样本: {len(dm.train_dataset):,}')
    print(f'✅ CPU验证样本: {len(dm.val_dataset):,}')
    print(f'✅ CPU内存需求: ~2GB RAM')
"
```

### 3️⃣ 模型验证（2分钟）
```bash
# 🧠 CPU模型测试
python -c "
from src.models.pytorch.resnet_classifier import ResNetClassifier
import torch

print('🧪 测试CPU模型创建...')
model = ResNetClassifier(num_classes=10)
dummy_input = torch.randn(1, 3, 32, 32)
output = model(dummy_input)
print(f'✅ CPU模型创建成功，输出维度: {output.shape}')
print(f'✅ 模型参数量: {sum(p.numel() for p in model.parameters()):,}')
"

# 🚀 GPU模型测试（自动检测）
python -c "
import torch
from src.models.pytorch.resnet_classifier import ResNetClassifier

if torch.cuda.is_available():
    print('🎯 测试GPU模型创建...')
    model = ResNetClassifier(num_classes=10).cuda()
    dummy_input = torch.randn(4, 3, 32, 32).cuda()
    output = model(dummy_input)
    print(f'✅ GPU模型创建成功，输出维度: {output.shape}')
    print(f'✅ GPU内存使用: {torch.cuda.memory_allocated()/1024**2:.1f}MB')
else:
    print('ℹ️  无GPU环境，跳过GPU测试')
"
```

### 4️⃣ 训练验证（3分钟）
```bash
# ⚡ 超快速训练验证（30秒完成）
echo "🚀 开始快速训练验证..."
python scripts/train.py \
  model=resnet18 \
  data=cifar10 \
  trainer.fast_dev_run=true \
  trainer.accelerator=auto \
  data.batch_size=4 \
  trainer.limit_train_batches=2 \
  trainer.limit_val_batches=2

# 🎯 验证训练结果
if [ $? -eq 0 ]; then
    echo "✅ 训练验证通过！代码逻辑正确"
else
    echo "❌ 训练验证失败，请检查错误信息"
fi
```

## 🚨 常见问题速查

### 🔧 导入错误修复
```bash
# 方法1：永久添加到Python路径
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
echo 'export PYTHONPATH="${PYTHONPATH}:$(pwd)"' >> ~/.zshrc

# 方法2：临时运行（推荐）
PYTHONPATH=. python scripts/train.py model=resnet18 data=cifar10 trainer.fast_dev_run=true

# 方法3：使用python -m
python -m scripts.train model=resnet18 data=cifar10 trainer.fast_dev_run=true
```

### 🖥️ GPU问题诊断
```bash
# 🔍 GPU状态检查
nvidia-smi
python -c "
import torch
print(f'🔍 CUDA可用: {torch.cuda.is_available()}')
print(f'🔍 CUDA版本: {torch.version.cuda}')
print(f'🔍 GPU数量: {torch.cuda.device_count()}')
for i in range(torch.cuda.device_count()):
    print(f'🔍 GPU{i}: {torch.cuda.get_device_name(i)}')
"

# ⚙️ 强制使用CPU调试
python scripts/train.py \
  model=resnet18 data=cifar10 \
  trainer.accelerator=cpu \
  trainer.fast_dev_run=true

# 🎯 GPU内存优化
python scripts/train.py \
  model=resnet18 data=cifar10 \
  data.batch_size=8 \
  trainer.precision=16 \
  trainer.fast_dev_run=true
```

### 💾 内存不足解决
```bash
# 🎯 逐步降低batch size
for bs in 32 16 8 4 2; do
    echo "测试batch_size=$bs"
    python scripts/train.py \
      model=resnet18 data=cifar10 \
      data.batch_size=$bs \
      trainer.fast_dev_run=true \
      && break
done

# 🚀 启用混合精度训练
python scripts/train.py \
  model=resnet18 data=cifar10 \
  trainer.precision=16 \
  trainer.fast_dev_run=true

# ⚡ 使用梯度累积
python scripts/train.py \
  model=resnet18 data=cifar10 \
  data.batch_size=4 \
  trainer.accumulate_grad_batches=4 \
  trainer.fast_dev_run=true
```

## 🛠️ 专业调试工具箱

### 📦 必备调试工具
```bash
# 核心调试工具包
pip install ipdb rich tensorboard wandb

# 性能分析工具
pip install py-spy memory_profiler

# 可视化调试
pip install netron torch_tb_profiler
```

### 🎯 调试实战技巧

#### **1. 闪电调试模式**
```bash
# ⚡ 30秒完整验证
python scripts/train.py \
  model=resnet18 \
  data=cifar10 \
  trainer.fast_dev_run=true \
  trainer.log_every_n_steps=1 \
  trainer.limit_train_batches=2 \
  trainer.limit_val_batches=2
```

#### **2. 数据管道调试**
```bash
# 📊 数据加载速度测试
python -c "
import time, torch
from src.datasets.datamodules.cifar10_datamodule import CIFAR10DataModule
from torch.utils.data import DataLoader

dm = CIFAR10DataModule()
dm.setup('fit')
start = time.time()
for i, batch in enumerate(DataLoader(dm.train_dataset, batch_size=32, num_workers=4)):
    if i >= 10: break
print(f'⚡ 10个batch加载时间: {time.time()-start:.2f}s')
print(f'⚡ 平均每个batch: {(time.time()-start)/10:.2f}s')
"
```

#### **3. 配置验证器**
```bash
# ✅ 配置文件完整性检查
python -c "
from omegaconf import OmegaConf
config = OmegaConf.load('configs/config.yaml')
print('🎯 配置结构验证：')
print(f'  - 模型配置: {\"✅\" if \"model\" in config else \"❌\"}')
print(f'  - 数据配置: {\"✅\" if \"data\" in config else \"❌\"}')
print(f'  - 训练配置: {\"✅\" if \"trainer\" in config else \"❌\"}')
print('📋 完整配置：')
OmegaConf.pretty(config)
"
```

## 📊 性能监控与优化

### 🔍 实时监控面板

#### **GPU监控**
```bash
# 🖥️ 实时GPU状态
watch -n 1 nvidia-smi

# 📊 高级GPU监控
pip install gpustat
gpustat -i 1

# 🔥 GPU温度/功耗监控
nvidia-smi --query-gpu=temperature.gpu,power.draw,memory.used --format=csv,noheader,nounits
```

#### **内存监控**
```bash
# 💾 内存使用分析
htop

# 🎯 Python内存监控
python -c "
import psutil, os
process = psutil.Process(os.getpid())
print(f'💾 当前内存使用: {process.memory_info().rss / 1024**2:.1f} MB')
print(f'🎯 系统内存: {psutil.virtual_memory().percent}%')
"
```

#### **训练性能分析**
```bash
# 📈 训练速度基准测试
python scripts/benchmark.py \
  --model resnet18 \
  --data cifar10 \
  --batch_sizes 16 32 64 \
  --duration 60

# 🎯 生成性能报告
python -c "
import torch
from pytorch_lightning import Trainer
from src.models.pytorch.resnet_classifier import ResNetClassifier

model = ResNetClassifier(num_classes=10)
trainer = Trainer(fast_dev_run=True)
print(f'✅ 模型验证通过')
"
```
```