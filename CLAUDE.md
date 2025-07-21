### 🔄 项目认知与上下文
- **始终在新对话开始时读取 `PLANNING.md`**，以理解项目的架构、目标、样式和约束。
- **在开始新任务前检查 `TASK.md`**。如果任务未列出，请添加简短描述和当天日期。
- **使用一致的命名约定、文件结构和架构模式**，如 `PLANNING.md` 中所述。
- **使用 Docker 进行项目部署**，支持 CPU 和 GPU 两种配置模式。

### 🧱 代码结构与模块化
- **采用PyTorch Lightning和PaddlePaddle高层API**，实现极简代码架构
- **绝不创建超过200行代码的文件**，利用高层API减少代码行数
- **遵循PyTorch、PaddlePaddle官方最佳实践**，确保代码质量和可维护性

### 私有RAG知识库
- **遵循RAG知识**，优先查询私有RAG知识库，并优先遵循RAG知识，包括名词解释、规定、业务员流程和代码示例

#### 核心架构层次
```
src/
├── models/                # 高层模型定义
├── datasets/              # 高层数据集管理
├── configs/               # OmegaConf配置系统
└── utils/                 # 通用工具封装
```

#### 文件大小规范
- **模型文件**：每文件不超过200行（LightningModule/paddle.Model）
- **数据模块**：每文件不超过100行（DataModule实现）
- **配置文件**：每文件不超过50行（OmegaConf YAML配置）
- **工具脚本**：每文件不超过100行（高层API封装）

- **使用清晰、一致的导入**（优先使用包内的相对导入）。
- **使用 python_dotenv 和 load_env()** 处理环境变量。
- **使用 Docker 部署时遵循以下结构**：
  - `deploy/cpu/` - CPU 专用 Docker 配置
  - `deploy/gpu/` - GPU 专用 Docker 配置
  - `deploy/shared/` - 共享部署脚本和工具

### 🔍 机器学习项目验证
- **模型验证采用实验验证方式**：通过训练曲线、验证指标、可视化结果进行验证
- **关键指标监控**：训练损失、验证准确率、过拟合检测
- **结果复现**：固定随机种子，记录实验配置和结果
- **模型性能基准**：与公开baseline比较，确保合理性

### ✅ 任务完成
- **完成任务后立即在 `TASK.md` 中标记**。
- 将在开发过程中发现的新子任务或待办事项添加到 `TASK.md` 的"工作中发现"部分。
- **Docker 部署任务**：
  - 在 `deploy/README.md` 中记录部署配置变更
  - 更新 Docker 镜像版本标签
  - 记录 GPU 驱动和 CUDA 版本要求

### 📊 数据集获取与管理（基于ModelScope/HuggingFace）
- **优先使用ModelScope和HuggingFace数据集**：
  - **ModelScope**: `modelscope.datasets` 一行代码获取中文数据集
  - **HuggingFace**: `datasets` 库获取国际通用数据集
  - **公开数据集列表**：
    ```
    计算机视觉：cifar10, cifar100, imagenet-1k, coco2017, voc2007
    自然语言处理：glue, squad, wmt14, lcsts, cmnli
    多模态：coco_captions, flickr30k, laion400m
    ```

- **数据集统一管理**：
  ```
  data/                    # 数据集统一管理目录
  ├── cache/               # ModelScope/HF缓存目录
  ├── processed/           # 预处理后的数据集
  └── splits/              # 训练/验证/测试划分
  ```

### 📎 样式与约定
- **使用 Python** 作为主要语言。
- **遵循 PEP8**，使用类型提示，并用 black 格式化。
- **使用 `pydantic` 进行数据验证**。
- 如适用，使用 `FastAPI` 构建 API，使用 `Flask`构建网页版演示。
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
- **GPU零配置**：仅仅支持cpu和 Nvidia GPU，cuda版本12.6
- **自动优化**：混合精度、梯度累积等由框架自动处理

#### 核心优势
- **代码量减少**：从传统500+行减少至200行以内
- **零配置错误**：OmegaConf配置系统自动验证
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

### 📁 极简配置系统（OmegaConf驱动）
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
  - **极简Dockerfile**（<10行）：
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
  - **零配置环境**：自动GPU检测，自动优化

### 📚 文档与可解释性
- **添加新功能、依赖变更或设置步骤修改时更新 `README.md`**。
- **注释不明显的代码**，确保中级开发者能够理解一切。
- 编写复杂逻辑时，**添加内联 `# 原因：` 注释**解释原因，而不仅仅是内容。
- **Docker 文档要求**：
  - 为每个部署配置添加 README.md
  - 记录环境变量和配置选项
  - 提供故障排除和常见问题解答

### 📋 项目构建记录
- **在目标项目根目录创建 `PROJECT_BUILD_LOG.md`**：
  - 记录使用本模板构建、优化、修改目标项目的全过程
  - 包含时间戳、操作步骤、遇到的问题及解决方案
  - 记录数据集选择、模型架构决策、训练配置变更
  - 保存关键实验结果和性能对比

- **PROJECT_BUILD_LOG.md 模板结构**：
  ```markdown
  # 项目构建记录
  
  ## 项目信息
  - 项目名称：
  - 构建时间：
  - 使用模板版本：
  
  ## 数据集选择
  - 数据集名称：
  - 数据来源：ModelScope/HuggingFace
  - 数据规模：
  
  ## 模型架构
  - 基础模型：
  - 修改内容：
  
  ## 训练配置
  - 关键超参数：
  - 训练时长：
  
  ## 实验结果
  - 最佳指标：
  - 关键发现：
  ```

### 🧠 AI行为规则
- **绝不假设缺失的上下文。如有疑问，请提问。**
- **绝不虚构库或函数** - 仅使用已知、经验证的 Python 包。
- **始终在代码或测试中引用前确认文件路径和模块名称**存在。
- **绝不删除或覆盖现有代码**，除非明确指示或作为来自 `TASK.md` 的任务的一部分。
- **项目构建规则**：
  - 每个新项目必须在根目录创建 `PROJECT_BUILD_LOG.md`
  - 所有重要决策和变更必须记录在日志中
  - 实验结果必须包含可复现的配置信息
- **Docker 部署规则**：
  - 优先使用官方基础镜像
  - 固定版本号以确保可重现性
  - 最小化镜像体积和攻击面
  - 确保容器可移植性和安全性