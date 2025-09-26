# TASK.md - 任务分解技术规范

> 基于README.md 3.1.3节任务拆解规范，将技术决策分解为可执行任务清单

## 任务粒度控制矩阵

| 任务类别 | 代码约束 | 关联Agent | 规范引用 | 验收标准 |
|----------|----------|-----------|----------|----------|
| **模型定义** | ≤150行 | 代码生成 | PLANNING.md第4章 | Lightning/Paddle高层API |
| **数据管道** | ≤100行 | 代码生成 | ML.md第4章 | DataModule自动处理 |
| **配置管理** | ≤20行YAML | 规格验证 | OmegaConf规范 | 零配置错误 |
| **验证脚本** | ≤50行 | 调试编排 | DEBUG_CODE.md | 一键验证 |
| **部署配置** | ≤30行YAML | 部署编排 | DOCKER_CONFIG.md | 一键部署 |

## 任务分解清单

### 模型任务（≤150行/文件）
- `src/models/pytorch/base_classifier.py`
- `src/models/paddle/base_classifier.py`
- `src/models/registry.py`（模型注册表，≤50行）
- `configs/model/*.yaml`（配置模板，≤20行/文件）

### 数据任务（≤100行/文件）
- `src/datasets/datamodules/cifar10.py`
- `src/datasets/datamodules/imagenet.py`
- `src/datasets/downloader.py`（自动下载器，≤50行）
- `configs/data/*.yaml`（数据配置，≤15行/文件）

### 配置任务（YAML驱动）
- `configs/config.yaml`（主配置，≤20行）
- `configs/model/resnet18.yaml`（模型配置，≤10行）
- `configs/data/cifar10.yaml`（数据配置，≤10行）
- `configs/trainer/default.yaml`（训练器配置，≤15行）

### 验证任务（自动化测试）
- `scripts/validate.py`（验证入口，≤50行）
- `tests/test_models.py`（模型测试，≤30行）
- `tests/test_datasets.py`（数据测试，≤30行）
- `tests/test_configs.py`（配置测试，≤20行）

## Agent协作验收矩阵

| 技术规格项 | 任务覆盖 | 关联Agent | 验收标准 | 时间估算 |
|------------|----------|-----------|----------|----------|
| **模型架构** | 2个模型文件 | 代码生成+性能优化 | 高层API实现，PROJECT_BUILD_LOG.md通过 | 2天 |
| **数据处理** | 2个数据模块 | 代码生成+调试编排 | 自动下载+预处理，env_check_report.md验证 | 1天 |
| **配置系统** | 4个YAML文件 | 规格验证 | 零配置错误，test_configs.py通过 | 0.5天 |
| **验证脚本** | 3个测试文件 | 调试编排+规格验证 | 一键验证，REVIEW_REPORT.md通过 | 1天 |
| **部署配置** | 2个Dockerfile | 部署编排+环境验证 | 一键部署，venv.md正确 | 0.5天 |

## 输入规范

- **技术决策**: PLANNING.md输出结果
- **需求文档**: requirements.md需求规格
- **技术选型**: tech.md框架选择
- **代码约束**: ≤200行/文件限制

## 输出规范

### 任务分解清单
- 100%覆盖requirements.md+tech.md技术规格
- 每个任务≤200行代码约束
- 明确的验收标准和时间估算

### 代码骨架
- 高层API实现（Lightning/Paddle）
- 配置驱动架构（OmegaConf）
- 自动化验证脚本

## 验证标准

- **任务覆盖率**: 100%技术规格覆盖
- **代码行数**: 所有任务≤200行
- **高层API优势**: 代码减少80%
- **规范引用**: 每个任务都有文档依据
- **验收标准**: 每个任务可独立验证

## 优先级矩阵

| 优先级 | 任务类别 | 实施时间 | 验证标准 |
|--------|----------|----------|----------|
| **P0** | 核心模型+数据 | 3天 | CIFAR-10训练成功 |
| **P1** | 配置系统+验证 | 2天 | 配置驱动验证 |
| **P2** | 扩展模型+部署 | 2天 | ImageNet训练成功 |

## 关键指标

- **代码行数**: ≤200行高层API（vs 1000+行样板代码）
- **开发时间**: 7天完整项目（vs 30天传统开发）
- **维护成本**: 配置驱动维护（vs 代码级维护）
- **扩展性**: 30分钟添加新模型（vs 数天重构）

## 质量检查

- [ ] 所有任务代码总行数≤200行
- [ ] 每个任务都有规范文档引用位置
- [ ] 每个任务都有明确验收标准和时间估算
- [ ] 任务分解100%覆盖技术规格要求
- [ ] 高层API优势得到充分利用

## 执行时序

```
第1-2天：模型定义（PyTorch+PaddlePaddle）
第3天：数据管道（自动下载+预处理）
第4天：配置系统（YAML+OmegaConf）
第5天：验证脚本（一键测试套件）
第6-7天：部署配置（Docker+环境验证）
```

## 技术约束

- **框架要求**: PyTorch Lightning + PaddlePaddle高层API
- **配置系统**: OmegaConf动态配置，层次化继承
- **验证标准**: 1-epoch快速验证，GPU利用率>90%
- **部署规范**: Docker容器化，一键部署就绪