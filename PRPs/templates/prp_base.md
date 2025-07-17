名称: "基础PRP模板v2 - 上下文丰富且带验证循环"
描述: |

## 目的
针对AI代理优化的模板，提供足够的上下文和自我验证能力，通过迭代优化实现可工作的代码。

## 核心原则
1. **上下文为王**：包含所有必要的文档、示例和陷阱
2. **验证循环**：提供AI可以运行和修复的可执行测试/代码检查
3. **信息密集**：使用代码库中的关键词和模式
4. **渐进成功**：从简单开始，验证，然后增强
5. **全局规则**：确保遵循CLAUDE.md中的所有规则

---

## 目标
[需要构建的内容 - 具体说明最终状态和期望]

## 原因
- [业务价值和用户影响]
- [与现有功能的集成]
- [解决的问题及对象]

## 内容
[用户可见的行为和技术要求]

### 成功标准
- [ ] [具体的可衡量结果]

## 所有需要的上下文

### 文档与参考资料（列出实现功能所需的所有上下文）
```yaml
# 必须阅读 - 包含在你的上下文窗口中
- url: [官方API文档URL]
  why: [你将需要的特定部分/方法]
  
- file: [path/to/example.py]
  why: [要遵循的模式，要避免的陷阱]
  
- doc: [库文档URL] 
  section: [关于常见陷阱的特定部分]
  critical: [防止常见错误的关键见解]

- docfile: [PRPs/ai_docs/file.md]
  why: [用户已粘贴到项目中的文档]

```

### 当前代码库树（在项目根目录运行`tree`获取代码库概览）
```bash

```

### 期望的代码库树及要添加的文件和文件职责
```bash

```

### 我们代码库及库的已知陷阱和怪癖
```python
# 关键：[库名称] 需要[特定设置]
# 示例：FastAPI端点需要异步函数
# 示例：此ORM不支持超过1000条记录的批量插入
# 示例：我们使用pydantic v2和
```

## 实现蓝图

### 数据模型和结构

创建核心数据模型，我们确保类型安全和一致性。
```python
示例： 
 - orm模型
 - pydantic模型
 - pydantic模式
 - pydantic验证器

```

### 为完成PRP需要完成的任务列表，按应完成的顺序

```yaml
任务1：
修改 src/existing_module.py：
  - 查找模式："class OldImplementation"
  - 在包含"def __init__"的行后注入
  - 保留现有方法签名

创建 src/new_feature.py：
  - 镜像模式来自：src/similar_feature.py
  - 修改类名和核心逻辑
  - 保持错误处理模式相同

...(...)

任务N：
...

```


### 每个任务的伪代码，根据需要添加到每个任务
```python

# 任务1
# 带有关键细节的伪代码，不要编写整个代码
async def new_feature(param: str) -> Result:
    # 模式：始终先验证输入（参见src/validators.py）
    validated = validate_input(param)  # 引发ValidationError
    
    # 陷阱：此库需要连接池
    async with get_connection() as conn:  # 参见src/db/pool.py
        # 模式：使用现有重试装饰器
        @retry(attempts=3, backoff=exponential)
        async def _inner():
            # 关键：如果>10请求/秒API返回429
            await rate_limiter.acquire()
            return await external_api.call(validated)
        
        result = await _inner()
    
    # 模式：标准化响应格式
    return format_response(result)  # 参见src/utils/responses.py
```

### 集成点
```yaml
数据库：
  - 迁移："向用户表添加列'feature_enabled'"
  - 索引："CREATE INDEX idx_feature_lookup ON users(feature_id)"
  
配置：
  - 添加到：config/settings.py
  - 模式："FEATURE_TIMEOUT = int(os.getenv('FEATURE_TIMEOUT', '30'))"
  
路由：
  - 添加到：src/api/routes.py  
  - 模式："router.include_router(feature_router, prefix='/feature')"
```

## 验证循环

### 级别1：语法与样式
```bash
# 首先运行这些 - 在继续前修复任何错误
ruff check src/new_feature.py --fix  # 自动修复可能的错误
mypy src/new_feature.py              # 类型检查

# 期望：无错误。如果有错误，阅读错误并修复。
```

### 级别2：单元测试 每个新功能/文件/函数使用现有测试模式
```python
# 创建 test_new_feature.py 并包含这些测试用例：
def test_happy_path():
    """基本功能正常工作"""
    result = new_feature("valid_input")
    assert result.status == "success"

def test_validation_error():
    """无效输入引发ValidationError"""
    with pytest.raises(ValidationError):
        new_feature("")

def test_external_api_timeout():
    """优雅处理超时"""
    with mock.patch('external_api.call', side_effect=TimeoutError):
        result = new_feature("valid")
        assert result.status == "error"
        assert "timeout" in result.message
```

```bash
# 运行并迭代直到通过：
uv run pytest test_new_feature.py -v
# 如果失败：阅读错误，理解根本原因，修复代码，重新运行（绝不通过mock通过）
```

### 级别3：集成测试
```bash
# 启动服务
uv run python -m src.main --dev

# 测试端点
curl -X POST http://localhost:8000/feature \
  -H "Content-Type: application/json" \
  -d '{"param": "test_value"}'

# 期望：{"status": "success", "data": {...}}
# 如果错误：检查logs/app.log中的堆栈跟踪
```

## 最终验证清单
- [ ] 所有测试通过：`uv run pytest tests/ -v`
- [ ] 无代码检查错误：`uv run ruff check src/`
- [ ] 无类型错误：`uv run mypy src/`
- [ ] 手动测试成功：[特定curl/命令]
- [ ] 错误情况优雅处理
- [ ] 日志信息丰富但不冗长
- [ ] 如需要，文档已更新

---

## 要避免的反模式
- ❌ 当现有模式有效时不要创建新模式
- ❌ 不要跳过验证因为"它应该工作"  
- ❌ 不要忽略失败的测试 - 修复它们
- ❌ 不要在异步上下文中使用同步函数
- ❌ 不要硬编码应该是配置的值
- ❌ 不要捕获所有异常 - 要具体