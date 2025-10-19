# 读README.md understand framework targets

# workflow

## 1 workflow target
从框架项目与模糊需求出发，生成目标项目初始包（代码骨架、规范副本、需求/技术/任务文档、mini 数据样本和 venv 规范）；进入目标项目，配置venv环境并修复所有的bug，实现1-epoch验证；配置docker生成环境，并验证生成环境部署；

## 2. framework project(current dir) workflow stages:
### framework project workflow stage 1 — 需求分析与规范理解
* **输入**：`CREATE.md`（框架规范），自然语言需求（用户提供，通常简短/模糊）。
* **WHO**：requirements-plugin 命令（主导），requirements-agent（需求分析），research-agent（技术调研），用户（回答并澄清问题）。
* **DO WHAT**：
  > 使用 `/requirements-plugin:需求分析` 命令启动需求分析流程；
  > requirements-agent 解析自然语言，抽取目标、SLA、约束这些条目，进行15分钟深度思考；
  > 如包含技术关键词，research-agent 进行技术调研并生成技术报告；
  > 为低确定性条目打分并生成澄清问题集（若评分过低，写明需人工补充项）。
* **满足条件**：`requirements/requirements.md`中所有条目和问题的分数都要大于0.6,或存在明确的澄清项与后续处理策略；技术可行性验证通过。
* **输出**：`requirements/requirements.md`（结构化需求文档），`requirements/research-report.md`（技术调研报告，如有技术关键词）。

### framework project workflow stage 2 — 技术选型与数据集选择
* **输入**：`requirements/requirements.md`、`ML.md`（文件中的技术/架构指导部分）。
* **DO WHAT**：
>阅读`requirements/requirements.md`、`ML.md`架构指导，并负责搜索需求对应的候选模型,训练数据集（与算法相匹配的mini dataset 与 full dataset）,预估资源要求（模型参数量、显存大小、训练时长）和性能预期,生成算法对比表格。
* **输出**：`tech.md`（包含 2个候选AI模型、相匹配的数据集、模型的各种约束条件、AI算法优劣势对比表格）。
* **WHO**：coder-agent智能体。
* **满足条件**：至少 2 个候选模型，且为每个模型给出数据集需求与约束。

### framework project workflow stage 3 — 任务拆解与代码生成
* **输入**：`task.md`、`tech.md`、`requirements/requirements.md`、`ML.md`（文件中的API/代码骨架部分）、`OmegaConf_README.md`。
* **活动**：
    >planner-agent智能体读取`task.md`、`tech.md`、`ML.md`、`OmegaConf_README.md`规范，构建任务清单todo；
    >coder-agent智能体读取`tech.md`、`ML.md`、`OmegaConf_README.md`规范，逐项执行task生成代码骨架、目标项目README.md；生成代码和配置填充代码骨架；
    >coder-agent智能体记录任务执行结果，生成`PROJECT_BUILD_LOG.md`。
    >planner-agent智能体逐项验证task执行情况，验证和复核。总结结果并更新目标项目的`README.md`
* **输出**：`{xx}_project/`（目标项目,包含：代码骨架，用真实项目名称代替`{xx}_project/`），`PROJECT_BUILD_LOG.md`（任务清单执行结果记录）。
* **责任方**：planner-agent智能体（生成task清单，验收和复核task）, coder-agent智能体（执行清单，包括生成代码骨架、填充代码、生成配置文件、记录任务执行结果）。
* **满足条件**：代码骨架填充完整，例如包含可运行的训练脚本和推理脚本。PROJECT_BUILD_LOG.md逐项复核都通过。

### framework project workflow stage 4 — 代码与配置审核
* **输入**：：目标项目（包含`README.md`、代码、配置文件）、PROJECT_BUILD_LOG.md。
* **DO WHAT**：
>reviewer-agent智能体执行代码与配置的静态分析和`README.md`一致性校验；
>审核代码逻辑、依赖与`README.md`的匹配情况；
>针对`PROJECT_BUILD_LOG.md`逐项检查是否真正完成；
>输出`REVIEW_REPORT.md`，必要时修订目标项目。
* **输出**：`REVIEW_REPORT.md`、修订后的目标项目。
* **WHO**：reviewer-agent智能体。
* **满足条件**：`REVIEW_REPORT.md`所有条目审核通过，目标项目文档与代码的一致性和完整性相匹配。

### framework project workflow stage 5 — venv环境与部署
* **输入**：完整的目标项目(含`README.md`、代码、配置文件等)、框架规范文件（`CLAUDE.md`、`VENV_CONFIG.md`、`DEBUG_CODE.md`、`DOCKER_CONFIG.md`等）。
* **DO WHAT**：
    > 读取目标项目`README.md`和`VENV_CONFIG.md`规范文件，生成目标项目的 `venv.md`（包含目标项目的python 版本、目标项目的requirements-cpu.txt或requirements-gpu.txt）
    >把`venv.md` 和规范文件副本`CLAUDE.md`、`DEBUG_CODE.md` `DOCKER_CONFIG.md`等复制到目标目录中。
* **输出**：`venv.md`。
* **WHO**：ops-agent智能体。
* **满足条件**：目标项目中包含`venv.md`，且内容正确；包含副本规范文件。

### framework project workflow stage 6 — 拷贝target project需要的md文件
- 拷贝CLAUDE_bugfix.md到目标项目根目录并重命名为：CLAUDE.md
- 拷贝CLAUDE_deploy.md到目标项目根目录

# collaborative multi-agent systems
- **requirements-agent**，详细需求文档编写
- **research-agent**，技术选型
- **coder-agent**，编写代码
- **reviewer-agent**，代码完整性检查，代码质量评审，对齐需求（requirement）
- **planner-agent**，根据需求和技术选型编排计划（plan），生成任务清单todo
- **ops-agent**,创建python venv环境，创建docker环境（CPU或者GPU）
- **tester-agent**，代码测试、功能测试和模块测试 
- **dataset-agent**，找到ML算法对应的最适合的开源数据集；为1-epoch训练抽取小数据集；数据采样和可视化

# Project Cognitive Boundary
- **本目录是框架（Framework）项目**，用于创建目标项目（如yolov10）
- **目标项目才是最终产物**，框架仅提供创建工具和流程
- **两阶段原则**：先VENV调试→后DOCKER部署

# AI action rules
- **卓越工作原则**， 所有代码都要检查一遍，不可以遗漏功能，不可以偷懒，绝对不能省略代码不写，必须要完整代码
- **绝不假设目标项目已存在**，创建前必须检查
- **绝不在本目录中创建程序代码**，不允许在本目录创建任何代码文件
- **严格遵守'.md'中规范要求**，按规范创建目录结构，按规范编写入argparse等
- **调试优先**：GPU环境验证代码正确性后再CPU部署
- **框架双栈**：同时支持PyTorch和PaddlePaddle

# tools
- **日志规范**，打印tool use 的详细信息