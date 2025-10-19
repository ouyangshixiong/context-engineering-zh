# Spec 驱动的 自主智能体 软件工程 机器学习 框架
**简单几句需求就可以生成完整的各类算法，示例(大模型无需读以下3个示例)：**
1. [规范驱动的自主编程智能体（Spec Driven AI Coder）案例一：机器翻译](https://www.bilibili.com/video/BV1q2hGztE6W/?share_source=copy_web&vd_source=2b795d30f73f247a28f83b4da22b4656) 
2. [规范驱动的自主编程智能体（Spec Driven AI Coder）案例二：人脸识别](https://www.bilibili.com/video/BV1ZStjzcErn/?share_source=copy_web&vd_source=2b795d30f73f247a28f83b4da22b4656)
3. [规范驱动的自主编程智能体（Spec Driven AI Coder）案例三：粤语翻译普通话](https://www.bilibili.com/video/BV1tdtJz9ENj/?share_source=copy_web&vd_source=2b795d30f73f247a28f83b4da22b4656)

> 目标读者：AI agentic Coder、机器学习专家和软件工程专家。
> 要求：同时兼顾大语言模型与人类可读性（便于 AI agent 阅读）。

---

## 目录

1. 概念与理论基础
2. 模式对比：氛围（vibe）编程 vs Spec 驱动
3. 框架与开发流程（图文并茂，使用指定模板格式，详尽填充）

   * 框架项目：两阶段
   * 目标项目：两阶段
   * 生产部署：两阶段
4. 结语：可操作性与审计链

---

# 1. 概念与理论基础

## 1.1 问题陈述与方法论定位

在机器学习算法的工程落地中，需求表述常以简短、模糊的自然语言形式表达。由此产生的问题与挑战：
* 需求漂移（需求在多轮LLM对话传递中变形）
* 实现不可追溯（隐式假设与工程决策未被记录）
* 验证难以自动化（人工主导、覆盖不足）
* 技术债务的累积

**针对这些问题与挑战，本框架提出《Spec 驱动的自主智能体（Spec-driven agentic-ai-coder）》作为新一代的软件工程方法论**：将“可执行规范（Spec）”作为事实（ground truth，GT），由多角色自主智能体依照规范进行规划（plan）、实现（create）、验证（validate）与部署（deploy），从而实现面向机器学习（ML）项目的软件工程方法论的理论科学性、过程透明性、流程可重复性和结果可审计性。

## 1.2 软件工程理论回顾

#### 一、瀑布模型（Waterfall）

**核心思想**：线性阶段化：需求 → 设计 → 实现 → 测试 → 部署。
每一阶段以文档化交付物为验收点，按序推进，阶段间变更受控。
**优点**：流程清晰、责任边界明确、适合强监管或合同驱动场景（合规、验收标准明确）。
**缺点**：对需求变更适应性差；反馈周期长；不利于探索性工作，例如：机器学习（ML）算法编程。
**适用情境**：需求稳定、法律/合规要求高（医疗、航空、金融）或外包/合同式交付。

---

#### 二、V 模型（Verification & Validation）

**核心思想**：在瀑布模型基础上改进，强调每个开发阶段应有对应的验证活动（设计对应单元测试、需求对应验收测试），形成“设计—验证”对偶关系。
**优点**：测试与设计并行规划，提高可验证性与可追溯性；便于形成完整的验证矩阵。
**缺点**：同样对快速变更不友好；需要较强的测试投入与早期规格明确性。
**适用情境**：高安全/高可靠场景，且具有清晰可度量的规格要求。

---

#### 三、Scrum（迭代增量式敏捷）

**核心思想**：短周期（Sprint）迭代、跨职能团队、以产品 Backlog 驱动增量交付，强调频繁交付与客户反馈。
**优点**：适应性强、能快速交付可运行增量并通过评审获得反馈；易于组织跨学科协作。
**缺点**：对长期架构一致性与系统化文档化的自然驱动力较弱；对团队自律与产品职责要求高。
**适用情境**：探索性项目、需求经常变化或需频繁验证用户反馈的产品化路线。

---

#### 四、看板（Kanban）

**核心思想**：以流为中心管理工作项，限流（WIP）以降低切换成本，通过可视化与循环时间指标优化交付节奏。
**优点**：对持续发布、运维与小粒度改动非常友好；可平滑化团队负载。
**缺点**：对大型特性或需协调多个团队的交付不如迭代式明确（需要额外的里程碑机制）。
**适用情境**：维护/运维、持续交付环境或变更密集但规模较小的任务流。

---

#### 五、极限编程（XP）

**核心思想**：强调工程实践（TDD、结对编程、持续集成、持续重构、小步提交），用工程纪律降低变更风险并提升代码质量。
**优点**：在高变更率环境下，通过严格实践保障质量，减少技术债务。
**缺点**：对团队技能与文化要求高（需要习惯结对、重构与频繁测试）。
**适用情境**：需要频繁重构、快速演化且对质量有严格要求的软件开发场景，尤其适合复杂、实验性强但需高质量产出的工程。

## 1.3 多角色自主智能体角色分工与自治体制

框架定义一组自主智能体（requirements，planner, coder, tester, ops），它们基于统一的规范（Spec）文档进行协作：

* **requirements（需求智能体）**：将模糊需求形式化为可执行 Spec，做约束分析、资源估算和架构选择。
* **Planner（规划智能体）**：将需求和技术规范转换为任务清单todos。
* **Coder（编码智能体）**：依据 Spec 生成实现、封装可复用组件并进行性能优化。
* **Dataset（数据集智能体）**： 为ML算法模型在1-epoch阶段和全量数据阶段，搜索，下载，读取，可视化和使用对应的数据集。例如：Huggingface、ModelScope支持的各种数据集。
* **Reviewer（代码审查智能体）**：依据 Spec 审查代码是否完全满足需求，给出评价。
* **Tester（测试智能体）**：对实现进行各类测试、性能基准并生成报告。
* **Ops（运维智能体）**：负责部署清单、监控配置、蓝绿/回滚策略与持续演进。

这种角色化的智能体分工对应软件工程中的“职责分离”原则，并通过 Spec 将决策与实现显式绑定，形成“决策可追溯—实现可验证—部署可回退”的闭环。

---

# 2. 模式对比：氛围（vibe）编程 vs Spec 驱动

**论述要点**：

* 氛围编程的核心竞争力是速度和创意自由，适合未知问题的探索期；但其隐含假设、随意性和临时性实现会导致难以迁移到生产。
* Spec 驱动将“需求—实现—验证”映射为可被自主编程智能体理解和执行的规范文件，这使得智能体协作变得可控、实现过程可审计，结果可验证，且利于降低长期维护成本。


---

# 3 框架项目、目标项目与生产部署

## 3.1 框架项目（本项目）

> 目标：从框架项目与模糊需求出发，生成目标项目初始包（代码骨架、规范副本、需求/技术/任务文档、mini 数据样本和 venv 规范），作为目标项目启动点。

```mermaid
flowchart LR
    S1[Stage 1: 需求分析与规范理解]
    S2[Stage 2: 技术选型与数据集选择]
    S3[Stage 3: 任务拆解与代码生成]
    S4[Stage 4: venv环境与部署]
    IN[输入: 框架规范markdown文件集 + 简短自然语言需求]
    OUT[输出: 目标项目初始包（requirements/, tech.md, code skeleton, venv.md, mini dataset）]

    IN --> S1 --> S2 --> S3 --> S4 --> OUT
```

### 3.1.1 Stage 1 — 需求分析与规范理解
```mermaid
flowchart LR

    %% ================= Stage 1 =================
    I1["输入:
    - CREATE.md
    - 自然语言需求"]

    O1["输出:
    - requirements/requirements.md
    - requirements/research-report.md"]

    subgraph S1["Stage 1 — 需求分析与规范理解"]
        W1["WHO:
        - requirements-plugin 命令
        - requirements-agent
        - research-agent
        - 用户"]

        A1["DO WHAT:
        - 使用 /requirements-plugin:需求分析 命令
        - 解析自然语言需求
        - 技术关键词识别与调研
        - 深度需求分析与澄清
        - 生成结构化需求文档"]

        V1["满足条件:
        - 所有条目/问题分数 > 0.6
        - 明确澄清项与补充
        - 技术可行性验证通过"]

        W1 --> A1 --> V1
    end

    I1 --> S1 --> O1
```
* **输入**：`CREATE.md`（框架规范），自然语言需求（用户提供，通常简短/模糊）。
* **WHO**：requirements-plugin 命令（主导），requirements-agent（需求分析），research-agent（技术调研），用户（回答并澄清问题）。
* **DO WHAT**：
  > 使用 `/requirements-plugin:需求分析` 命令启动需求分析流程；
  > requirements-agent 解析自然语言，抽取目标、SLA、约束这些条目，进行15分钟深度思考；
  > 如包含技术关键词，research-agent 进行技术调研并生成技术报告；
  > 为低确定性条目打分并生成澄清问题集（若评分过低，写明需人工补充项）。
* **满足条件**：`requirements/requirements.md`中所有条目和问题的分数都要大于0.6,或存在明确的澄清项与后续处理策略；技术可行性验证通过。
* **输出**：`requirements/requirements.md`（结构化需求文档），`requirements/research-report.md`（技术调研报告，如有技术关键词）。

### 3.1.2 Stage 2 — 技术选型与数据集选择
```mermaid
flowchart LR
    %% ================= Stage 2 =================
    I2["📥 输入文件:
    - requirements/requirements.md
    - ML.md(技术/架构指导部分)"]

    O2["📤 输出文件:
    tech.md"]

    subgraph S2["Stage 2 — 技术选型与数据集选择"]
        direction TB
        W2["WHO:
        - Coder智能体"]

        A2["DO WHAT:
        - 候选模型（2个）
        - 数据集计划(mini/full)
        - 预估资源需求
        - 算法对比表"]

        V2["满足条件:
        - 至少2个候选模型
        "]
        
        W2 --> A2 --> V2
    end

    I2 --> S2 --> O2
```
* **输入**：`requirements/requirements.md`、`ML.md`（文件中的技术/架构指导部分）。
* **DO WHAT**：
>阅读`requirements/requirements.md`、`ML.md`架构指导，并负责搜索需求对应的候选模型,训练数据集（与算法相匹配的mini dataset 与 full dataset）,预估资源要求（模型参数量、显存大小、训练时长）和性能预期,生成算法对比表格。
* **输出**：`tech.md`（包含 2个候选AI模型、相匹配的数据集、模型的各种约束条件、AI算法优劣势对比表格）。
* **WHO**：Coder智能体。
* **满足条件**：至少 2 个候选模型，且为每个模型给出数据集需求与约束。

### 3.1.3 Stage 3 — 任务拆解与代码生成
```mermaid
flowchart LR
    %% ================= Stage 3 =================
    I3["📥 输入文件:
    - task.md
    - tech.md
    - requirements/requirements.md
    - ML.md(API/代码骨架部分)
    - OmegaConf_README.md"]

    O3["📤 输出文件:
    - project/（包含README.md）
    - PROJECT_BUILD_LOG.md"]

    subgraph S3["Stage 3 — 任务拆解与代码生成"]
        direction TB
        W3["WHO:
        - Coder智能体
        - Planner智能体"]

        A3["DO WHAT:
        - 生成任务清单
        - 创建代码骨架
        - 执行任务清单并填充代码骨架
        - 记录任务执行结果"]

        V3["满足条件:
        - 代码骨架填充完整
        - PROJECT_BUILD_LOG.md逐项复核通过"]

        W3 --> A3 --> V3
    end

    I3 --> S3 --> O3
```
* **输入**：`task.md`、`tech.md`、`requirements/requirements.md`、`ML.md`（文件中的API/代码骨架部分）、`OmegaConf_README.md`。
* **活动**：
    >Planner智能体读取`task.md`、`tech.md`、`ML.md`、`OmegaConf_README.md`规范，构建task清单；
    >Coder智能体读取`tech.md`、`ML.md`、`OmegaConf_README.md`规范，逐项执行task生成代码骨架、目标项目README.md；生成代码和配置填充代码骨架；
    >Coder智能体记录任务执行结果，生成`PROJECT_BUILD_LOG.md`。
    >Planner智能体逐项验证task执行情况，验证和复核。总结结果并更新目标项目的`README.md`
* **输出**：`{xx}_project/`（目标项目,包含：代码骨架，用真实项目名称代替`{xx}_project/`），`PROJECT_BUILD_LOG.md`（任务清单执行结果记录）。
* **责任方**：Planner智能体（生成task清单，验收和复核task）, Coder智能体（执行清单，包括生成代码骨架、填充代码、生成配置文件、记录任务执行结果）。
* **满足条件**：代码骨架填充完整，例如包含可运行的训练脚本和推理脚本。PROJECT_BUILD_LOG.md逐项复核都通过。

### 3.1.4 Stage 4 — 代码与配置审核
```mermaid
flowchart LR
    %% ================= Stage 4 =================
    I4["📥 输入文件:
    - 目标项目(含README/代码/配置)
    - PROJECT_BUILD_LOG.md"]

    O4["📤 输出文件:
    - REVIEW_REPORT.md"]

    subgraph S4["Stage 4 — 代码与配置审核"]
        direction TB
        W4["WHO:
        - Reviewer智能体"]

        A4["DO WHAT:
        - 静态检查代码风格、依赖与README.md一致性
        - 检查算法核心代码是否完整
        - 审核配置文件与README.md一致性
        - 对PROJECT_BUILD_LOG.md逐项复核"]

        V4["满足条件:
        - REVIEW_REPORT.md所有条目通过"]

        W4 --> A4 --> V4
    end

    I4 --> S4 --> O4

```
* **输入**：：目标项目（包含`README.md`、代码、配置文件）、PROJECT_BUILD_LOG.md。

* **DO WHAT**：
>Reviewer智能体执行代码与配置的静态分析和`README.md`一致性校验；
>审核代码逻辑、依赖与`README.md`的匹配情况；
>针对`PROJECT_BUILD_LOG.md`逐项检查是否真正完成；
>输出`REVIEW_REPORT.md`，必要时修订目标项目。
* **输出**：`REVIEW_REPORT.md`、修订后的目标项目。
* **WHO**：Reviewer智能体。
* **满足条件**：`REVIEW_REPORT.md`所有条目审核通过，目标项目文档与代码的一致性和完整性相匹配。

### 3.1.5 Stage 5 — venv环境与部署
```mermaid
flowchart LR
    %% ================= Stage 4 =================
    I5["📥 输入文件:
    - 目标项目(含README/代码/配置)
    - CLAUDE.md
    - tech.md
    - VENV_CONFIG.md
    - DEBUG_CODE.md
    - DOCKER_CONFIG.md"]

    O5["📤 输出文件:
    - venv.md
    - CLAUDE.md
    - tech.md
    - VENV_CONFIG.md
    - DEBUG_CODE.md
    - DOCKER_CONFIG.md"]

    subgraph S5["Stage 5 — venv环境与部署"]
        direction TB
        W5["WHO:
        - Ops智能体"]

        A5["DO WHAT:
        - 读取 README.md  VENV_CONFIG.md
        - 生成 venv.md
        - 复制规范文件到目标目录"]

        V5["满足条件:
        - venv.md 正确
        - 规范文件副本齐全"]

        W5 --> A5 --> V5
    end

    I5 --> S5 --> O5

```
* **输入**：完整的目标项目(含`README.md`、代码、配置文件等)、框架规范文件（`CLAUDE.md`、`VENV_CONFIG.md`、`DEBUG_CODE.md`、`DOCKER_CONFIG.md`等）。
* **DO WHAT**：
    > 读取目标项目`README.md`和`VENV_CONFIG.md`规范文件，生成目标项目的 `venv.md`（包含目标项目的python 版本、目标项目的requirements-cpu.txt或requirements-gpu.txt）
    >把`venv.md` 和规范文件副本`CLAUDE.md`、`DEBUG_CODE.md` `DOCKER_CONFIG.md`等复制到目标目录中。
* **输出**：`venv.md`。
* **WHO**：Ops智能体。
* **满足条件**：目标项目中包含`venv.md`，且内容正确；包含副本规范文件。



---

## 3.2 目标项目（环境准备与 1-epoch 验证）

> **目标**：在目标项目内使用新的`CLAUDE.md`（bugfix版本）中的工作流和相关规范文件，完成环境搭建、在 mini 数据集上的 1-epoch 验证与所有 bugfix，最终输出可运行的验证记录与全量训练指导文档。

```mermaid
flowchart LR
    S2[Stage 1: 环境构建与 mini 数据集准备]
    S3[Stage 2: 1-epoch 验证与自动 bugfix]
    S4[Stage 3: 全量训练策略输出]
    IN[输入: 目标项目初始包（venv.md, CLAUDE.md, VENV_CONFIG.md, DEBUG_CODE.md, DOCKER_CONFIG.md）]
    OUT[输出: env_check_report.json, bugfix_report.md, full_train_guidance.md]

    IN --> S2 --> S3 --> S4 --> OUT
```


### 3.2.1 Stage 1 — 环境构建与 mini 数据集准备
```mermaid
flowchart LR
    %% ================= Stage X =================
    I["📥 输入文件:
    - venv.md
    - README.md
    - requirements-gpu.txt
    - requirements-cpu.txt"]

    O["📤 输出文件:
    - env_check_report.md报告
    - data/mini/ 数据集
    - mini_dataset.md使用说明"]

    subgraph S["Stage — 环境准备与数据抽样"]
        direction TB
        W["WHO:
        - Ops智能体
        - Dataset智能体"]

        A["DO WHAT:
        - 创建venv环境
        - 安装requirements
        - 抽样构建 mini数据集，创建notebook做可视化
        - 生成mini数据集使用说明"]

        V["满足条件:
        - env_check_report.md 中的指标
        - 能notebook可视化"]

        W --> A --> V
    end

    I --> S --> O


```
* **输入**：`venv.md`、`README.md`、`requirements-cpu.txt`、`requirements-gpu.txt`。
* **DO WHAT**：
    >执行 `python -m venv debug-cpu`，`pip install -r requirements-cpu.txt` 或者执行 `python -m venv debug-gpu`，`pip install -r requirements-gpu.txt`（要求用户二选一）；
    >Dataset 智能体按`venv.md`中规范抽样构建 mini数据集 并生成 `data/mini/`（样本数据、样本数、样本类别和分布等），创建notebook做可视化。
* **输出**：`env_check_report.md`（Python、包版本、可用 GPU 信息）、`data/mini/`（mini 数据集）与 `mini_dataset.md`（mini数据集使用说明和指标）。
* **WHO**：Ops 智能体 + Dataset 智能体
* **满足条件**：`env_check_report.md` 包含 `python_version`、`packages_installed`等环境安装和配置报告；mini 数据可被scripts目录下的notebook可视化。

### 3.2.2 Stage 2 — 1-epoch 验证与自动 bugfix
```mermaid
flowchart LR
    %% ================= Stage X =================
    I["📥 输入文件:
    - scripts/train.py
    - data/mini/
    - DEBUG_CODE.md"]

    O["📤 输出文件:
    - bugfix_report.md
    - 训练输出 checkpoint模型文件"]

    subgraph S["Stage X — 快速训练与补丁修复"]
        direction TB
        W["WHO:
        - Coder智能体"]

        A["DO WHAT:
        - 执行 1-epoch 快速训练
        - 自动bugfix
        - 生成bugfix报告"]

        V["满足条件:
        - 1-epoch 成功
        - bugfix_report.md 中所有错误已修复"]

        W --> A --> V
    end

    I --> S --> O

```
* **输入**：`scripts/train.py`, `data/mini/`, `DEBUG_CODE.md`。
* **DO WHAT**：
    > 根据`DEBUG_CODE.md`规范,执行`scripts/train.py`, 1-epoch 快速训练（`--fast_dev_run` 或 `--epochs 1`）；
    > Coder智能体自动采集错误信息和修复bug，生成（或更新）bugfix报告；并再次测试直至通过。
* **输出**：`bugfix_report.md`（问题清单、bug摘要、bug修复日志、测试结果）、最终训练输出checkpoint模型文件。
* **WHO**：Coder智能体。
* **满足条件**：1-epoch 运行成功，`bugfix_report.md` 中所有“关键错误”标记为已修复。

### 3.2.3 Stage 3 — 全量训练策略输出
```mermaid
flowchart LR
    %% ================= Stage X =================
    I["📥 输入文件:
    - bugfix_report.md
    - tech.md"]

    O["📤 输出文件:
    - full_train_guidance.md
    - 训练准备 checklist"]

    subgraph S["Stage X — 训练指导生成"]
        direction TB
        W["WHO:
        - Coder 智能体"]

        A["DO WHAT:
        - 生成 full_train_guidance.md"]

        V["满足条件:
        - 指导文件包含：
          参数与性能估计、
          训练脚本、
          训练过程可视化监控
        - 与 tech.md 规范一致"]

        W --> A --> V
    end

    I --> S --> O

```
* **输入**：`bugfix_report.md`、技术选型文档-`tech.md`。
* **DO WHAT**：根据`tech.md`生成全量训练指导文档 `full_train_guidance.md`，包括推荐的 batch\_size、learning\_rate schedule、epoch 数、checkpoint 策略、数据增强策略、分布式训练建议与监控点、各种性能配置的训练脚本示例。
* **输出**：全量训练指导文档-`full_train_guidance.md`（可直接用于 GPU 分布式训练环境）。
* **WHO**：Coder 智能体。
* **满足条件**：全量训练指导文档-`full_train_guidance.md` 包含明确的参数范围与部署步骤，且与 `tech.md` 中的资源估计一致。

---

## 3.3 生产部署（容器化、镜像构建、部署与监控）

> 目标：在生产运行时构建并验证 Docker 镜像/Compose 编排，启动服务并通过健康检查与 smoke tests，配置监控与回滚策略。

```mermaid
flowchart LR
    S1[Stage 1: 运行时环境检测与准备]
    S2[Stage 2: 镜像构建与容器校验]
    S3[Stage 3: 部署启动与 API 健康检查]
    S4[Stage 4: 监控/回滚/规范演进]
    IN[输入: 目标项目可运行包 + Docker 规范 DOCKER_CONFIG.md]
    OUT[输出: deploy_report.md, running_services, monitoring_config]

    IN --> S1 --> S2 --> S3 --> S4 --> OUT
```

### 3.3.1 Stage 1 — Docker环境检测与准备
```mermaid
flowchart LR
    %% ================= Stage 2 =================
    I["📥 输入文件:
    - 本地/远端节点信息
    - DOCKER_CONFIG.md"]

    O["📤 输出文件:
    - docker_env_report.md"]

    subgraph S["Stage 2 — Docker 环境检测与准备"]
        direction TB
        W["WHO:
        - Ops 智能体
        - 用户确认安装"]

        A["DO WHAT:
        - 检测 docker / docker-compose 并安装
        - 检测 GPU可用以及性能"]

        V["满足条件:
        - docker_env_report.md 符合作业需求
        - GPU 镜像需 nvidia-docker 支持"]

        W --> A --> V
    end

    I --> S --> O

```
* **输入**：本地/远端节点信息、`DOCKER_CONFIG.md`。
* **DO WHAT**：
>检测 `docker` / `docker-compose` 是否存在并满足版本要求（脚本：`docker --version`、`docker-compose --version`）；若缺失，给出平台化安装步骤并在用户确认下执行安装命令（或提供交互指南）。
>根据`DOCKER_CONFIG.md`,检测 GPU passthrough 能力（NVIDIA Docker 支持）。
* **输出**：`docker_env_report.md`（docker\_version、compose\_version、gpu\_passthrough）。
* **WHO**：Ops智能体，用户确认安装。
* **满足条件**：`docker_env_report.md` 显示符合作业的必要条件（例如 GPU 镜像需 `nvidia-docker` 支持）。

### 3.3.2 Stage 2 — 镜像构建与容器校验
```mermaid
flowchart LR
    %% ================= Stage 2 =================
    I["📥 输入文件:
    - Dockerfile
    - requirements.txt
    - 模型权重 (提示用户输入)"]

    O["📤 输出文件:
    - 构建的镜像 (tag)"]

    subgraph S["Stage 2 — 镜像构建与容器校验"]
        direction TB
        W["WHO:
        - Ops智能体"]

        A["DO WHAT:
        - 构建镜像
        - 运行镜像内校验脚本 
        - 生成 container_env_check.log"]

        V["满足条件:
        - container_env_check.log必须包含 cuda_available: true"]

        W --> A --> V
    end

    I --> S --> O

```
* **输入**：`Dockerfile`（CPU/GPU 变体由 `DOCKER_CONFIG.md` 生成）、docker环境的python依赖`requirements.txt`、模型权重文件（提示用户输入）。
* **DO WHAT**：
>构建镜像（`docker build -t my_project:gpu-v1 .`）；
>运行镜像内校验脚本（例如 `python -c "import torch; print(torch.cuda.is_available())"`）；生成 `container_env_check.log`。
* **输出**：构建的镜像（tag），`container_env_check.log`。
* **WHO**：Ops智能体。
* **满足条件**：若为 GPU 镜像，`container_env_check.log` 必须显示 `cuda_available: true`；镜像体积、层次结构符合规范（例如依赖层最小化）。

### 3.3.3 Stage 3 — 部署启动与 API、Docs、健康与性能检查
```mermaid
flowchart LR
    %% ================= Stage 3 =================
    I["📥 输入文件:
    - 镜像
    - deploy/docker文件夹"]

    O["📤 输出文件:
    - deploy_report.md
    - 或 docker_error_report.md"]

    subgraph S["Stage 3 — 部署启动与 API 健康检查"]
        direction TB
        W["WHO:
        - Ops 智能体"]

        A["DO WHAT:
        - 执行 docker-compose up -d
        - 运行 /health 健康检查
        - API 调用测试 (推理样例 curl)
        - 性能验证
        - 如失败，撰写报告docker_error_report.md"]

        V["满足条件:
        - /health 返回 OK
        - curl推理测试通过
        - 冒烟测试通过
        - 关键 SLAs (延迟、吞吐) 未超过阈值"]

        W --> A --> V
    end

    I --> S --> O

```
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

### 3.3.4 Stage 4 — Docker运行监控 / 需求回顾
```mermaid
flowchart LR
    %% ================= Stage 4 =================
    I["📥 输入文件:
    - docker容器
    - tech.md
    - deploy_report.md
    - README.md"]

    O["📤 输出文件:
    - README.md
    - docker_running_report.md"]

    subgraph S["Stage 4 — Docker运行监控 / 需求回顾"]
        direction TB
        W["WHO:
        - Tester智能体
        - Planner智能体"]

        A["DO WHAT:
        - 配置监控（Prometheus/Grafana 指标、告警规则）
        - 设置规范漂移检测（生产指标触发 Spec 漂移器）
        - 回顾原始需求条目，更新目标项目的README.md"]

        V["满足条件:
        - 可通过仪表盘追踪主要 KPI
        - README.md中需求完全实现，API或者功能正常"]

        W --> A --> V
    end

    I --> S --> O

```
* **输入**：运行的docker容器、`deploy_report.md`、`tech.md` 和`README.md`
* **活动**：
> 配置监控（Prometheus/Grafana 指标、告警规则）、设置规范漂移检测（生产指标触发 Spec 漂移器），定义回滚策略（蓝绿或 Canary）
> 回顾`README.md`中原始需求条目，并根据运行结果，监控结果更新`README.md`。
* **输出**：`docker_running_report.md`；更新`README.md`。
* **责任方**：Tester智能体, Planning智能体。
* **满足条件**：可通过监控仪表盘追踪指标；`README.md`中需求完全实现，API或者功能正常，性能指标正常，测试结果汇总完整。

---
## 3.4 各阶段智能体功能与职责汇总
```mermaid
flowchart TD

    %% ================= 框架项目 =================
    subgraph F1["框架项目"]

        S1_who["智能体: requirements-plugin + requirements-agent + research-agent"]
        S1_desc["Stage1 — 需求分析与规范理解: 使用插件命令进行需求分析，技术调研，生成结构化需求文档"]
        S2_who["智能体: Coder编程智能体"]
        S2_desc["Stage2 — 技术选型与数据集选择: 候选模型选择，数据集计划，资源评估"]
        S3_who["智能体: Planner规划智能体 + Coder编程智能体"]
        S3_desc["Stage3 — 任务拆解与代码生成: 生成任务清单，创建代码骨架，填充实现"]
        S4_who["智能体: Reviewer智能体"]
        S4_desc["Stage4 — 代码与配置审核: REVIEWER_REPORT.md所有条目通过"]
        S41_who["智能体: Ops运维智能体"]
        S41_desc["Stage5 — venv环境与部署: 生成 venv.md，复制规范文件"]

        S1_who --> S1_desc
        S2_who --> S2_desc
        S3_who --> S3_desc
        S4_who --> S4_desc
        S41_who --> S41_desc

    end

    %% ================= 目标项目 =================
    subgraph F2["目标项目"]

        S6_who["智能体: Ops运维智能体 + Dataset数据智能体"]
        S6_desc["Stage1 — 环境构建与 mini 数据集准备: 安装依赖，抽样生成 mini 数据集并可视化"]
        S7_who["智能体: Coder编程智能体"]
        S7_desc["Stage2 — 1-epoch 验证与自动 bugfix: 执行快速训练并自动修复错误"]
        S8_who["智能体: Coder编程智能体"]
        S8_desc["Stage3 — 全量训练策略输出: 生成 full_train_guidance.md, 包含训练脚本与参数"]

        S6_who --> S6_desc
        S7_who --> S7_desc
        S8_who --> S8_desc

    end

    %% ================= 生产部署 =================
    subgraph F3["生产部署"]

        S9_who["智能体: Ops运维智能体 + 用户"]
        S9_desc["Stage1 — Docker环境检测与准备: 检测/安装 Docker & GPU, 输出环境报告"]
        S10_who["智能体: Ops运维智能体"]
        S10_desc["Stage2 — 镜像构建与容器校验: 构建镜像并校验 CUDA/GPU 可用性"]
        S11_who["智能体: Ops运维智能体"]
        S11_desc["Stage3 — 部署启动与 API 健康检查: docker-compose 启动, 健康检查, 性能验证"]
        S12_who["智能体: Planner规划智能体 + Tester测试智能体"]
        S12_desc["Stage4 — 运行监控与需求回顾: 配置监控与告警, 回顾需求, 更新 README"]

        S9_who --> S9_desc
        S10_who --> S10_desc
        S11_who --> S11_desc
        S12_who --> S12_desc

    end

    F1 --> F2 --> F3

```


## 3.5 各阶段通用产物映射（便于追溯）

| 模块           | 阶段                             | 产物                                                   | 说明                                        |
| ------------ | ------------------------------ | ---------------------------------------------------- | ----------------------------------------- |
| **3.1 框架项目** | Stage 1 — 需求分析与规范理解            | `requirements/requirements.md`<br>`requirements/research-report.md` | 需求文档，包含目标、SLA、约束、澄清问题及评分<br>技术调研报告（如有技术关键词） |
|              | Stage 2 — 技术选型与数据集选择           | `tech.md`                                            | 技术选型文档，包含候选模型、数据集、资源估算、对比表                |
|              | Stage 3 — 任务拆解与代码生成            | `project/`、`PROJECT_BUILD_LOG.md`                    | 生成并执行任务清单、<br>完整项目（含代码、配置、文档）、<br/>任务执行记录 |
|              | Stage 4 — 代码与配置审核              | `REVIEW_REPORT.md`                    | 输出审核报告，所有条目通过      |
|              | Stage 5 — venv环境与部署            | `venv.md`                                            | 虚拟环境规范文件<br>需要拷贝到目标项目的规范文件副本              |
| **3.2 目标项目** | Stage 1 — 环境构建与 mini 数据集准备     | `env_check_report.md`、`data/mini/`、`mini_dataset.md`            | 环境检查报告，mini 数据集及说明                         |
|              | Stage 2 — 1-epoch 验证与自动 bugfix | `bugfix_report.md`、checkpoint 模型文件                   | Bug 修复报告与快速训练模型                           |
|              | Stage 3 — 全量训练策略输出             | `full_train_guidance.md`、`训练准备 checklist`            | 全量训练指导与准备清单                               |
| **3.3 生产部署** | Stage 1 — Docker环境检测与准备        | `docker_env_report.md`                               | Docker 运行环境检测报告                           |
|              | Stage 2 — 镜像构建与容器校验            | 镜像（tag）、`container_env_check.log`                    | 构建镜像及容器校验日志                               |
|              | Stage 3 — 部署启动与 API 健康检查       | `deploy_report.md` 或 `docker_error_report.md`        | 部署报告或错误报告                                 |
|              | Stage 4 — Docker运行监控 / 需求回顾    | `docker_running_report.md`、更新后的 `README.md`          | 运行监控报告与需求回顾更新                             |

---

## 3.6 每个阶段的“最小可交付验收准则（DoD）”

为保证流程可自动化验证，建议为每个阶段定义最小可交付准则（示例）：

* **框架项目 Stage 完成（3.1）**：`requirements.md`, `tech.md`, `code_skeleton` 均存在且 `scripts/train.py --dry-run` 无致命错误。
* **目标项目 Stage 完成（3.2）**：`env_check_report.json` 存在且 `scripts/train.py --data data/mini --epochs 1` 完成；`bugfix_report.md` 全部关键问题已关闭。
* **生产部署 Stage 完成（3.3）**：容器镜像可运行、`/health` 返回 OK、smoke tests 通过且监控告警规则已部署。


# 4. 结语：可操作性与审计链

本 README 旨在提供既可由人类工程师阅读，又可直接被自主智能体解析为行动指令的双重语义层次——即“可读的规范文档 + 结构化的操作步骤”。要点回顾：

* 将自然语言需求转为结构化 Spec（CREATE.md）是整个流程的起点，也是保证可追溯性的关键。
* 三阶段 Spec（需求→技术→验证）确保设计与实现的每一步均可被验证、审计与回滚。
* 通过角色化的自主智能体协作（planner, coder, tester, ops），可以实现高度自动化的从需求到部署的流水线，同时保留人为审核点以控制风险。
* 推荐实践：在高不确定性阶段先采用短迭代的 vibe 实验，确认关键指标后引入 Spec 驱动流程以实现生产化与可维护性。

---

如需我将上述 README 转化为仓库内的 README.md 文件（包含 mermaid 图、YAML 示例文件、以及可供 agent 直接消费的 Spec AST 模板），我可以直接生成完整 Markdown 文档并以适合的文件结构输出（包含示例 YAML 与任务清单）。
