
# 工作流

## 1 工作流的最终目标

> 目标：从框架项目与模糊需求出发，生成目标项目初始包（代码骨架、规范副本、需求/技术/任务文档、mini 数据样本和 venv 规范）；进入目标项目，配置venv环境并修复所有的bug，实现1-epoch验证；配置docker生成环境，并验证生成环境部署；

## 2 框架项目中需要执行以下步骤

### 步骤 Stage 1 — 需求分析与规范理解
* **输入**：`CREATE.md`（框架规范），自然语言需求（用户提供，通常简短/模糊）。
* **WHO**：planner-agent智能体（主导），用户（回答并澄清问题）。
* **DO WAHT**：planner-agent智能体解析自然语言，抽取目标、SLA、约束这些条目；为低确定性条目打分并生成澄清问题集（若评分过低，写明需人工补充项）。
* **满足条件**：`requirements.md`中所有条目和问题的分数都要大于0.6,或存在明确的澄清项与后续处理策略。
* **输出**：`requirements.md`（结构化 YAML 或 Markdown，关键段落举例：项目名：英文，用作目标项目目录、问题：逐条陈述、SLA、约束条件、兼容性、需用户澄清的疑难问题、所有条目和澄清问题的打分0~1分）。

### 步骤 Stage 2 — 技术选型与数据集选择
* **输入**：`requirements.md`、`ML.md`（文件中的技术/架构指导部分）。
* **DO WHAT**：
>阅读`requirements.md`、`ML.md`架构指导，并负责搜索需求对应的候选模型,训练数据集（与算法相匹配的mini dataset 与 full dataset）,预估资源要求（模型参数量、显存大小、训练时长）和性能预期,生成算法对比表格。
* **输出**：`tech.md`（包含 2个候选AI模型、相匹配的数据集、模型的各种约束条件、AI算法优劣势对比表格）。
* **WHO**：coder-agent智能体。
* **满足条件**：至少 2 个候选模型，且为每个模型给出数据集需求与约束。

### 步骤 Stage 3 — 任务拆解与代码生成
* **输入**：`task.md`、`tech.md`、`requirements.md`、`ML.md`（文件中的API/代码骨架部分）、`OmegaConf_README.md`。
* **活动**：
    >planner-agent智能体读取`task.md`、`tech.md`、`ML.md`、`OmegaConf_README.md`规范，构建任务清单todo；
    >coder-agent智能体读取`tech.md`、`ML.md`、`OmegaConf_README.md`规范，逐项执行task生成代码骨架、目标项目README.md；生成代码和配置填充代码骨架；
    >coder-agent智能体记录任务执行结果，生成`PROJECT_BUILD_LOG.md`。
    >planner-agent智能体逐项验证task执行情况，验证和复核。总结结果并更新目标项目的`README.md`
* **输出**：`{xx}_project/`（目标项目,包含：代码骨架，用真实项目名称代替`{xx}_project/`），`PROJECT_BUILD_LOG.md`（任务清单执行结果记录）。
* **责任方**：planner-agent智能体（生成task清单，验收和复核task）, coder-agent智能体（执行清单，包括生成代码骨架、填充代码、生成配置文件、记录任务执行结果）。
* **满足条件**：代码骨架填充完整，例如包含可运行的训练脚本和推理脚本。PROJECT_BUILD_LOG.md逐项复核都通过。

### 步骤 Stage 4 — 代码与配置审核
* **输入**：：目标项目（包含`README.md`、代码、配置文件）、PROJECT_BUILD_LOG.md。
* **DO WHAT**：
>reviewer-agent智能体执行代码与配置的静态分析和`README.md`一致性校验；
>审核代码逻辑、依赖与`README.md`的匹配情况；
>针对`PROJECT_BUILD_LOG.md`逐项检查是否真正完成；
>输出`REVIEW_REPORT.md`，必要时修订目标项目。
* **输出**：`REVIEW_REPORT.md`、修订后的目标项目。
* **WHO**：reviewer-agent智能体。
* **满足条件**：`REVIEW_REPORT.md`所有条目审核通过，目标项目文档与代码的一致性和完整性相匹配。

### 步骤 Stage 5 — venv环境与部署
* **输入**：完整的目标项目(含`README.md`、代码、配置文件等)、框架规范文件（`CLAUDE.md`、`VENV_CONFIG.md`、`DEBUG_CODE.md`、`DOCKER_CONFIG.md`等）。
* **DO WHAT**：
    > 读取目标项目`README.md`和`VENV_CONFIG.md`规范文件，生成目标项目的 `venv.md`（包含目标项目的python 版本、目标项目的requirements-cpu.txt或requirements-gpu.txt）
    >把`venv.md` 和规范文件副本`CLAUDE.md`、`DEBUG_CODE.md` `DOCKER_CONFIG.md`等复制到目标目录中。
* **输出**：`venv.md`。
* **WHO**：ops-agent智能体。
* **满足条件**：目标项目中包含`venv.md`，且内容正确；包含副本规范文件。



---

## 3. 目标项目需要执行以下步骤

> **最终目标**：在目标项目内完成环境搭建、在 mini 数据集上的 1-epoch 验证与所有 bugfix，最终输出可运行的验证记录与全量训练指导文档。


### 步骤 Stage 1 — CLAUDE 校验与本地规范定制(可选)
* **输入**：`CLAUDE.md`。  
  - 规范文件：`venv.md`、`VENV_CONFIG.md`、`DEBUG_CODE.md`、`DOCKER_CONFIG.md`，在后续阶段中作为环境与调试配置的基础。  
* **DO WHAT**：  
  - 读取并显示 `CLAUDE.md` 关键条目（AI行为守则等）；  
  - 提示用户是否定制或增加组织特定规则；  
  - 将所有修改与决策记录到本地 `CLAUDE.local.md`，若用户选择完全继承，则生成 `CLAUDE.inherited.md`。  
* **输出**：  
  - `CLAUDE.local.md`（如有定制）  
  - 或 `CLAUDE.inherited.md`（如确认继承）  
* **WHO**：用户（人工确认）、Planner智能体（辅助校验与提示）。  
* **满足条件**：目标项目目录下存在 `CLAUDE.local.md` 或 `CLAUDE.inherited.md` 文件，且变更日志完整可追溯。  


### 步骤 Stage 2 — 环境构建与 mini 数据集准备
* **输入**：`venv.md`、`README.md`、`requirements-cpu.txt`、`requirements-gpu.txt`。
* **DO WHAT**：
    >执行 `python -m venv debug-cpu`，`pip install -r requirements-cpu.txt` 或者执行 `python -m venv debug-gpu`，`pip install -r requirements-gpu.txt`（要求用户二选一）；
    >Dataset 智能体按`venv.md`中规范抽样构建 mini数据集 并生成 `data/mini/`（样本数据、样本数、样本类别和分布等），创建notebook做可视化。
* **输出**：`env_check_report.md`（Python、包版本、可用 GPU 信息）、`data/mini/`（mini 数据集）与 `mini_dataset.md`（mini数据集使用说明和指标）。
* **WHO**：Ops 智能体 + Dataset 智能体
* **满足条件**：`env_check_report.md` 包含 `python_version`、`packages_installed`等环境安装和配置报告；mini 数据可被scripts目录下的notebook可视化。

### 步骤 Stage 3 — 1-epoch 验证与自动 bugfix
* **输入**：`scripts/train.py`, `data/mini/`, `DEBUG_CODE.md`。
* **DO WHAT**：
    > 根据`DEBUG_CODE.md`规范,执行`scripts/train.py`, 1-epoch 快速训练（`--fast_dev_run` 或 `--epochs 1`）；
    > Coder智能体自动采集错误信息和修复bug，生成（或更新）bugfix报告；并再次测试直至通过。
* **输出**：`bugfix_report.md`（问题清单、bug摘要、bug修复日志、测试结果）、最终训练输出checkpoint模型文件。
* **WHO**：Coder智能体。
* **满足条件**：1-epoch 运行成功，`bugfix_report.md` 中所有“关键错误”标记为已修复。

### 步骤 Stage 4 — 全量训练策略输出
* **输入**：`bugfix_report.md`、技术选型文档-`tech.md`。
* **DO WHAT**：根据`tech.md`生成全量训练指导文档 `full_train_guidance.md`，包括推荐的 batch\_size、learning\_rate schedule、epoch 数、checkpoint 策略、数据增强策略、分布式训练建议与监控点、各种性能配置的训练脚本示例。
* **输出**：全量训练指导文档-`full_train_guidance.md`（可直接用于 GPU 分布式训练环境）。
* **WHO**：Coder 智能体。
* **满足条件**：全量训练指导文档-`full_train_guidance.md` 包含明确的参数范围与部署步骤，且与 `tech.md` 中的资源估计一致。

---

## 4 生产部署（容器化、镜像构建、部署与监控）

> 最终目标：在生产运行时构建并验证 Docker 镜像/Compose 编排，启动服务并通过健康检查与 smoke tests，配置监控与回滚策略。


### 步骤 Stage 1 — Docker环境检测与准备

* **输入**：本地/远端节点信息、`DOCKER_CONFIG.md`。
* **DO WHAT**：
>检测 `docker` / `docker-compose` 是否存在并满足版本要求（脚本：`docker --version`、`docker-compose --version`）；若缺失，给出平台化安装步骤并在用户确认下执行安装命令（或提供交互指南）。
>根据`DOCKER_CONFIG.md`,检测 GPU passthrough 能力（NVIDIA Docker 支持）。
* **输出**：`docker_env_report.md`（docker\_version、compose\_version、gpu\_passthrough）。
* **WHO**：Ops智能体，用户确认安装。
* **满足条件**：`docker_env_report.md` 显示符合作业的必要条件（例如 GPU 镜像需 `nvidia-docker` 支持）。

### 步骤 Stage 2 — 镜像构建与容器校验
* **输入**：`Dockerfile`（CPU/GPU 变体由 `DOCKER_CONFIG.md` 生成）、docker环境的python依赖`requirements.txt`、模型权重文件（提示用户输入）。
* **DO WHAT**：
>构建镜像（`docker build -t my_project:gpu-v1 .`）；
>运行镜像内校验脚本（例如 `python -c "import torch; print(torch.cuda.is_available())"`）；生成 `container_env_check.log`。
* **输出**：构建的镜像（tag），`container_env_check.log`。
* **WHO**：Ops智能体。
* **满足条件**：若为 GPU 镜像，`container_env_check.log` 必须显示 `cuda_available: true`；镜像体积、层次结构符合规范（例如依赖层最小化）。

### 步骤 Stage 3 — 部署启动与 API、Docs、健康与性能检查
* **输入**：构建的镜像、`deploy/docker/`文件夹，包含：`docker-compose.yml`、Dockerfile。
* **DO WHAT**：
>执行 `docker-compose up -d`；
>运行健康检查 `/health`、文档检查`/docs`
>API 调用（推理样例 curl）与性能采样；进行冒烟测试，收集 latency、throughput、memory usage；
>若检测到致命失败，生成 issue 并停止docker容器，撰写报告`docker_error_report_N.md`。
>若成功，撰写报告`deploy_report.md`，将测试结果(含SLAs)更新到`README.md`
* **输出**：`deploy_report.md`（部署时间、服务端点、健康检查结果、smoke tests 结果、resource metrics）。
* **WHO**：Ops智能体。
* **满足条件**：`/health` 返回 OK，smoke test 通过，关键 SLAs（延迟、吞吐）未超过阈值。

### 步骤 Stage 4 — Docker运行监控 / 需求回顾
* **输入**：运行的docker容器、`deploy_report.md`、`tech.md` 和`README.md`
* **活动**：
> 配置监控（Prometheus/Grafana 指标、告警规则）、设置规范漂移检测（生产指标触发 Spec 漂移器），定义回滚策略（蓝绿或 Canary）
> 回顾`README.md`中原始需求条目，并根据运行结果，监控结果更新`README.md`。
* **输出**：`docker_running_report.md`；更新`README.md`。
* **责任方**：Tester智能体, Planning智能体。
* **满足条件**：可通过监控仪表盘追踪指标；`README.md`中需求完全实现，API或者功能正常，性能指标正常，测试结果汇总完整。

---