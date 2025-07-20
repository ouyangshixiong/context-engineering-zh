# API 参考文档

## 高层模型 API

### PyTorch Lightning 模型

#### ResNetClassifier
```python
from src.models.pytorch import ResNetClassifier

# 创建模型
model = ResNetClassifier(num_classes=10, learning_rate=1e-3)

# 训练配置
model.configure_optimizers()  # 自动返回 Adam 优化器
```

#### EfficientNetClassifier
```python
from src.models.pytorch import EfficientNetClassifier

model = EfficientNetClassifier(num_classes=100)
```

### PaddlePaddle 高层模型

#### ResNetClassifier
```python
from src.models.paddle import ResNetClassifier

model = ResNetClassifier(num_classes=10)
model.prepare(optimizer, loss, metrics)
model.fit(train_dataset, val_dataset, epochs=10)
```

## 数据模块 API

### Lightning DataModules

#### CIFAR10DataModule
```python
from src.datasets.datamodules import CIFAR10DataModule

datamodule = CIFAR10DataModule(batch_size=32, data_dir="./data")
datamodule.prepare_data()  # 自动下载
datamodule.setup()        # 自动准备数据集
```

#### ImageNetDataModule
```python
from src.datasets.datamodules import ImageNetDataModule

datamodule = ImageNetDataModule(batch_size=64, data_dir="./data/imagenet")
```

## 配置系统 API

### OmegaConf 配置驱动
```python
# 命令行使用
python scripts/train.py model=resnet18 data=cifar10 trainer.max_epochs=5

# 配置文件覆盖
python scripts/train.py model.num_classes=100 trainer.precision=16
```

## 数据集下载 API

### 自动下载
```python
from src.datasets import DatasetDownloader

# 一行代码下载
DatasetDownloader.download("cifar10", root="./data")
DatasetDownloader.download("imagenet", root="./data")
```