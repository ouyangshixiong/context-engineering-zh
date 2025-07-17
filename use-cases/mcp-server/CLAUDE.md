# 具有GitHub OAuth的MCP服务器 - 实现指南

本指南为使用Node.js、TypeScript和Cloudflare Workers构建具有GitHub OAuth认证的MCP（模型上下文协议）服务器提供实现模式和标准。要了解构建什么，请参阅PRP（产品需求提示词）文档。

## 核心原则

**重要：在所有代码更改和PRP生成中，你必须遵循这些原则：**

### KISS（保持简单，愚蠢）

- 简单性应该是设计中的关键目标
- 只要可能就选择简单的解决方案而不是复杂的
- 简单的解决方案更容易理解、维护和调试

### YAGNI（你不会需要它）

- 避免基于推测构建功能
- 仅在需要时实现功能，而不是在你预期未来可能有用时

### 开闭原则

- 软件实体应该对扩展开放但对修改关闭
- 设计系统以便可以通过最小更改现有代码来添加新功能

## 包管理与工具

**关键：此项目使用npm进行Node.js包管理，使用Wrangler CLI进行Cloudflare Workers开发。**

### 基本npm命令

```bash
# 从package.json安装依赖
npm install

# 添加依赖
npm install package-name

# 添加开发依赖
npm install --save-dev package-name

# 移除包
npm uninstall package-name

# 更新依赖
npm update

# 运行package.json中定义的脚本
npm run dev
npm run deploy
npm run type-check
```

### 基本Wrangler CLI命令

**关键：使用Wrangler CLI进行所有Cloudflare Workers开发、测试和部署。**

```bash
# 认证
wrangler login          # 登录Cloudflare账户
wrangler logout         # 从Cloudflare登出
wrangler whoami         # 检查当前用户

# 开发与测试
wrangler dev           # 启动本地开发服务器（默认端口8787）

# 部署
wrangler deploy        # 部署Worker到Cloudflare
wrangler deploy --dry-run  # 测试部署而不实际部署

# 配置与类型
wrangler types         # 从Worker配置生成TypeScript类型
```

## 项目架构

**重要：这是一个具有GitHub OAuth认证的安全数据库访问的Cloudflare Workers MCP服务器。**

### 当前项目结构

```
/
├── src/                          # TypeScript源代码
│   ├── index.ts                  # 主要MCP服务器（标准）
│   ├── index_sentry.ts          # 启用Sentry的MCP服务器
│   ├── simple-math.ts           # 基本MCP示例（无认证）
│   ├── github-handler.ts        # 完整的GitHub OAuth实现
│   ├── database.ts              # 具有安全模式的PostgreSQL连接和实用程序
│   ├── utils.ts                 # OAuth助手函数
│   ├── workers-oauth-utils.ts   # 基于cookie的批准系统
│   └── tools/                   # 模块化工具注册系统
│       └── register-tools.ts    # 中央工具注册表
├── PRPs/                        # 产品需求提示词
│   ├── README.md
│   └── templates/
│       └── prp_mcp_base.md
├── examples/                    # 示例工具创建+注册 - 永远不要编辑或从此文件夹导入
│   ├── database-tools.ts        # Postgres MCP服务器的示例工具，展示工具创建和注册的最佳实践
│   └── database-tools-sentry.ts # 具有Sentry集成的Postgres MCP服务器的示例工具，用于生产监控
├── wrangler.jsonc              # 主要Cloudflare Workers配置
├── wrangler-simple.jsonc       # 简单示例配置
├── package.json                # npm依赖项和脚本
├── tsconfig.json               # TypeScript配置
├── worker-configuration.d.ts   # 生成的Cloudflare类型
└── CLAUDE.md                   # 本实现指南
```

### 关键文件目的（始终在此处添加新文件）

**主要实现文件：**

- `src/index.ts` - 具有GitHub OAuth + PostgreSQL的生产MCP服务器
- `src/index_sentry.ts` - 与上面相同，但具有Sentry监控集成

**认证与安全：**

- `src/github-handler.ts` - 完整的GitHub OAuth 2.0流程
- `src/workers-oauth-utils.ts` - HMAC签名的cookie批准系统
- `src/utils.ts` - OAuth令牌交换和URL构造助手

**数据库集成：**

- `src/database.ts` - 具有连接池和安全模式的PostgreSQL

**工具注册：**

- `src/tools/register-tools.ts` - 导入和注册所有工具的集中系统

**配置文件：**

- `wrangler.jsonc` - 具有Durable Objects、KV、AI绑定的主要Worker配置
- `wrangler-simple.jsonc` - 简单示例配置
- `tsconfig.json` - Cloudflare Workers的TypeScript编译器设置

## 开发命令

### 核心工作流程命令

```bash
# 设置与依赖
npm install                  # 安装所有依赖
npm install --save-dev @types/package  # 添加带有类型的开发依赖

# 开发
wrangler dev                # 启动本地开发服务器
npm run dev                 # 通过npm脚本的替代方案

# 类型检查与验证
npm run type-check          # 运行TypeScript编译器检查
wrangler types              # 生成Cloudflare Worker类型
npx tsc --noEmit           # 不编译进行类型检查

# 测试
npx vitest                  # 运行单元测试（如已配置）

# 代码质量
npx prettier --write .      # 格式化代码
npx eslint src/            # Lint TypeScript代码
```

### 环境配置

**环境变量设置：**

```bash
# 为本地开发创建.dev.vars文件，基于.dev.vars.example
cp .dev.vars.example .dev.vars

# 生产密钥（通过Wrangler）
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put COOKIE_ENCRYPTION_KEY
wrangler secret put DATABASE_URL
wrangler secret put SENTRY_DSN
```

## MCP开发上下文

**重要：此项目使用Node.js/TypeScript在具有GitHub OAuth认证的Cloudflare Workers上构建生产就绪的MCP服务器。**

### MCP技术栈

**核心技术：**

- **@modelcontextprotocol/sdk** - 官方MCP TypeScript SDK
- **agents/mcp** - Cloudflare Workers MCP代理框架
- **workers-mcp** - Workers的MCP传输层
- **@cloudflare/workers-oauth-provider** - OAuth 2.1服务器实现

**Cloudflare平台：**

- **Cloudflare Workers** - 无服务器运行时（V8隔离）
- **Durable Objects** - 用于MCP代理持久性的有状态对象
- **KV存储** - OAuth状态和会话管理

### MCP服务器架构

此项目将MCP服务器实现为具有三种主要模式的Cloudflare Workers：

**1. 认证数据库MCP服务器（`src/index.ts`）：**

```typescript
export class MyMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: "PostgreSQL数据库MCP服务器",
    version: "1.0.0",
  });

  // 基于用户权限可用的MCP工具
  // - listTables（所有用户）
  // - queryDatabase（所有用户，只读）
  // - executeDatabase（仅特权用户）
}
```

**2. 监控MCP服务器（`src/index_sentry.ts`）：**

- 与上面相同，但具有Sentry检测
- MCP工具调用的分布式跟踪
- 具有事件ID的错误跟踪
- 性能监控

### Claude Desktop集成

**用于本地开发：**

```json
{
  "mcpServers": {
    "database-mcp": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8792/mcp"],
      "env": {}
    }
  }
}
```

**用于生产部署：**

```json
{
  "mcpServers": {
    "database-mcp": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-worker.workers.dev/mcp"],
      "env": {}
    }
  }
}
```

### 此项目的MCP关键概念

- **工具**：数据库操作（listTables、queryDatabase、executeDatabase）
- **认证**：具有基于角色的访问控制的GitHub OAuth
- **传输**：HTTP（`/mcp`）和SSE（`/sse`）协议的双重支持
- **状态**：Durable Objects维护认证用户上下文
- **安全**：SQL注入防护、权限验证、错误清理

## 数据库集成与安全

**关键：此项目通过具有基于角色的权限的MCP工具提供安全的PostgreSQL数据库访问。**

### 数据库架构

**连接管理（`src/database.ts`）：**

```typescript
// 具有Cloudflare Workers限制的单例连接池
export function getDb(databaseUrl: string): postgres.Sql {
  if (!dbInstance) {
    dbInstance = postgres(databaseUrl, {
      max: 5, // Workers最多5个连接
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: true, // 启用预处理语句
    });
  }
  return dbInstance;
}

// 具有错误处理的连接包装器
export async function withDatabase<T>(databaseUrl: string, operation: (db: postgres.Sql) => Promise<T>): Promise<T> {
  const db = getDb(databaseUrl);
  // 使用计时和错误处理执行操作
}
```

### 安全实施

**SQL注入防护：**

```typescript
export function validateSqlQuery(sql: string): { isValid: boolean; error?: string } {
  const dangerousPatterns = [
    /;\s*drop\s+/i,
    /;\s*delete\s+.*\s+where\s+1\s*=\s*1/i,
    /;\s*truncate\s+/i,
    // ... 更多模式
  ];
  // 基于模式的安全验证
}

export function isWriteOperation(sql: string): boolean {
  const writeKeywords = ["insert", "update", "delete", "create", "drop", "alter"];
  return writeKeywords.some((keyword) => sql.trim().toLowerCase().startsWith(keyword));
}
```

**访问控制（`src/index.ts`）：**

```typescript
const ALLOWED_USERNAMES = new Set<string>([
  'coleam00'  // 只有这些GitHub用户名可以执行写操作
]);

// 基于用户权限的工具可用性
if (ALLOWED_USERNAMES.has(this.props.login)) {
  // 为特权用户注册executeDatabase工具
  this.server.tool("executeDatabase", ...);
}
```

### MCP工具实施

**工具注册系统：**

工具现在以模块化方式组织，具有集中注册：

1. **工具注册（`src/tools/register-tools.ts`）：**
   - 导入所有工具模块的中央注册表
   - 调用各个注册函数
   - 向每个模块传递服务器实例、环境和用户属性
   - 注册期间的权限检查

2. **工具实施模式：**
   - 每个功能/域获取自己的工具文件（例如，`database-tools.ts`）
   - 工具导出为注册函数
   - 注册函数接收服务器实例、环境和用户属性
   - 注册期间的权限检查

**示例工具注册：**

```typescript
// src/tools/register-tools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props } from "../types";
import { registerDatabaseTools } from "../../examples/database-tools";

export function registerAllTools(server: McpServer, env: Env, props: Props) {
  // 注册数据库工具
  registerDatabaseTools(server, env, props);
  
  // 未来工具可以在这里注册
  // registerAnalyticsTools(server, env, props);
  // registerReportingTools(server, env, props);
}
```

**示例工具模块（`examples/database-tools.ts`）：**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props } from "../types";

const ALLOWED_USERNAMES = new Set<string>(['coleam00']);

export function registerDatabaseTools(server: McpServer, env: Env, props: Props) {
  // 工具1：对所有认证用户可用
  server.tool(
    "listTables",
    "获取数据库中所有表的列表",
    ListTablesSchema,
    async () => {
      // 实现
    }
  );

  // 工具2：对所有认证用户可用
  server.tool(
    "queryDatabase",
    "执行只读SQL查询",
    QueryDatabaseSchema,
    async ({ sql }) => {
      // 具有验证的实现
    }
  );

  // 工具3：仅对特权用户
  if (ALLOWED_USERNAMES.has(props.login)) {
    server.tool(
      "executeDatabase",
      "执行任何SQL语句（特权）",
      ExecuteDatabaseSchema,
      async ({ sql }) => {
        // 实现
      }
    );
  }
}
```

**示例中的可用数据库工具：**

1. **`listTables`** - 模式发现（所有认证用户）
2. **`queryDatabase`** - 只读SQL查询（所有认证用户）
3. **`executeDatabase`** - 写操作（仅特权用户）

## GitHub OAuth实现

**关键：此项目使用签名的基于cookie的批准系统实现安全的GitHub OAuth 2.0流程。**

### OAuth流程架构

**认证流程（`src/github-handler.ts`）：**

```typescript
// 1. 授权请求
app.get("/authorize", async (c) => {
  const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);

  // 检查客户端是否已通过签名cookie批准
  if (await clientIdAlreadyApproved(c.req.raw, oauthReqInfo.clientId, c.env.COOKIE_ENCRYPTION_KEY)) {
    return redirectToGithub(c.req.raw, oauthReqInfo, c.env, {});
  }

  // 显示批准对话框
  return renderApprovalDialog(c.req.raw, { client, server, state });
});

// 2. GitHub回调
app.get("/callback", async (c) => {
  // 交换代码获取访问令牌
  const [accessToken, errResponse] = await fetchUpstreamAuthToken({
    client_id: c.env.GITHUB_CLIENT_ID,
    client_secret: c.env.GITHUB_CLIENT_SECRET,
    code: c.req.query("code"),
    redirect_uri: new URL("/callback", c.req.url).href,
  });

  // 获取GitHub用户信息
  const user = await new Octokit({ auth: accessToken }).rest.users.getAuthenticated();

  // 使用用户属性完成授权
  return c.env.OAUTH_PROVIDER.completeAuthorization({
    props: { accessToken, email, login, name } as Props,
    userId: login,
  });
});
```

### Cookie安全系统

**HMAC签名的批准Cookie（`src/workers-oauth-utils.ts`）：**

```typescript
// 为客户端批准生成签名cookie
async function signData(key: CryptoKey, data: string): Promise<string> {
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 验证cookie完整性
async function verifySignature(key: CryptoKey, signatureHex: string, data: string): Promise<boolean> {
  const signatureBytes = new Uint8Array(signatureHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  return await crypto.subtle.verify("HMAC", key, signatureBytes.buffer, enc.encode(data));
}
```

### 用户上下文与权限

**认证用户属性：**

```typescript
type Props = {
  login: string; // GitHub用户名
  name: string; // 显示名称
  email: string; // 电子邮件地址
  accessToken: string; // GitHub访问令牌
};

// 在MCP工具中通过this.props可用
class MyMCP extends McpAgent<Env, Record<string, never>, Props> {
  async init() {
    // 在任何工具中访问用户上下文
    const username = this.props.login;
    const hasWriteAccess = ALLOWED_USERNAMES.has(username);
  }
}
```

## 监控与可观察性

**关键：此项目支持生产的可选Sentry集成，并包括内置的console日志记录。**

### 日志架构

**两个部署选项：**

1. **标准版本（`src/index.ts`）**：仅console日志记录
2. **Sentry版本（`src/index_sentry.ts`）**：完整的Sentry检测

### Sentry集成（可选）

**启用Sentry监控：**

```typescript
// src/index_sentry.ts - 具有监控的生产就绪
import * as Sentry from "@sentry/cloudflare";

// Sentry配置
function getSentryConfig(env: Env) {
  return {
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1,  // 100%跟踪采样
  };
}

// 使用跟踪检测MCP工具
private registerTool(name: string, description: string, schema: any, handler: any) {
  this.server.tool(name, description, schema, async (args: any) => {
    return await Sentry.startNewTrace(async () => {
      return await Sentry.startSpan({
        name: `mcp.tool/${name}`,
        attributes: extractMcpParameters(args),
      }, async (span) => {
        // 设置用户上下文
        Sentry.setUser({
          username: this.props.login,
          email: this.props.email,
        });

        try {
          return await handler(args);
        } catch (error) {
          span.setStatus({ code: 2 }); // 错误
          return handleError(error);  // 返回带有事件ID的用户友好错误
        }
      });
    });
  });
}
```

**启用的Sentry功能：**

- **错误跟踪**：具有上下文的自动异常捕获
- **性能监控**：100%采样率的完整请求跟踪
- **用户上下文**：绑定到事件的GitHub用户信息
- **工具跟踪**：具有参数的每个MCP工具调用跟踪
- **分布式跟踪**：跨Cloudflare Workers的请求流

### 生产日志模式

**Console日志记录（标准）：**

```typescript
// 数据库操作
console.log(`数据库操作在${duration}ms内成功完成`);
console.error(`数据库操作在${duration}ms后失败：`, error);

// 认证事件
console.log(`用户已认证：${this.props.login} (${this.props.name})`);

// 工具执行
console.log(`工具被调用：${toolName} by ${this.props.login}`);
console.error(`工具失败：${toolName}`, error);
```

**结构化错误处理：**

```typescript
// 安全错误清理
export function formatDatabaseError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("password")) {
      return "数据库认证失败。请检查凭据。";
    }
    if (error.message.includes("timeout")) {
      return "数据库连接超时。请重试。";
    }
    return `数据库错误：${error.message}`;
  }
  return "发生未知数据库错误。";
}
```

### 监控配置

**开发监控：**

```bash
# 在开发中启用Sentry
echo 'SENTRY_DSN=https://your-dsn@sentry.io/project' >> .dev.vars
echo 'NODE_ENV=development' >> .dev.vars

# 使用启用Sentry的版本
wrangler dev --config wrangler.jsonc  # 确保main = "src/index_sentry.ts"
```

**生产监控：**

```bash
# 设置生产密钥
wrangler secret put SENTRY_DSN
wrangler secret put NODE_ENV  # 设置为"production"

# 使用监控部署
wrangler deploy
```

## TypeScript开发标准

**关键：所有MCP工具必须使用Zod验证和适当的错误处理遵循TypeScript最佳实践。**

### 标准响应格式

**所有工具必须返回MCP兼容的响应对象：**

```typescript
import { z } from "zod";

// 遵循标准响应格式的工具
this.server.tool(
  "standardizedTool",
  "遵循标准响应格式的工具",
  {
    name: z.string().min(1, "名称不能为空"),
    options: z.object({}).optional(),
  },
  async ({ name, options }) => {
    try {
      // 输入已由Zod模式验证
      const result = await processName(name, options);

      // 返回标准化成功响应
      return {
        content: [
          {
            type: "text",
            text: `**成功**\n\n已处理：${name}\n\n**结果：**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n\n**处理时间：** 0.5s`,
          },
        ],
      };
    } catch (error) {
      // 返回标准化错误响应
      return {
        content: [
          {
            type: "text",
            text: `**错误**\n\n处理失败：${error instanceof Error ? error.message : String(error)}`,
            isError: true,
          },
        ],
      };
    }
  },
);
```

### 使用Zod的输入验证

**所有工具输入必须使用Zod模式验证：**

```typescript
import { z } from "zod";

// 定义验证模式
const DatabaseQuerySchema = z.object({
  sql: z
    .string()
    .min(1, "SQL查询不能为空")
    .refine((sql) => sql.trim().toLowerCase().startsWith("select"), {
      message: "仅允许SELECT查询",
    }),
  limit: z.number().int().positive().max(1000).optional(),
});

// 在工具定义中使用
this.server.tool(
  "queryDatabase",
  "执行只读SQL查询",
  DatabaseQuerySchema, // Zod模式提供自动验证
  async ({ sql, limit }) => {
    // sql和limit已经过验证并正确键入
    const results = await db.unsafe(sql);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  },
);
```

### 错误处理模式

**标准化错误响应：**

```typescript
// 错误处理实用程序
function createErrorResponse(message: string, details?: any): any {
  return {
    content: [{
      type: "text",
      text: `**错误**\n\n${message}${details ? `\n\n**详情：**\n\`\`\`json\n${JSON.stringify(details, null, 2)}\n\`\`\`` : ''}`,
      isError: true
    }]
  };
}

// 权限错误
if (!ALLOWED_USERNAMES.has(this.props.login)) {
  return createErrorResponse(
    "此操作权限不足",
    { requiredRole: "特权", userRole: "标准" }
  );
}

// 验证错误
if (isWriteOperation(sql)) {
  return createErrorResponse(
    "此工具不允许写操作",
    { operation: "写", allowedOperations: ["选择", "显示", "描述"] }
  );
}

// 数据库错误
catch (error) {
  return createErrorResponse(
    "数据库操作失败",
    { error: formatDatabaseError(error) }
  );
}
```

### 类型安全规则

**强制性TypeScript模式：**

1. **严格类型**：所有参数和返回类型明确键入
2. **Zod验证**：所有输入用Zod模式验证
3. **错误处理**：所有异步操作包装在try/catch中
4. **用户上下文**：用GitHub用户信息的属性键入
5. **环境**：使用`wrangler types`生成的Cloudflare Workers类型

## 代码样式偏好

### TypeScript样式

- 对所有函数参数和返回类型使用显式类型注解
- 对所有导出的函数和类使用JSDoc注释
- 对所有异步操作优先使用async/await
- **强制性**：对所有输入验证使用Zod模式
- **强制性**：使用适当的错误处理和try/catch块
- 保持函数小而专注（单一责任原则）

### 文件组织

- 每个MCP服务器应在单个TypeScript文件中自包含
- 导入语句组织：Node.js内置、第三方包、本地导入
- 在src/目录内使用相对导入
- **导入Zod进行验证和所有模块的适当类型**

### 测试约定

- 使用MCP Inspector进行集成测试：`npx @modelcontextprotocol/inspector@latest`
- 使用本地开发服务器测试：`wrangler dev`
- 使用描述性工具名称和描述
- **测试认证和权限场景**
- **使用无效数据测试输入验证**

## 重要说明

### 不要做什么

- **绝不**将密钥或环境变量提交到存储库
- **绝不**在简单方案可行时构建复杂方案
- **绝不**跳过Zod模式的输入验证

### 要做什么

- **始终**使用TypeScript严格模式和适当键入
- **始终**使用Zod模式验证输入
- **始终**遵循核心原则（KISS、YAGNI等）
- **始终**使用Wrangler CLI进行所有开发和部署

## Git工作流程

```bash
# 提交前始终运行：
npm run type-check              # 确保TypeScript编译
wrangler dev --dry-run          # 测试部署配置

# 使用描述性消息提交
git add .
git commit -m "feat: 为数据库查询添加新MCP工具"
```

## 快速参考

### 添加新MCP工具

1. **在你的项目中创建新工具模块**（遵循`examples/`中的模式）：
   ```typescript
   // src/tools/你的功能-tools.ts
   export function registerYourFeatureTools(server: McpServer, env: Env, props: Props) {
     // 在这里注册你的工具
   }
   ```

2. **在你的类型文件中为输入验证定义Zod模式**

3. **使用示例中的模式实现工具处理器**和适当的错误处理

4. **在`src/tools/register-tools.ts`中注册你的工具**：
   ```typescript
   import { registerYourFeatureTools } from "./你的功能-tools";
   
   export function registerAllTools(server: McpServer, env: Env, props: Props) {
     // 现有注册
     registerDatabaseTools(server, env, props);
     
     // 添加你的新注册
     registerYourFeatureTools(server, env, props);
   }
   ```

5. **如需要，更新文档**