# 🐛 调试指南

## 快速开始

### 一键调试检查
```bash
python scripts/debug.py
```

### 环境配置

#### CPU环境
```bash
conda create -n dl-cpu python=3.9 pytorch torchvision torchaudio cpuonly -c pytorch
conda activate dl-cpu
pip install pytorch-lightning hydra-core
```

#### GPU环境
```bash
conda create -n dl-gpu python=3.9 pytorch torchvision torchaudio pytorch-cuda=11.7 -c pytorch -c nvidia
conda activate dl-gpu
pip install pytorch-lightning hydra-core
```

## 调试步骤

### 1. 环境验证
```bash
# 检查PyTorch
python -c "import torch; print(f'PyTorch: {torch.__version__}')"

# 检查CUDA
python -c "import torch; print(f'CUDA可用: {torch.cuda.is_available()}')"

# 检查GPU
python -c "import torch; print(f'GPU数量: {torch.cuda.device_count()}')"
```

### 2. 数据集调试
```bash
# 下载测试数据
python scripts/download.py --datasets cifar10 --data_dir ./test_data

# 验证数据集
python -c "
from src.datasets.datamodules.cifar10_datamodule import CIFAR10DataModule
import pytorch_lightning as pl

dm = CIFAR10DataModule(data_dir='./test_data')
dm.prepare_data()
dm.setup('fit')
print(f'训练样本: {len(dm.train_dataset)}')
print(f'验证样本: {len(dm.val_dataset)}')
"
```

### 3. 模型调试
```bash
# CPU测试
python -c "
from src.models.pytorch.resnet_classifier import ResNetClassifier
model = ResNetClassifier(num_classes=10)
print('✓ CPU模型创建成功')
"

# GPU测试（如有GPU）
python -c "
import torch
from src.models.pytorch.resnet_classifier import ResNetClassifier
model = ResNetClassifier(num_classes=10)
if torch.cuda.is_available():
    model = model.cuda()
    print('✓ GPU模型创建成功')
else:
    print('无GPU，使用CPU')
"
```

### 4. 训练调试
```bash
# 快速训练测试（1个epoch，少量数据）
python scripts/train.py model=resnet18 data=cifar10 trainer.max_epochs=1 trainer.limit_train_batches=5 trainer.limit_val_batches=5 trainer.fast_dev_run=true

# 使用调试模式
python -m ipdb scripts/train.py model=resnet18 data=cifar10 trainer.fast_dev_run=true
```

## 常见问题

### 1. 导入错误
```bash
# 添加项目根目录到Python路径
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# 或临时运行
PYTHONPATH=. python scripts/train.py ...
```

### 2. CUDA错误
```bash
# 强制CPU运行
python scripts/train.py model=resnet18 data=cifar10 trainer.accelerator=cpu

# 检查CUDA版本
nvidia-smi
python -c "import torch; print(torch.version.cuda)"
```

### 3. 内存不足
```bash
# 减小batch size
python scripts/train.py model=resnet18 data=cifar10 data.batch_size=16

# 使用CPU
python scripts/train.py model=resnet18 data=cifar10 trainer.accelerator=cpu
```

## 调试工具

### 推荐工具安装
```bash
pip install ipdb rich tensorboard
```

### 调试技巧

1. **使用fast_dev_run**
   ```bash
   python scripts/train.py trainer.fast_dev_run=true
   ```

2. **限制数据量**
   ```bash
   python scripts/train.py trainer.limit_train_batches=10 trainer.limit_val_batches=10
   ```

3. **打印调试信息**
   ```bash
   python scripts/train.py trainer.log_every_n_steps=1
   ```

4. **检查配置文件**
   ```bash
   python -c "import hydra; from omegaconf import OmegaConf; print(OmegaConf.load('configs/config.yaml'))"
   ```

## 性能调试

### 监控GPU使用
```bash
watch -n 1 nvidia-smi
```

### 监控内存使用
```bash
htop  # 或 top
```

### 检查数据加载速度
```bash
python -c "
import time
from src.datasets.datamodules.cifar10_datamodule import CIFAR10DataModule
from torch.utils.data import DataLoader

dm = CIFAR10DataModule()
dm.setup('fit')
start = time.time()
for batch in DataLoader(dm.train_dataset, batch_size=32, num_workers=4):
    break
print(f'数据加载时间: {time.time() - start:.2f}s')
"
```