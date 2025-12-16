---
description: agile理论中的即时交付工作流，识别上下文中的sprint或者用户输入的sprint（如果没有任何sprint信息，提示用户输入），通过jira API获取相关详细信息，并快速完成开发任务“to do”、“in progress”、“done”的完整流程，触发多智能体并行有序协同
---

# 快速Sprint Command
> 基于多智能体并行协作的分钟级软件交付工作流

## 📋 Agile Scrum Sprint 文字规范

### Scrum Sprint 定义
根据Scrum指南，Sprint是Scrum的核心，是一个固定时间盒（通常1-4周），在此期间完成"完成"的产品增量。

### JIRA API集成能力
> `utils`目录中有集成方法`jira-integration-system.md`文件

### Sprint 创建规范
- **必须使用JIRA Sprint API创建**：Sprint必须通过`/rest/agile/1.0/sprint` API创建
- **禁止创建任务类型Sprint**：Sprint不是普通任务，不能作为Issue创建
- **Sprint属性要求**：
  - `name`: Sprint名称（如"Sprint 1 - 即时交付"）
  - `goal`: Sprint目标
  - `startDate`: 开始日期
  - `endDate`: 结束日期
  - `state`: 状态（active/closed）

### 强制规范规则
- 🚫 **禁止任务类型Sprint**：Sprint必须使用正确的JIRA Sprint API创建，禁止创建任务类型的Sprint
- ✅ **强制Sprint类型验证**：创建前验证Sprint类型正确性，确保符合Scrum规范
- 🔍 **强制状态流转**：确保状态流转符合Scrum工作流，基于实际工作成果
- ⚡ **强制智能体协作**：Scrum Master必须协调其他智能体执行实际工作，禁止直接状态更新
- 📋 **强制任务分解**：Story必须分解为可执行的任务单元，确保可独立验证
- 🔄 **强制状态同步**：所有状态变更必须同步到JIRA，确保数据一致性
- ⚠️ **强制范围限制**：仅处理Sprint中已有的Story，不自动添加新Story到Sprint
- 🚫 **禁止文档脚本代码**：不允许编写文档、脚本和代码，仅处理现有代码的修改和配置

## 🎯 核心特性

### 分钟级交付能力
- **5-8分钟端到端交付**: 从需求澄清到交付验证的完整流程
- **智能并行执行**: 多智能体协作，显著提升效率
- **强制同步协议**: 确保100% JIRA状态同步
- **实时监控**: 可视化进度跟踪和智能错误恢复

### 质量保证机制
- **JIRA团队版合规**: 严格的类型检查约束
- **验收标准驱动**: 基于Given-When-Then的质量保证
- **三可原则分解**: 独立执行、自动化验证、回滚隔离
- **智能状态检测**: 自动识别项目状态配置
- **Story状态验证**: Sprint关闭前强制验证所有Story状态

### 智能协作系统
- **多轮协商**: 智能体间深度协商和文档落地
- **冲突解决**: 自动检测和解决智能体间冲突
- **回顾机制**: 自动生成改进建议和趋势分析
- **API兼容性**: 自动适配JIRA API版本变更

## 🚀 工作流程概览

```mermaid
flowchart TD
    A[🚀 快速Sprint启动] --> B[🔍 智能用户输入分析]
    B --> C[📋 解析Story Keys]
    C --> D[🔍 检查活跃Sprint]
    D --> E{有活跃Sprint?}
    E -->|否| F[📝 使用JIRA Sprint API创建新Sprint]
    E -->|是| G[📋 获取Sprint详情]
    F --> H[✅ Sprint创建成功]
    G --> H
    H --> I[🔍 验证Story归属]
    I --> J{Story在Sprint中?}
    J -->|否| K[❌ 仅处理Sprint中Story]
    J -->|是| L[⚡ 并行调度所有Story]
    K --> M[⚠️ 范围限制警告]
    L --> N[📋 为每个Story智能任务分解]
    N --> O[🤖 为每个任务独立启动开发Agent]
    N --> P[🔍 为每个任务独立启动测试Agent]

    O --> Q{开发任务完成?}
    Q -->|否| O
    Q -->|是| R[📢 自动触发开发完成通知]
    R --> S[🔍 触发对应测试任务]

    P --> T{测试任务完成?}
    T -->|否| P
    T -->|是| U[✅ 测试验证完成]

    S --> U

    U --> V{所有Story的task为Done?}
    V -->|否| L
    V -->|是| W[🔍 Story状态验证]
    W --> X{验证通过?}
    X -->|否| Y[❌ 验证失败报告]
    X -->|是| Z[🏁 使用JIRA Sprint API关闭Sprint]
    Z --> AA[📊 生成交付报告]
    M --> AA

    %% 强制规范检查
    F -.->|🚫 禁止创建任务类型Sprint| BB[强制规范检查]
    Z -.->|🚫 禁止直接状态更新| BB
    BB{强制规范检查}
```

### 时间分配优化
- **阶段1**: 环境准备、配置检测和多轮协商 (45秒)
- **阶段2**: 智能决策、并行执行和实时监控 (3-6分钟)
- **阶段3**: 结果汇总、验证和报告生成 (45秒)
- **总耗时**: 5-8分钟完成端到端交付

## 📋 详细工作流程

### 阶段1: 环境准备和配置检测

```mermaid
sequenceDiagram
    participant U as 用户
    participant C as 快速Sprint
    participant J as JIRA
    participant SM as Scrum Master Agent

    U->>C: 快速sprint "完成story LR-4 LR-5"
    C->>J: 验证连接
    J-->>C: 连接成功
    C->>J: 检测状态配置
    J-->>C: 状态映射
    C->>SM: 智能用户输入分析
    SM->>SM: 解析Story Keys
    SM->>C: 返回Story Keys
    C-->>U: 环境准备完成
```

**关键活动:**
- ✅ **配置读取**: 自动读取JIRA配置信息
- ✅ **连接验证**: 验证JIRA API连接状态
- ✅ **状态检测**: 自动识别项目状态配置
- ✅ **智能输入分析**: Scrum Master Agent解析用户输入中的Story Keys
- ✅ **多Story识别**: 支持多个Story的并行处理
- ✅ **多轮协商**: 智能体间深度协商（可选）

**输出成果:**
- 📄 解析的Story Keys列表
- 📋 多Story协调计划
- 🔧 并行执行策略
- 📊 任务分解文档

### 阶段2: Sprint检查和Story管理

```mermaid
flowchart TD
    A[📋 Sprint检查准备] --> B[🔍 检查活跃Sprint]
    B --> C{有活跃Sprint?}
    C -->|否| D[📝 创建新Sprint]
    C -->|是| E[📋 获取Sprint详情]
    D --> F[✅ Sprint创建成功]
    E --> F
    F --> G[🔍 检查Story归属]
    G --> H{Story在Sprint中?}
    H -->|否| I[❌ Story不在Sprint中]
    H -->|是| J[✅ Story已在Sprint]
    I --> K[⚠️ 仅处理Sprint中已有Story]
    J --> L[🎯 阶段2完成]
    K --> L
```

**Sprint检查机制:**
- 🔍 **活跃Sprint检查**: 自动检测项目中的活跃Sprint
- 📝 **新Sprint创建**: 如果没有活跃Sprint，创建新Sprint
- 📋 **Sprint详情获取**: 获取现有Sprint的详细信息
- 🔍 **Story归属检查**: 验证用户指定的Story是否已在Sprint中
- ⚠️ **Story范围限制**: 仅处理Sprint中已有的Story，不自动添加新Story

**智能决策逻辑:**
- 🎯 **继续现有Sprint**: 使用现有活跃Sprint继续执行
- 🚀 **创建新Sprint**: 创建新Sprint并设置合理的时间范围
- ⚠️ **Story范围限制**: 仅处理Sprint中已有的Story，不自动添加新Story
- 🔄 **状态跟踪**: 持续监控Story和Sub-task状态

### 阶段3: 智能体协调和状态跟踪

```mermaid
flowchart TD
    A[🎯 Scrum Master并行调度] --> B[📋 分析所有Story和task]
    B --> C[⚡ 为每个任务独立启动开发Agent]
    B --> D[⚡ 为每个任务独立启动测试Agent]

    C --> E[🤖 Development Team Agent集群]
    D --> F[🔍 Quality Agent集群]

    E --> G{开发任务完成?}
    G -->|否| E
    G -->|是| H[📢 自动触发开发完成通知]
    H --> I[🔍 触发对应测试任务]

    F --> J{测试任务完成?}
    J -->|否| F
    J -->|是| K[✅ 测试验证完成]

    I --> K

    K --> L{所有Story的task为Done?}
    L -->|否| A
    L -->|是| M[🔍 Story状态验证]
    M --> N{验证通过?}
    N -->|否| O[❌ 验证失败报告]
    N -->|是| P[🏁 使用JIRA Sprint API关闭Sprint]
    P --> Q[📄 生成交付报告]
    Q --> R[✅ 阶段3完成]
```

**智能体协调机制:**
- 🎯 **Scrum Master并行调度**: 由Scrum Master Agent负责高层次并行调度，当sprint中有多个story时，并行分析所有story和task，同时为每个任务独立启动开发Agent和测试Agent
- ⚡ **并行开发执行**: 所有开发任务并行执行，Development Team Agent集群处理多个开发任务（每个Agent实例处理一个任务），最大化开发效率
- ⚡ **并行测试执行**: 所有测试任务并行执行，Quality Agent集群处理多个测试任务（每个Agent实例处理一个任务），最大化测试效率
- 📢 **开发完成通知**: Development Team Agent完成开发任务后通过Hook自动发送通知，触发对应的测试任务执行
- 🔄 **智能依赖管理**: 自动管理开发任务和测试任务之间的依赖关系，确保测试任务在开发完成后执行
- 🔄 **状态监控循环**: 并行监控所有任务状态，基于实际工作成果
- ✅ **Story完成条件**: 所有相关任务为Done且验证通过时标记Story为Done
- 🔍 **Story状态验证**: 验证所有Story状态确保可以安全关闭Sprint
- 🏁 **Sprint完成条件**: 所有Story为Done且验证通过时使用JIRA Sprint API关闭Sprint

**状态流转逻辑:**
- 🔄 **并行监控**: 并行监控所有Sub-task状态，直到全部完成
- ✅ **基于实际工作的标记**: Sub-task全部完成且实际工作验证通过时标记Story为Done
- 🔍 **状态验证**: 验证所有Story状态确保Sprint可以安全关闭
- 🏁 **智能关闭**: Story全部完成且验证通过时自动关闭Sprint
- 📊 **报告生成**: 生成完整的交付成果报告

## 🎯 基于Agile理论的智能体强制分工

### 核心原则
根据Scrum敏捷开发最佳实践，智能体必须执行实际工作，禁止直接状态更新：

**强制执行规则:**
- 🚫 **禁止状态欺骗**: Scrum Master Agent不得直接更新JIRA状态而不调用其他智能体
- ✅ **强制实际开发**: Development Team Agent必须执行所有开发工作（代码生成、功能实现）
- ✅ **强制实际测试**: Quality Agent必须执行所有测试验证工作（测试执行、质量保证）
- 🔍 **强制验证机制**: 所有状态更新必须基于实际工作完成验证
- ⚠️ **强制范围限制**: 仅处理Sprint中已有的Story，不自动添加新Story到Sprint

### 智能体职责边界

```mermaid
flowchart TD
    A[🎯 Scrum Master Agent] --> B[📋 需求澄清和任务分解]
    A --> C[🔄 智能体协调和状态监控]
    A --> D[✅ 基于实际工作的状态更新]

    E[🤖 Development Team Agent] --> F[💻 实际代码开发]
    E --> G[🔧 功能实现]
    E --> H[📝 基础测试生成]

    I[🔍 Quality Agent] --> J[🧪 实际测试执行]
    I --> K[✅ 质量验证]
    I --> L[📊 测试报告生成]

    F --> D
    G --> D
    H --> D
    J --> D
    K --> D
    L --> D
```

**验证机制:**
- 🔍 **工作成果验证**: 所有状态更新必须基于实际工作成果，禁止状态欺骗
- 📋 **实际工作检查**: Development Team Agent必须执行实际开发工作，确保功能实现
- 🧪 **质量验证执行**: Quality Agent必须执行实际质量验证，确保交付标准
- ✅ **质量门禁**: 只有通过质量验证的状态才能流转，确保交付质量
- 🔄 **状态同步验证**: 所有状态变更必须同步到JIRA，确保数据一致性

## 🎯 核心功能详解

### 1. 智能用户输入分析和多Story管理

```mermaid
flowchart TD
    A[🚀 快速Sprint启动] --> B[🔍 智能用户输入分析]
    B --> C[📋 解析Story Keys]
    C --> D[🔍 检查活跃Sprint]
    D --> E{有活跃Sprint?}
    E -->|否| F[📝 创建新Sprint]
    E -->|是| G[📋 获取Sprint详情]
    F --> H[✅ Sprint创建成功]
    G --> H
    H --> I[🔍 验证Story归属]
    I --> J{Story在Sprint中?}
    J -->|否| K[❌ 仅处理Sprint中Story]
    J -->|是| L[⚡ 并行调度所有Story]
    K --> M[⚠️ 范围限制警告]
    L --> N[📋 为每个Story智能任务分解]
    N --> O[🤖 为每个任务独立启动开发Agent]
    N --> P[🔍 为每个任务独立启动测试Agent]

    O --> Q{开发任务完成?}
    Q -->|否| O
    Q -->|是| R[📢 自动触发开发完成通知]
    R --> S[🔍 触发对应测试任务]

    P --> T{测试任务完成?}
    T -->|否| P
    T -->|是| U[✅ 测试验证完成]

    S --> U

    U --> V{所有Story的task为Done?}
    V -->|否| L
    V -->|是| W[✅ 多Story协调完成]
    M --> W
```

**多Story管理能力:**
- 🔍 **智能输入分析**: 自动解析用户输入中的Story Keys，支持多种输入格式
- 📋 **多Story识别**: 支持多种Story标识格式，灵活适应不同项目规范
- ⚡ **多Story并行协调**: 并行协调多个Story的执行，同时启动所有Story的处理，确保高效资源利用
- 🎯 **批量任务分解**: 为所有Story批量智能任务分解，快速生成所有任务单元
- 📝 **智能任务分解**: 根据Story复杂度自动分解为可执行的任务单元
- 🤖 **大规模并行执行**: Development Team Agent集群和Quality Agent集群并行工作，同时处理多个开发任务和测试任务（通过多个Agent实例），最大化效率
- ✅ **并行状态跟踪**: 并行监控所有Story和任务状态，确保进度可视化
- ⚠️ **范围限制**: 仅处理Sprint中已有的Story，不自动添加新Story到Sprint

### 2. 智能体协调和状态跟踪

```mermaid
flowchart TD
    A[🎯 Scrum Master并行调度] --> B[📋 分析所有Story和task]
    B --> C[⚡ 为每个任务独立启动开发Agent]
    B --> D[⚡ 为每个任务独立启动测试Agent]

    C --> E[🤖 Development Team Agent集群]
    D --> F[🔍 Quality Agent集群]

    E --> G{开发任务完成?}
    G -->|否| E
    G -->|是| H[📢 自动触发开发完成通知]
    H --> I[🔍 触发对应测试任务]

    F --> J{测试任务完成?}
    J -->|否| F
    J -->|是| K[✅ 测试验证完成]

    I --> K

    K --> L{所有Story的task为Done?}
    L -->|否| A
    L -->|是| M[🔍 Story状态验证]
    M --> N{验证通过?}
    N -->|否| O[❌ 验证失败报告]
    N -->|是| P[🏁 使用JIRA Sprint API关闭Sprint]
    P --> Q[📄 生成交付报告]
    Q --> R[✅ 流程完成]
```

**智能体协调机制:**
- 🎯 **Scrum Master并行调度**: Scrum Master Agent负责高层次并行调度，当sprint中有多个story时，并行分析所有story和task，同时为每个任务独立启动开发Agent和测试Agent
- ⚡ **大规模并行开发**: Development Team Agent集群并行执行所有开发任务（每个Agent实例处理一个任务），最大化开发效率
- ⚡ **大规模并行测试**: Quality Agent集群并行执行所有测试任务（每个Agent实例处理一个任务），最大化测试效率
- 📢 **开发完成通知**: Development Team Agent完成开发任务后通过Hook自动发送通知，触发对应的测试任务执行
- 🔄 **智能依赖管理**: 自动管理开发任务和测试任务之间的依赖关系，确保测试任务在开发完成后执行
- 🔄 **并行状态监控**: 并行监控所有任务状态直到全部完成，基于实际工作成果
- ✅ **基于实际工作的流转**: 所有任务完成且实际工作验证通过时标记Story为Done
- 🔍 **状态验证**: 验证所有Story状态确保Sprint可以安全关闭
- 🏁 **智能关闭**: Story全部完成且验证通过时使用JIRA Sprint API自动关闭Sprint
- ⚠️ **范围限制**: 仅处理Sprint中已有的Story，不自动添加新Story到Sprint


### 3. 验收标准验证

```mermaid
flowchart TD
    A[📋 任务完成] --> B[🔍 提取验收标准]
    B --> C[✅ Given条件验证]
    C --> D[✅ When操作验证]
    D --> E[✅ Then结果验证]
    E --> F{所有验收标准通过?}
    F -->|是| G[🎉 任务验收通过]
    F -->|否| H[❌ 任务验收失败]
    H --> I[📝 记录失败原因]
    I --> J[🔄 重新执行任务]
    J --> A
    G --> K[📦 生成演示包]
    K --> L[✅ 任务正式完成]
```

**验收标准格式:**
```
Given [条件], When [操作], Then [结果]
```

**验证过程:**
- ✅ **Given条件验证**: 验证前置条件是否满足
- ✅ **When操作验证**: 验证操作步骤是否正确
- ✅ **Then结果验证**: 验证预期结果是否达成
- 📦 **演示包生成**: 自动生成功能演示包

### 4. 回顾机制

```mermaid
flowchart TD
    A[🏁 Sprint完成] --> B[📊 收集执行数据]
    B --> C[🔍 分析成功因素]
    C --> D[🔍 分析失败案例]
    D --> E[📋 识别阻塞原因]
    E --> F[💡 生成改进建议]
    F --> G[📄 生成回顾报告]
    G --> H[✅ 回顾完成]
```

**回顾内容:**
- 📊 **执行数据分析**: 收集和分析所有执行数据
- 🔍 **成功因素分析**: 识别成功的关键因素
- 🔍 **失败案例分析**: 分析失败原因和改进机会
- 📋 **阻塞原因识别**: 识别执行过程中的阻塞点
- 💡 **改进建议生成**: 基于分析结果生成具体改进建议

## 🔧 配置和参数


### 环境配置

**JIRA配置:**
- **域名**: `JIRA_DOMAIN="your-domain.atlassian.net"`
- **API凭据**: `EMAIL="your-email@example.com"`, `API_TOKEN="your-api-token"`
- **项目配置**: `PROJECT_KEY="FC"`

**状态映射:**
- 系统自动检测项目状态配置
- 生成状态ID映射文件
- 支持手动配置状态映射

**Python虚拟环境配置:**
> 参考 `utils/setup_venv.md` 文件获取完整的Python虚拟环境配置规范

### 环境检查业务逻辑

在执行Python相关操作前，系统必须执行以下环境检查：

```mermaid
flowchart TD
    A[🔍 项目类型检测] --> B{是否为Python项目?}
    B -->|否| C[⏭️ 跳过venv步骤]
    B -->|是| D[🔍 检查venv状态]
    D --> E{venv已激活?}
    E -->|否| F[⚠️ 提示激活venv]
    E -->|是| G[✅ venv状态正常]
    F --> H[🔄 尝试自动激活]
    H --> I{激活成功?}
    I -->|否| J[❌ 手动激活要求]
    I -->|是| G
    G --> K[🔍 检查依赖包]
    K --> L{依赖包完整?}
    L -->|否| M[📦 安装缺失依赖]
    L -->|是| N[✅ 环境准备完成]
    M --> N
    C --> N
```

**Python项目识别条件:**
- ✅ 存在requirements.txt或requirements_ml.txt文件
- ✅ 存在setup.py或pyproject.toml文件
- ✅ 存在Python源代码文件(.py)
- ✅ 存在venv目录

**强制规范：**
- 🚫 **禁止系统环境操作**：所有Python包安装必须在venv中进行
- ✅ **强制venv检查**：安装Python包前必须检查venv状态
- 🔍 **强制依赖验证**：执行Python代码前必须验证依赖包完整性
- ⏭️ **智能项目检测**：非Python项目自动跳过venv步骤
- ⚠️ **强制环境隔离**：确保开发环境的隔离性和可重复性

## 📊 监控和性能

### 实时监控指标

```mermaid
graph LR
    A[🔄 同步成功率] --> B[98.5%]
    C[⚡ 并行执行效率] --> D[87.3%]
    E[🛠️ 错误恢复率] --> F[95.2%]
    G[📈 性能统计] --> H[实时更新]
```

**监控维度:**
- 🔄 **同步状态**: JIRA状态同步成功率
- ⚡ **执行效率**: 并行执行效率统计
- 🛠️ **错误恢复**: 自动错误恢复成功率
- 📈 **性能统计**: 实时性能指标监控

### 智能体状态跟踪

**Development Team Agent:**
- 📋 任务分配状态
- ⏱️ 执行时间统计
- ✅ 完成质量评估

**Quality Agent:**
- 🔍 验证任务状态
- 📊 测试覆盖率
- ✅ 质量评估结果

## 🛠️ 故障排除

### 常见问题解决

**JIRA连接问题:**
- ✅ 检查域名配置
- ✅ 验证API凭据
- ✅ 确认网络连接

**类型检查失败:**
- ✅ 使用合规的Issue类型 (Story/Task)
- ✅ 重新创建合规的Issue
- ✅ 使用`--no-type-check`跳过检查

**验收标准验证失败:**
- ✅ 使用正确的Given-When-Then格式
- ✅ 确保验收标准具体可验证
- ✅ 使用`--no-ac-validation`跳过验证

**智能体执行超时:**
- ✅ 系统自动重置和重试
- ✅ 检查任务复杂度
- ✅ 调整并行执行参数


## 🏗️ 系统架构

```mermaid
graph TB
    subgraph "用户界面层"
        UI[🚀 快速Sprint 命令<br/>用户输入和输出]
    end

    subgraph "协调层"
        SM[🎯 Scrum Master Agent<br/>整体流程协调]
        NEG[🤝 多轮协商协调器<br/>智能体间协商]
        MON[📊 监控恢复系统<br/>实时监控和错误恢复]
    end

    subgraph "执行层"
        DT[🤖 Development Team Agent<br/>代码生成和开发]
        QA[🔍 Quality Agent<br/>质量验证和测试]
        PAR[⚡ 并行执行管理器<br/>智能体负载均衡]
    end

    subgraph "集成层"
        JIRA[🔗 JIRA 集成系统<br/>状态同步和项目管理]
    end

    subgraph "数据层"
        DOC[📄 协商文档系统<br/>需求澄清、技术方案、任务分解]
        LOG[📊 监控日志系统<br/>状态跟踪和性能统计]
    end

    UI --> SM
    SM --> NEG
    SM --> MON
    SM --> PAR

    NEG --> DT
    NEG --> QA
    PAR --> DT
    PAR --> QA
    MON --> DT
    MON --> QA

    DT --> JIRA
    QA --> JIRA
    SM --> JIRA

    NEG --> DOC
    MON --> LOG
    DT --> LOG
    QA --> LOG

    style UI fill:#e1f5fe
    style SM fill:#bbdefb
    style NEG fill:#bbdefb
    style MON fill:#bbdefb
    style DT fill:#c8e6c9
    style QA fill:#c8e6c9
    style PAR fill:#c8e6c9
    style JIRA fill:#fff3e0
    style DOC fill:#f3e5f5
    style LOG fill:#f3e5f5
```

### 架构说明
- **用户界面层**: 快速Sprint 命令提供统一的用户交互接口
- **协调层**: Scrum Master Agent 负责整体流程协调，包括多轮协商和监控恢复
- **执行层**: Development Team Agent 和 Quality Agent 并行执行开发和质量验证
- **集成层**: JIRA 集成系统确保所有状态和进度同步到项目管理工具
- **数据层**: 协商文档和监控日志系统提供完整的可追溯性

### 核心优势
- **分钟级交付**: 5-8分钟完成端到端软件交付
- **智能体协作**: 多智能体并行执行，显著提升效率
- **强制同步**: 100% JIRA 状态同步，确保数据一致性
- **实时监控**: 可视化进度跟踪和智能错误恢复
- **协商机制**: 多轮协商确保需求理解和技术方案一致性

---

**版本**: 1.0.0
**最后更新**: 2025-11-08
**文档类型**: 用户指南和技术规范