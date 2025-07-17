# MCP服务器构建器 - 上下文工程用例

此用例演示如何使用**上下文工程**和**PRP（产品需求提示词）流程**构建生产就绪的模型上下文协议（MCP）服务器。它提供了一个经过验证的模板和工作流程，用于创建具有GitHub OAuth认证、数据库集成和Cloudflare Workers部署的MCP服务器。

> PRD + 策划的代码库智能 + 代理/运行手册 = PRP，这是AI在第一次尝试时就能合理交付生产就绪代码所需的最小可行数据包。

## 🎯 你将学到什么

此用例将教你：

- **使用PRP流程**系统地构建复杂的MCP服务器
- **利用专门的上下文工程**进行MCP开发
- **遵循经过验证的模式**从生产就绪的MCP服务器模板
- **实施安全认证**与GitHub OAuth和基于角色的访问
- **部署到Cloudflare Workers**并带有监控和错误处理

## 📋 工作原理 - MCP服务器的PRP流程

### 1. 定义你的MCP服务器（initial.md）

首先在`PRPs/INITIAL.md`中描述你想要构建的确切MCP服务器：

```markdown
## 功能：
我们想要创建一个天气MCP服务器，提供实时天气数据
并带有缓存和速率限制。

## 附加功能：
- 与OpenWeatherMap API集成
- Redis缓存以提高性能
- 按用户进行速率限制
- 历史天气数据访问
- 位置搜索和自动完成

## 其他考虑：
- 外部服务的API密钥管理
- API失败的适当错误处理
- 位置查询的坐标验证
```

### 2. 生成你的PRP

使用专门的MCP PRP命令创建综合性实现计划：

```bash
/prp-mcp-create INITIAL.md
```

**这个命令的作用：**
- 读取你的功能请求
- 研究现有MCP代码库模式
- 研究认证和数据库集成模式
- 在`PRPs/你的服务器名称.md`中创建综合性PRP
- 包括所有上下文、验证循环和分步任务

> PRP生成后验证所有内容非常重要！使用PRP框架时，你需要成为确保所有上下文质量的过程的一部分！执行效果只和你的PRP一样好。使用/prp-mcp-create作为一个坚实的起点。

### 3. 执行你的PRP

使用专门的MCP执行命令构建你的服务器：

```bash
/prp-mcp-execute PRPs/你的服务器名称.md
```

**这个命令的作用：**
- 加载包含所有上下文的完整PRP
- 使用TodoWrite创建详细的实现计划
- 遵循经过验证的模式实现每个组件
- 运行综合验证（TypeScript、测试、部署）
- 确保你的MCP服务器端到端工作

## 🏗️ MCP特定的上下文工程

此用例包括专门为MCP服务器开发设计的特殊上下文工程组件：

### 专门的斜杠命令

位于`.claude/commands/`中：

- **`/prp-mcp-create`** - 专门为MCP服务器生成PRPs
- **`/prp-mcp-execute`** - 使用综合验证执行MCP PRPs

这些是根目录`.claude/commands/`中通用命令的专门版本，但针对MCP开发模式进行了定制。

### 专门的PRP模板

模板`PRPs/templates/prp_mcp_base.md`包括：

- **MCP特定模式**用于工具注册和认证
- **Cloudflare Workers配置**用于部署
- **GitHub OAuth集成**模式
- **数据库安全**和SQL注入防护
- **综合验证循环**从TypeScript到生产

### AI文档

`PRPs/ai_docs/`文件夹包含：

- **`mcp_patterns.md`** - 核心MCP开发模式和安全实践
- **`claude_api_usage.md`** - 如何与Anthropic的API集成以实现LLM驱动的功能

## 🔧 模板架构

此模板提供了一个完整的、生产就绪的MCP服务器，具有：

### 核心组件

```
src/
├── index.ts                 # 主要认证的MCP服务器
├── index_sentry.ts         # 带有Sentry监控的版本
├── simple-math.ts          # 基本MCP示例（无认证）
├── github-handler.ts       # 完整的GitHub OAuth实现
├── database.ts             # 具有安全模式的PostgreSQL
├── utils.ts                # OAuth助手和实用程序
├── workers-oauth-utils.ts  # 基于HMAC的cookie系统
└── tools/                  # 模块化工具注册系统
    └── register-tools.ts   # 中央工具注册表
```

### 示例工具

`examples/`文件夹展示了如何创建MCP工具：

- **`database-tools.ts`** - 具有适当模式的数据库工具示例
- **`database-tools-sentry.ts`** - 具有Sentry监控的相同工具

### 关键功能

- **🔐 GitHub OAuth** - 具有基于角色的访问的完整认证流程
- **🗄️ 数据库集成** - 具有连接池和安全的PostgreSQL
- **🛠️ 模块化工具** - 关注点分离与中央注册
- **☁️ Cloudflare Workers** - 具有Durable Objects的全球边缘部署
- **📊 监控** - 生产的可选Sentry集成
- **🧪 测试** - 从TypeScript到部署的全面验证

## 🚀 快速开始

### 先决条件

- 已安装Node.js和npm
- Cloudflare账户（免费套餐可用）
- 用于OAuth的GitHub账户
- PostgreSQL数据库（本地或托管）

### 步骤1：克隆和设置

```bash
# 克隆上下文工程模板
git clone https://github.com/coleam00/Context-Engineering-Intro.git
cd Context-Engineering-Intro/use-cases/mcp-server

# 安装依赖
npm install

# 全局安装Wrangler CLI
npm install -g wrangler

# 认证Cloudflare
wrangler login
```

### 步骤2：配置环境

```bash
# 创建环境文件
cp .dev.vars.example .dev.vars

# 编辑.dev.vars填写你的凭据
# - GitHub OAuth应用凭据
# - 数据库连接字符串
# - Cookie加密密钥
```

### 步骤3：定义你的MCP服务器

编辑`PRPs/INITIAL.md`描述你的特定MCP服务器需求：

```markdown
## 功能：
确切描述你的MCP服务器应该做什么 - 具体说明
功能、数据源和用户交互。

## 附加功能：
- 列出超出基本CRUD操作的特定功能
- 包括与外部API的集成
- 提及任何特殊要求

## 其他考虑：
- 认证要求
- 性能考虑
- 安全要求
- 速率限制需求
```

### 步骤4：生成并执行PRP

```bash
# 生成综合性PRP
/prp-mcp-create INITIAL.md

# 执行PRP构建你的服务器
/prp-mcp-execute PRPs/你的服务器名称.md
```

### 步骤5：测试和部署

```bash
# 本地测试
wrangler dev

# 使用MCP Inspector测试
npx @modelcontextprotocol/inspector@latest
# 连接到：http://localhost:8792/mcp

# 部署到生产环境
wrangler deploy
```

## 🔍 需要理解的关键文件

要充分理解此用例，请检查这些文件：

### 上下文工程组件

- **`PRPs/templates/prp_mcp_base.md`** - 专门的MCP PRP模板
- **`.claude/commands/prp-mcp-create.md`** - MCP特定的PRP生成
- **`.claude/commands/prp-mcp-execute.md`** - MCP特定的执行

### 实现模式

- **`src/index.ts`** - 具有认证的完整MCP服务器
- **`examples/database-tools.ts`** - 工具创建和注册模式示例
- **`src/tools/register-tools.ts`** - 模块化工具注册系统

### 配置与部署

- **`wrangler.jsonc`** - Cloudflare Workers配置
- **`.dev.vars.example`** - 环境变量模板
- **`CLAUDE.md`** - 实现指南和模式

## 📈 成功指标

当你成功使用此流程时，你将实现：

- **快速实现** - 通过最小迭代快速拥有MCP服务器
- **生产就绪** - 安全认证、监控和错误处理
- **可扩展架构** - 关注点分离和模块化设计
- **综合测试** - 从TypeScript到生产部署的验证

## 🤝 贡献

此用例展示了上下文工程在复杂软件开发中的强大功能。要改进它：

1. **添加新的MCP服务器示例**以展示不同模式
2. **增强PRP模板**与更全面的上下文
3. **改进验证循环**以实现更好的错误检测
4. **记录边缘情况**和常见陷阱

目标是通过全面的上下文工程使MCP服务器开发可预测且成功。

---

**准备好构建你的MCP服务器了吗？** 从编辑`PRPs/INITIAL.md`开始，运行`/prp-mcp-create INITIAL.md`来生成你的综合性实现计划。