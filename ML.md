#### 标准化项目结构模板
```
  project_name/
  ├── src/
  │   ├── init.py
  │   ├── models/
  │   │   ├── init.py
  │   │   └── {model_name}.py
  │   ├── datasets/
  │   │   ├── init.py
  │   │   └── {dataset_name}.py
  │   ├── configs/
  │   │   ├── config.yaml
  │   │   ├── model/
  │   │   ├── data/
  │   │   └── trainer/
  │   └── utils/
  │       └── visualization.py
  ├── scripts/
  │   ├── init.py
  │   ├── train.py
  │   ├── eval.py
  │   ├── download.py
  │   └── test.py
  ├── deploy/
  │   ├── cpu/
  │   ├── gpu/
  │   └── docker-compose.yml
  ├── requirements.txt
  ├── README.md
  └── PROJECT_BUILD_LOG.md
```

## python默认配置
- **默认python版本**：python版本默认3.10
- **使用清晰、一致的导入**（优先使用包内的相对导入）。
- **使用 python_dotenv 和 load_env()** 处理环境变量。
- **使用 `numpy<2` 避免numpy2.x版本兼容问题**。
- 如适用，使用 `FastAPI` 构建 API，使用 `Flask`构建网页版演示。

## ML框架默认配置
- **采用PyTorch Lightning和PaddlePaddle高层API**，实现极简代码架构
- **绝不创建超过200行代码的文件**，利用高层API减少代码行数
- **遵循PyTorch、PaddlePaddle官方最佳实践**，确保代码质量和可维护性

## 调试验证默认配置
- **调试验证**：部署docker前配置conda环境验证。

## config | terminal 参数风格默认配置
- **配置文件**：每文件不超过50行（使用OmegaConf样式 YAML配置）
- **命令行参数风格** 使用argparse，OmegaConf风格

## 机器学习框架默认配置
- **使用多种框架编写目标项目**，PyTorch和PaddlePaddle。

## docker部署默认配置
- **使用 Docker 进行项目部署**，支持 CPU 和 GPU 两种配置模式。
- **使用 Docker 部署时遵循以下结构**：
  - `deploy/cpu/` - CPU 专用 Docker 配置
  - `deploy/gpu/` - GPU 专用 Docker 配置
  - `deploy/shared/` - 共享部署脚本和工具

### 📁 极简配置示例（OmegaConf驱动）
- **YAML配置文件结构**：
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

- **极简YAML配置示例**：
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

### 🛠️ 极简脚本示例
- **脚本目录结构**：
  ```
  scripts/
  ├── train.py               # 单文件训练（<50行）
  │   python scripts/train.py model=resnet18 data=cifar10 trainer.max_epochs=5
  ├── eval.py                # 模型评估（<30行）
  │   python scripts/eval.py checkpoint=logs/best.ckpt
  └── download.py            # 数据集下载（<20行）
      python scripts/download.py --datasets cifar10,imagenet
  ```

- **极简命令行示例**：
  ```python
  # scripts/train.py（OmegaConf风格）
  import argparse
  from omegaconf import OmegaConf
  from pytorch_lightning import Trainer
  
  def main():
      parser = argparse.ArgumentParser()
      parser.add_argument('--config', type=str, default='configs/config.yaml')
      args = parser.parse_args()
      
      # 一行代码训练
      cfg = OmegaConf.load(args.config)
      model = instantiate_from_config(cfg.model)
      datamodule = instantiate_from_config(cfg.data)
      trainer = Trainer(**cfg.trainer)
      trainer.fit(model, datamodule)
  
  if __name__ == "__main__":
      main()
  ```

### 🐳 极简Docker约定：
  - **极简Dockerfile**（默认PyTorch和cuda版本）：
    ```dockerfile
    FROM pytorch/pytorch:2.6.0-cuda12.6-cudnn9-devel
    RUN pip install pytorch-lightning omegaconf torchmetrics
    COPY . /workspace
    WORKDIR /workspace
    ```
  - **一键部署**：
    ```bash
    docker-compose up pytorch-gpu
    docker exec pytorch python scripts/train.py model=resnet18
    ```
  - **零配置环境**：调试验证阶段，conda环境默认cpu。部署阶段，docker环境支持cpu和gpu。

### 🏃 极简训练实现（基于high-level API）
- **零样板代码训练**：利用PyTorch Lightning和PaddlePaddle high-level API，每模型<100行
- **一行命令训练**：`python scripts/train.py model=resnet18 data=cifar10`
- **GPU零配置**：仅仅支持cpu和 Nvidia GPU，cuda版本12.6
- **自动优化**：混合精度、梯度累积等由框架自动处理

### 🔧 高层API(high-level API)实现（零样板代码）
- **PyTorch Lightning实现**：
  ```python
  # 一行命令训练
  python scripts/train.py model=resnet18 data=cifar10 trainer.max_epochs=10
  
  # 多GPU训练（零代码修改）
  python scripts/train.py trainer.devices=4 trainer.strategy=ddp
  
  # 混合精度（单参数开关）
  python scripts/train.py trainer.precision=16
  ```

- **PaddlePaddle高层API(high-level API)实现**：
  ```python
  # 一行代码训练
  model = ResNetClassifier(num_classes=10)
  model.prepare(optimizer, loss, metrics)
  model.fit(train_dataset, val_dataset, epochs=10)
  
  # 多GPU训练（自动检测）
  paddle.set_device('gpu:0,1,2,3')
  model.fit(train_dataset, val_dataset, epochs=10)
  ```
