# 上下文工程模板

一个用于开始使用上下文工程的综合性模板 - 上下文工程是一门为AI编程助手设计上下文的学科，使它们拥有完成端到端任务所需的完整信息。

> **上下文工程比提示词工程好10倍，比直觉编程好100倍。**

## 🚀 快速开始

### Docker部署（推荐）
```bash
# 1. 克隆此模板
git clone https://github.com/coleam00/Context-Engineering-Intro.git
cd Context-Engineering-Intro

# 2. 快速启动Docker环境
./docker-setup.sh

# 3. 访问机器学习框架
# 打开浏览器访问: http://localhost:8888

# 4. 运行示例
./docker-run-examples.sh

# 5. 启动Jupyter Lab
./docker-start-jupyter.sh
```

### Docker手动部署
```bash
# CPU版本
docker-compose -f deploy/cpu/docker-compose.yml up -d

# GPU版本（需要NVIDIA Docker运行时）
docker-compose -f deploy/gpu/docker-compose.yml up -d

# 管理容器
./deploy/shared/docker-utils.sh status
./deploy/shared/docker-utils.sh logs cpu
./deploy/shared/docker-utils.sh shell cpu
```

## 📚 目录

- [什么是上下文工程？](#什么是上下文工程)
- [模板结构](#模板结构)
- [Docker部署指南](#docker部署指南)
- [系统要求](#系统要求)
- [逐步指南](#逐步指南)
- [编写高效的INITIAL.md文件](#编写高效的initialmd文件)
- [PRP工作流程](#prp工作流程)
- [有效使用示例](#有效使用示例)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 什么是上下文工程？

上下文工程代表了从传统提示词工程的范式转变：

### 提示词工程 vs 上下文工程

**提示词工程：**
- 专注于巧妙的措辞和特定短语
- 仅限于如何表述任务
- 就像给某人一张便签

**上下文工程：**
- 提供全面上下文的完整系统
- 包括文档、示例、规则、模式和验证
- 就像编写包含所有细节的完整剧本

### 为什么上下文工程很重要

1. **减少AI失败**：大多数代理失败不是模型失败 - 而是上下文失败
2. **确保一致性**：AI遵循你的项目模式和约定
3. **支持复杂功能**：有了适当的上下文，AI可以处理多步骤实现
4. **自我修正**：验证循环允许AI修复自己的错误

## 模板结构

```
context-engineering-intro/
├── .claude/
│   ├── commands/
│   │   ├── generate-prp.md    # 生成综合性PRPs
│   │   └── execute-prp.md     # 执行PRPs实现功能
│   └── settings.local.json    # Claude Code权限配置
├── deploy/                    # Docker部署配置
│   ├── cpu/                   # CPU版本配置
│   ├── gpu/                   # GPU版本配置
│   └── shared/                # 共享工具脚本
├── PRPs/                      # 产品需求提示词
├── examples/                  # 代码示例
├── CLAUDE.md                 # AI助手的全局规则
├── INITIAL.md               # 功能需求模板
├── INITIAL_EXAMPLE.md       # 功能需求示例
├── docker-compose.yml       # Docker编排配置
├── docker-setup.sh          # Docker快速设置
├── docker-run-examples.sh   # Docker示例运行
├── docker-start-jupyter.sh  # Docker Jupyter启动
└── README.md                # 本文档
```

## 逐步指南

### 1. 设置全局规则（CLAUDE.md）

`CLAUDE.md`文件包含AI助手在每次对话中都会遵循的项目范围规则。模板包括：

- **项目认知**：读取规划文档、检查任务
- **代码结构**：文件大小限制、模块组织
- **测试要求**：单元测试模式、覆盖率期望
- **风格约定**：语言偏好、格式化规则
- **文档标准**：文档字符串格式、注释实践

**你可以按原样使用提供的模板，或为你的项目自定义它。**

### 2. 创建初始功能需求

编辑`INITIAL.md`描述你想要构建的内容：

```markdown
## 功能：
[描述你想要构建的内容 - 具体说明功能和需求]

## 示例：
[列出examples/文件夹中的任何示例文件，并解释如何使用它们]

## 文档：
[包括相关文档、API或MCP服务器资源的链接]

## 其他考虑：
[提及任何陷阱、特定需求或AI助手常遗漏的内容]
```

**参见`INITIAL_EXAMPLE.md`获取完整示例。**

### 3. 生成PRP

PRPs（产品需求提示词）是包含以下内容的综合性实现蓝图：

- 完整的上下文和文档
- 带有验证的实现步骤
- 错误处理模式
- 测试要求

它们类似于PRDs（产品需求文档），但制作得更具体，以指导AI编程助手。

在Claude Code中运行：
```bash
/generate-prp INITIAL.md
```

**注意：** 斜杠命令是在`.claude/commands/`中定义的自定义命令。你可以查看它们的实现：
- `.claude/commands/generate-prp.md` - 看看它如何研究和创建PRPs
- `.claude/commands/execute-prp.md` - 看看它如何从PRPs实现功能

`$ARGUMENTS`变量在这些命令中接收你命令名后传递的任何内容（例如`INITIAL.md`或`PRPs/你的功能.md`）。

这个命令将：
1. 读取你的功能请求
2. 分析代码库中的模式
3. 搜索相关文档
4. 在`PRPs/你的功能名称.md`中创建综合性PRP

### 4. 执行PRP

生成后，执行PRP实现你的功能：

```bash
/execute-prp PRPs/你的功能名称.md
```

AI编程助手将：
1. 从PRP读取所有上下文
2. 创建详细的实现计划
3. 用验证执行每个步骤
4. 运行测试并修复任何问题
5. 确保满足所有成功标准

## 编写高效的INITIAL.md文件

### 关键部分解释

**功能**：具体且全面
- ❌ "构建一个网页爬虫"
- ✅ "使用BeautifulSoup构建一个异步网页爬虫，从电商网站提取产品数据，处理速率限制，并将结果存储在PostgreSQL中"

**示例**：利用examples/文件夹
- 将相关代码模式放在`examples/`
- 引用要遵循的特定文件和模式
- 解释应该模仿哪些方面

**文档**：包括所有相关资源
- API文档URL
- 库指南
- MCP服务器文档
- 数据库模式

**其他考虑**：捕获重要细节
- 认证要求
- 速率限制或配额
- 常见陷阱
- 性能要求

## PRP工作流程

### /generate-prp如何工作

该命令遵循此过程：

1. **研究阶段**
   - 分析你的代码库以寻找模式
   - 搜索类似实现
   - 识别要遵循的约定

2. **文档收集**
   - 获取相关API文档
   - 包括库文档
   - 添加陷阱和怪癖

3. **蓝图创建**
   - 创建分步实现计划
   - 包括验证检查点
   - 添加测试要求

4. **质量检查**
   - 评分信心水平（1-10）
   - 确保包括所有上下文

### /execute-prp如何工作

1. **加载上下文**：读取整个PRP
2. **计划**：使用TodoWrite创建详细任务列表
3. **执行**：实现每个组件
4. **验证**：运行测试和代码检查
5. **迭代**：修复发现的任何问题
6. **完成**：确保满足所有要求

参见`PRPs/EXAMPLE_multi_agent_prp.md`获取生成的完整示例。

## 有效使用示例

`examples/`文件夹对成功**至关重要**。当有模式可以遵循时，AI编程助手表现得更好。

### 在示例中包括什么

1. **代码结构模式**
   - 你如何组织模块
   - 导入约定
   - 类/函数模式

2. **测试模式**
   - 测试文件结构
   - 模拟方法
   - 断言风格

3. **集成模式**
   - API客户端实现
   - 数据库连接
   - 认证流程

4. **CLI模式**
   - 参数解析
   - 输出格式化
   - 错误处理

### 示例结构

```
examples/
├── README.md           # 解释每个示例演示的内容
├── cli.py             # CLI实现模式
├── agent/             # 代理架构模式
│   ├── agent.py      # 代理创建模式
│   ├── tools.py      # 工具实现模式
│   └── providers.py  # 多提供商模式
└── tests/            # 测试模式
    ├── test_agent.py # 单元测试模式
    └── conftest.py   # Pytest配置
```

## 最佳实践

### 1. 在INITIAL.md中明确
- 不要假设AI知道你的偏好
- 包括具体要求和约束
- 大量引用示例

### 2. 提供全面示例
- 更多示例 = 更好的实现
- 展示要做什么和不要做什么
- 包括错误处理模式

### 3. 使用验证检查点
- PRPs包括必须通过的测试命令
- AI将迭代直到所有验证成功
- 这确保第一次就得到工作代码

### 4. 利用文档
- 包括官方API文档
- 添加MCP服务器资源
- 引用特定文档部分

### 5. 自定义CLAUDE.md
- 添加你的约定
- 包括项目特定规则
- 定义编码标准

## Docker部署指南

### 快速部署
使用提供的自动化脚本：
```bash
./docker-setup.sh          # 交互式设置
./docker-run-examples.sh   # 运行示例代码
./docker-start-jupyter.sh  # 启动Jupyter Lab
```

### 手动部署
```bash
# CPU版本
docker-compose -f deploy/cpu/docker-compose.yml up -d

# GPU版本（需要NVIDIA Docker运行时）
docker-compose -f deploy/gpu/docker-compose.yml up -d

# 开发环境
docker-compose --profile dev up -d
```

### 容器管理
```bash
# 查看所有容器管理命令
./deploy/shared/docker-utils.sh help

# 常用命令
./deploy/shared/docker-utils.sh status    # 查看状态
./deploy/shared/docker-utils.sh logs cpu  # 查看日志
./deploy/shared/docker-utils.sh shell cpu # 进入容器
./deploy/shared/docker-utils.sh stop      # 停止所有容器
```

## 系统要求

### CPU版本
- Docker Engine 20.10+
- 内存: 最少2GB，推荐4GB+
- 存储: 最少5GB可用空间

### GPU版本
- Docker Engine 20.10+
- NVIDIA Docker运行时
- NVIDIA GPU驱动 535+
- CUDA 12.6兼容性
- 内存: 最少8GB，推荐16GB+
- 存储: 最少10GB可用空间

## 故障排除

### 常见问题
1. **Docker未安装**: 请先安装Docker和Docker Compose
2. **端口冲突**: 修改docker-compose.yml中的端口映射
3. **权限问题**: 使用`sudo`或配置Docker用户组
4. **GPU不可用**: 检查NVIDIA驱动和Docker运行时

### 获取帮助
```bash
./deploy/shared/docker-utils.sh help
```

## 资源

- [Claude Code文档](https://docs.anthropic.com/en/docs/claude-code)
- [Docker官方文档](https://docs.docker.com/)
- [NVIDIA Docker运行时文档](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/)
- [上下文工程最佳实践](https://www.philschmid.de/context-engineering)