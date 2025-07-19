### 🔄 项目认知与上下文
- **始终在新对话开始时读取 `PLANNING.md`**，以理解项目的架构、目标、样式和约束。
- **在开始新任务前检查 `TASK.md`**。如果任务未列出，请添加简短描述和当天日期。
- **使用一致的命名约定、文件结构和架构模式**，如 `PLANNING.md` 中所述。
- **使用 Docker 进行项目部署**，支持 CPU 和 GPU 两种配置模式。

### 🧱 代码结构与模块化（基于高层API）
- **采用PyTorch Lightning和PaddlePaddle高层API**，实现极简代码架构
- **绝不创建超过100行代码的文件**，利用高层API消除样板代码
- **遵循官方最佳实践**，确保代码质量和可维护性

#### 核心架构层次
```
src/
├── models/                # 高层模型定义
├── datasets/              # 高层数据集管理
├── configs/               # Hydra配置系统
└── utils/                 # 通用工具封装
```

#### 文件大小规范
- **模型文件**：每文件不超过100行（LightningModule/paddle.Model）
- **数据模块**：每文件不超过50行（DataModule实现）
- **配置文件**：每文件不超过20行（Hydra YAML配置）
- **工具脚本**：每文件不超过50行（高层API封装）

- **使用清晰、一致的导入**（优先使用包内的相对导入）。
- **使用 python_dotenv 和 load_env()** 处理环境变量。
- **使用 Docker 部署时遵循以下结构**：
  - `deploy/cpu/` - CPU 专用 Docker 配置
  - `deploy/gpu/` - GPU 专用 Docker 配置
  - `deploy/shared/` - 共享部署脚本和工具

### 🧪 测试与可靠性
- **始终为新功能创建 Pytest 单元测试**（函数、类、路由等）。
- **更新任何逻辑后**，检查现有单元测试是否需要更新。如果需要，请进行更新。
- **测试应位于 `/tests` 文件夹**中，镜像主应用结构。
  - 至少包括：
    - 1个预期使用情况的测试
    - 1个边界情况测试
    - 1个失败情况测试
- **Docker 环境下的测试**：
  - 使用 `docker compose exec` 在容器中运行测试
  - 确保容器化环境与本地测试环境一致
  - 测试容器健康检查和启动脚本

### ✅ 任务完成
- **完成任务后立即在 `TASK.md` 中标记**。
- 将在开发过程中发现的新子任务或待办事项添加到 `TASK.md` 的"工作中发现"部分。
- **Docker 部署任务**：
  - 在 `deploy/README.md` 中记录部署配置变更
  - 更新 Docker 镜像版本标签
  - 记录 GPU 驱动和 CUDA 版本要求

### 📊 数据集获取与管理（基于高层API）
- **支持内置数据集**，一行代码自动下载：
  - **CIFAR-10/100**: torchvision/paddle.vision内置
  - **ImageNet**: torchvision/paddle.vision内置
  - **MNIST**: 手写数字识别，内置数据集
  - **FashionMNIST**: 时尚物品识别，内置数据集
  - **COCO**: 检测/分割数据集，自动预处理

- **高层数据集获取系统**：
  ```python
  # src/datasets/downloader.py
  class DatasetDownloader:
      """基于高层API的数据集下载器（极简实现）"""
      
      @classmethod
      def download(cls, name: str, root: str = "./data"):
          """一行代码下载数据集"""
          datasets = {
              "cifar10": lambda: torchvision.datasets.CIFAR10(root, download=True),
              "cifar100": lambda: torchvision.datasets.CIFAR100(root, download=True),
              "imagenet": lambda: torchvision.datasets.ImageNet(root, split="train", download=True),
              "mnist": lambda: torchvision.datasets.MNIST(root, download=True),
          }
          return datasets[name]()
  
  # src/datasets/datamodules/cifar10_datamodule.py
  import pytorch_lightning as pl
  from torchvision import datasets, transforms
  
  class CIFAR10DataModule(pl.LightningDataModule):
      """CIFAR-10 Lightning DataModule（<30行）"""
      def __init__(self, batch_size=32, data_dir="./data"):
          super().__init__()
          self.save_hyperparameters()
      
      def prepare_data(self):
          datasets.CIFAR10(self.hparams.data_dir, train=True, download=True)
          datasets.CIFAR10(self.hparams.data_dir, train=False, download=True)
      
      def setup(self, stage=None):
          transform = transforms.ToTensor()
          if stage == "fit":
              self.train_dataset = datasets.CIFAR10(self.hparams.data_dir, train=True, transform=transform)
              self.val_dataset = datasets.CIFAR10(self.hparams.data_dir, train=False, transform=transform)
      
      def train_dataloader(self):
          from torch.utils.data import DataLoader
          return DataLoader(self.train_dataset, batch_size=self.hparams.batch_size)
  ```

- **零配置数据集管理**：
  ```
  datasets/                    # 自动管理目录
  ├── cifar10/                 # 自动下载和缓存
  ├── imagenet/                # 自动解压和组织
  └── cache/                   # 自动清理缓存
  ```

### 📎 样式与约定
- **使用 Python** 作为主要语言。
- **遵循 PEP8**，使用类型提示，并用 black 格式化。
- **使用 `pydantic` 进行数据验证**。
- 如适用，使用 `FastAPI` 构建 API，使用 `SQLAlchemy` 或 `SQLModel` 作为 ORM。
- **为每个函数编写文档字符串**，使用 Google 样式：
  ```python
  def example():
      """
      简要总结。

      参数：
          param1 (类型): 描述。

      返回：
          类型: 描述。
      """
  ```

### 🏃 极简训练实现（基于高层API）
- **零样板代码训练**：利用PyTorch Lightning和PaddlePaddle高层API，每模型<100行
- **一行命令训练**：`python scripts/train.py model=resnet18 data=cifar10`
- **零配置多GPU**：自动检测GPU数量和类型
- **自动优化**：混合精度、梯度累积、分布式训练等由框架自动处理

#### 核心优势
- **代码量减少80%**：从传统200+行减少至50行以内
- **零配置错误**：Hydra配置系统自动验证
- **自动实验跟踪**：TensorBoard/WandB零配置集成
- **一键部署**：Docker镜像<10行，一键启动训练

### 🔧 高层API实现（零样板代码）
- **PyTorch Lightning实现**：
  ```python
  # 一行命令训练
  python scripts/train.py model=resnet18 data=cifar10 trainer.max_epochs=10
  
  # 多GPU训练（零代码修改）
  python scripts/train.py trainer.devices=4 trainer.strategy=ddp
  
  # 混合精度（单参数开关）
  python scripts/train.py trainer.precision=16
  ```

- **PaddlePaddle高层API实现**：
  ```python
  # 一行代码训练
  model = ResNetClassifier(num_classes=10)
  model.prepare(optimizer, loss, metrics)
  model.fit(train_dataset, val_dataset, epochs=10)
  
  # 多GPU训练（自动检测）
  paddle.set_device('gpu:0,1,2,3')
  model.fit(train_dataset, val_dataset, epochs=10)
  ```

### 📁 极简配置系统（Hydra驱动）
- **极简YAML配置**：
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

- **极简配置实现**：
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

### 🛠️ 极简工具脚本
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

- **极简命令行接口**：
  ```python
  # scripts/train.py（<50行）
  import hydra
  from pytorch_lightning import Trainer
  
  @hydra.main(config_path="../configs", config_name="config")
  def main(cfg):
      # 一行代码训练
      model = hydra.utils.instantiate(cfg.model)
      datamodule = hydra.utils.instantiate(cfg.data)
      trainer = Trainer(**cfg.trainer)
      trainer.fit(model, datamodule)
  
  if __name__ == "__main__":
      main()
  ```

### 🐳 极简Docker约定：
  - **极简Dockerfile**（<10行）：
    ```dockerfile
    FROM pytorch/pytorch:2.0.0-cuda11.7-cudnn8-devel
    RUN pip install pytorch-lightning hydra-core torchmetrics
    COPY . /workspace
    WORKDIR /workspace
    ```
  - **一键部署**：
    ```bash
    docker-compose up pytorch-gpu
    docker exec pytorch python scripts/train.py model=resnet18
    ```
  - **零配置环境**：自动GPU检测，自动优化

### 📚 文档与可解释性
- **添加新功能、依赖变更或设置步骤修改时更新 `README.md`**。
- **注释不明显的代码**，确保中级开发者能够理解一切。
- 编写复杂逻辑时，**添加内联 `# 原因：` 注释**解释原因，而不仅仅是内容。
- **Docker 文档要求**：
  - 为每个部署配置添加 README.md
  - 记录环境变量和配置选项
  - 提供故障排除和常见问题解答

### 🧠 AI行为规则
- **绝不假设缺失的上下文。如有疑问，请提问。**
- **绝不虚构库或函数** - 仅使用已知、经验证的 Python 包。
- **始终在代码或测试中引用前确认文件路径和模块名称**存在。
- **绝不删除或覆盖现有代码**，除非明确指示或作为来自 `TASK.md` 的任务的一部分。
- **Docker 部署规则**：
  - 优先使用官方基础镜像
  - 固定版本号以确保可重现性
  - 最小化镜像体积和攻击面
  - 确保容器可移植性和安全性