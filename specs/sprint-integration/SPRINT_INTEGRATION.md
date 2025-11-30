# SPRINT_INTEGRATION.md - 快速sprint集成指南

## 1. 概述

本文件描述了快速sprint插件与specs目录的集成方法，支持敏捷开发模式下的机器学习项目开发。

## 2. 快速sprint插件介绍

快速sprint插件是一个敏捷开发工具，支持基于JIRA Scrum Sprint的标准化、可视化软件开发工程管理，包括基于智能体的任务分解、多智能体协作开发与测试、任务自动comment、任务状态自动流转等。

## 3. 集成配置

### 3.1 配置项

| 配置项 | 描述 | 默认值 | 示例 |
|--------|------|--------|------|
| specs_path | specs目录路径 | specs/ | specs/ |
| framework | 机器学习框架 | pytorch | pytorch |
| environment | 开发环境 | gpu | gpu |
| sprint_duration | sprint持续时间 | 2周 | 1周 |
| sprint_goal | sprint目标 | 完成模型训练 | 完成模型训练和测试 |

### 3.2 配置示例

```yaml
# 快速sprint集成配置
sprint_integration:
  specs_path: specs/
  framework: pytorch
  environment: gpu
  sprint_duration: 1周
  sprint_goal: 完成模型训练和测试
  validation_stages:
    - environment_check
    - import_test
    - dataset_validation
    - model_validation
    - training_test
    - result_validation
```

## 4. 集成命令

### 4.1 基本命令

```bash
# 快速sprint集成命令
/sprint-plugin:快速sprint --specs-path specs/ --framework pytorch --environment gpu
```

### 4.2 高级命令

```bash
# 快速sprint集成命令（带sprint目标）
/sprint-plugin:快速sprint --specs-path specs/ --framework pytorch --environment gpu --sprint-goal "完成模型训练和测试" --sprint-duration "1周"
```

## 5. 集成工作流

### 5.1 工作流概述

```
需求分析 → 任务分解 → 代码生成 → 验证测试 → 部署交付
```

### 5.2 详细工作流

1. **需求分析**：快速sprint插件读取specs目录下的配置文件，获取规范信息
2. **任务分解**：根据规范信息生成任务清单
3. **代码生成**：根据任务清单生成代码
4. **验证测试**：根据specs目录下的验证规范验证代码
5. **部署交付**：根据specs目录下的部署规范部署代码

### 5.3 框架项目工作流

#### 5.3.1 工作流目标
从框架项目与模糊需求出发，生成目标项目初始包（代码骨架、规范副本、需求/技术/任务文档、mini 数据样本和 venv 规范）；进入目标项目，配置venv环境并修复所有的bug，实现1-epoch验证；配置docker生成环境，并验证生成环境部署。

#### 5.3.2 框架项目工作流阶段

1. **需求分析与规范理解**
   - **输入**：框架规范文件集，自然语言需求（用户提供，通常简短/模糊）
   - **WHO**：requirements-plugin 命令（主导），requirements-plugin（需求分析），research-agent（技术调研，来自requirements-plugin），用户（回答并澄清问题）
   - **DO WHAT**：使用 `/requirements-plugin:需求分析` 命令启动需求分析流程；解析自然语言，抽取目标、SLA、约束这些条目；如包含技术关键词，进行技术调研并生成技术报告；为低确定性条目打分并生成澄清问题集
   - **满足条件**：`requirements/requirements.md`中所有条目和问题的分数都要大于0.6,或存在明确的澄清项与后续处理策略；技术可行性验证通过
   - **输出**：`requirements/requirements.md`（结构化需求文档），`requirements/research-report.md`（技术调研报告，如有技术关键词）

2. **技术选型与数据集选择**
   - **输入**：`requirements/requirements.md`、`ML.md`（文件中的技术/架构指导部分）
   - **DO WHAT**：阅读`requirements/requirements.md`、`ML.md`架构指导，搜索需求对应的候选模型,训练数据集，预估资源要求和性能预期，生成算法对比表格
   - **输出**：`tech.md`（包含 2个候选AI模型、相匹配的数据集、模型的各种约束条件、AI算法优劣势对比表格）
   - **WHO**：coder-agent智能体
   - **满足条件**：至少 2 个候选模型，且为每个模型给出数据集需求与约束

3. **任务拆解与代码生成**
   - **输入**：`tech.md`、`requirements/requirements.md`、`ML.md`（文件中的API/代码骨架部分）
   - **DO WHAT**：planner-agent智能体读取`tech.md`、`ML.md`规范，构建任务清单todo；coder-agent智能体读取`tech.md`、`ML.md`规范，逐项执行task生成代码骨架、目标项目README.md；生成代码和配置填充代码骨架；记录任务执行结果，生成`PROJECT_BUILD_LOG.md`；planner-agent智能体逐项验证task执行情况，验证和复核
   - **输出**：`{xx}_project/`（目标项目,包含：代码骨架，用真实项目名称代替`{xx}_project/`），`PROJECT_BUILD_LOG.md`（任务清单执行结果记录）
   - **WHO**：planner-agent智能体（生成task清单，验收和复核task）, coder-agent智能体（执行清单，包括生成代码骨架、填充代码、生成配置文件、记录任务执行结果）
   - **满足条件**：代码骨架填充完整，例如包含可运行的训练脚本和推理脚本。PROJECT_BUILD_LOG.md逐项复核都通过

4. **代码与配置审核**
   - **输入**：目标项目（包含`README.md`、代码、配置文件）、PROJECT_BUILD_LOG.md
   - **DO WHAT**：reviewer-agent智能体执行代码与配置的静态分析和`README.md`一致性校验；审核代码逻辑、依赖与`README.md`的匹配情况；针对`PROJECT_BUILD_LOG.md`逐项检查是否真正完成；输出`REVIEW_REPORT.md`，必要时修订目标项目
   - **输出**：`REVIEW_REPORT.md`、修订后的目标项目
   - **WHO**：reviewer-agent智能体
   - **满足条件**：`REVIEW_REPORT.md`所有条目审核通过，目标项目文档与代码的一致性和完整性相匹配

5. **venv环境与部署**
   - **输入**：完整的目标项目(含`README.md`、代码、配置文件等)、框架规范文件（`VENV_CONFIG.md`、`DEBUG_CODE.md`、`DOCKER_CONFIG.md`等）
   - **DO WHAT**：读取目标项目`README.md`和`VENV_CONFIG.md`规范文件，生成目标项目的 `venv.md`（包含目标项目的python 版本、目标项目的requirements-cpu.txt或requirements-gpu.txt）；把`venv.md` 和规范文件副本`DEBUG_CODE.md` `DOCKER_CONFIG.md`等复制到目标目录中
   - **输出**：`venv.md`
   - **WHO**：ops-agent智能体
   - **满足条件**：目标项目中包含`venv.md`，且内容正确；包含副本规范文件

6. **拷贝target project需要的md文件**
   - 拷贝相关规范文件到目标项目根目录

## 6. 验证和测试

### 6.1 验证流程

```
环境检查 → 导入测试 → 数据集验证 → 模型验证 → 训练测试 → 结果验证
```

### 6.2 验证命令

```bash
# 验证环境
python --version
nvidia-smi

# 验证导入
python -c "import torch, paddle"

# 验证数据集
python scripts/download.py --dataset coco128 --data_dir ./data/mini

# 验证模型
python -c "from src.models.pytorch.yolov10 import YOLOv10; model = YOLOv10(num_classes=80); print('✅ 模型创建成功')"

# 验证训练
python scripts/train.py model=yolov10n data=coco128 trainer.max_epochs=1 trainer.fast_dev_run=true
```

## 7. 最佳实践

1. **定期更新specs目录**：保持specs目录与最新框架版本兼容
2. **使用标准化配置**：使用specs目录下的标准化配置文件
3. **结合JIRA使用**：结合JIRA使用快速sprint插件，实现可视化管理
4. **定期验证配置**：定期验证specs目录下的配置文件
5. **使用模板创建项目**：使用specs目录下的模板创建新项目

## 8. 故障排除

### 8.1 常见问题

| 问题 | 解决方案 |
|------|----------|
| 插件无法读取specs目录 | 检查specs目录路径是否正确 |
| 配置项无效 | 检查配置项是否符合规范 |
| 验证失败 | 检查验证环境是否符合规范 |
| 训练失败 | 检查训练配置是否符合规范 |

### 8.2 调试命令

```bash
# 调试快速sprint插件
/sprint-plugin:快速sprint --specs-path specs/ --framework pytorch --environment gpu --debug

# 查看插件日志
/sprint-plugin:日志
```

## 9. 下一步

1. 阅读ML.md文件，了解机器学习框架规范
2. 阅读VENV_CONFIG.md文件，了解GPU调试环境规范
3. 阅读DOCKER_CONFIG.md文件，了解Docker配置规范
4. 阅读DEBUG_CODE.md文件，了解调试代码规范
5. 使用快速sprint插件开始开发

---
**集成时间**: ~10分钟 | **自动化程度**: 100% | **规格符合**: README.md 3.2.3节标准