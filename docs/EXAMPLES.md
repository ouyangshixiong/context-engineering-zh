# 使用示例

## 快速开始

### 1. CIFAR-10 训练（一行命令）
```bash
python scripts/train.py model=resnet18 data=cifar10 trainer.max_epochs=10
```

### 2. ImageNet 训练
```bash
python scripts/train.py model=resnet50 data=imagenet trainer.max_epochs=90
```

### 3. 多GPU训练
```bash
python scripts/train.py trainer.devices=4 trainer.strategy=ddp
```

### 4. 混合精度训练
```bash
python scripts/train.py trainer.precision=16
```

### 5. 模型评估
```bash
python scripts/eval.py checkpoint=logs/best.ckpt
```

## Python API 使用

### 基本训练流程
```python
import pytorch_lightning as pl
from src.models.pytorch import ResNetClassifier
from src.datasets.datamodules import CIFAR10DataModule

# 创建模型和数据
model = ResNetClassifier(num_classes=10)
datamodule = CIFAR10DataModule(batch_size=32)

# 训练
trainer = pl.Trainer(max_epochs=10)
trainer.fit(model, datamodule)
```

### PaddlePaddle 版本
```python
from src.models.paddle import ResNetClassifier

model = ResNetClassifier(num_classes=10)
model.prepare(optimizer, loss, metrics)
model.fit(train_dataset, val_dataset, epochs=10)
```

## 配置文件示例

### 基本配置
```yaml
# configs/config.yaml
model:
  _target_: src.models.pytorch.ResNetClassifier
  num_classes: 10
  learning_rate: 1e-3

data:
  _target_: src.datasets.datamodules.CIFAR10DataModule
  batch_size: 32
  num_workers: 4

trainer:
  _target_: pytorch_lightning.Trainer
  max_epochs: 10
  accelerator: auto
  devices: auto
```

### 自定义训练
```yaml
# configs/trainer/fast.yaml
max_epochs: 5
precision: 16
accelerator: gpu
devices: 1
```