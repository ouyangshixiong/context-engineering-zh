# OmegaConf配置系统使用指南

## 🎯 为什么选择OmegaConf而不是Hydra？

OmegaConf相比Hydra更简单直观，特别适合：
- **学习成本低**：YAML语法直观，无额外概念
- **灵活性高**：支持运行时参数覆盖
- **调试友好**：错误信息清晰，易于定位问题
- **零依赖**：仅需omegaconf包，无复杂配置

## 📁 配置结构

```
configs/
├── config.yaml          # 主配置文件
├── model/
│   ├── resnet18.yaml    # ResNet18模型配置
│   └── simple_cnn.yaml  # 简单CNN配置
├── data/
│   └── cifar10.yaml     # CIFAR-10数据集配置
└── trainer/
    └── default.yaml     # 训练器默认配置
```

## 🚀 快速开始

### 基础训练
```bash
# 使用默认配置
python scripts/train.py --config configs/config.yaml

# 指定特定配置
python scripts/train.py --config configs/config.yaml --model resnet18 --data cifar10
```

### 参数覆盖
```bash
# 覆盖训练轮数
python scripts/train.py --config configs/config.yaml --epochs 20

# 覆盖batch size
python scripts/train.py --config configs/config.yaml --batch_size 64
```

### 评估模型
```bash
# 评估训练好的模型
python scripts/eval.py --config configs/config.yaml --checkpoint logs/best.ckpt
```

## ⚙️ 配置文件详解

### 主配置文件 (config.yaml)
```yaml
model:
  name: resnet18
  num_classes: 10
  learning_rate: 0.001
  pretrained: true

data:
  name: cifar10
  data_dir: ./data
  batch_size: 32
  num_workers: 4

trainer:
  max_epochs: 10
  accelerator: auto
  devices: auto
```

### 模型配置 (model/resnet18.yaml)
```yaml
model:
  name: resnet18
  num_classes: 10
  learning_rate: 0.001
  pretrained: true
  weight_decay: 1e-4
```

### 数据配置 (data/cifar10.yaml)
```yaml
data:
  name: cifar10
  data_dir: ./data/cifar10
  batch_size: 32
  num_workers: 4
  normalize: true
```

## 🔧 高级用法

### 环境变量注入
```bash
# 使用环境变量覆盖配置
export BATCH_SIZE=64
python scripts/train.py --config configs/config.yaml
```

### 配置合并
```bash
# 合并多个配置文件
python scripts/train.py --config configs/config.yaml --model_config configs/model/resnet18.yaml
```

## 📊 与Hydra对比

| 特性 | Hydra | OmegaConf |
|------|-------|-----------|
| 学习曲线 | 陡峭 | 平缓 |
| 配置语法 | 复杂 | 简单 |
| 参数覆盖 | 复杂 | 直观 |
| 调试难度 | 高 | 低 |
| 依赖数量 | 多 | 少 |
| 代码行数 | 多 | 少 |

## 🎓 迁移指南

### 从Hydra迁移到OmegaConf

1. **移除Hydra依赖**
   ```bash
   pip uninstall hydra-core
   pip install omegaconf
   ```

2. **简化配置文件**
   - 移除`defaults:`部分
   - 移除`_target_`字段
   - 使用直接参数名

3. **更新训练脚本**
   - 移除`@hydra.main`装饰器
   - 使用`OmegaConf.load()`加载配置
   - 直接访问配置参数

## ❓ 常见问题

### Q: 如何添加新的模型配置？
```bash
# 创建新的模型配置文件
echo "model:
  name: efficientnet
  num_classes: 10
  learning_rate: 0.001
  pretrained: true" > configs/model/efficientnet.yaml
```

### Q: 如何调试配置问题？
```bash
# 打印完整配置
python -c "from omegaconf import OmegaConf; print(OmegaConf.load('configs/config.yaml'))"
```

### Q: 如何支持多GPU训练？
```yaml
# 在trainer配置中设置
trainer:
  devices: 4
  strategy: ddp
```