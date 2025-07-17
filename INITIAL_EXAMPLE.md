## 功能：

- 一个Pydantic AI代理，将另一个Pydantic AI代理作为工具。
- 主代理的研究代理，然后是子代理的邮件草稿代理。
- 用于与代理交互的CLI。
- 邮件草稿代理使用Gmail，研究代理使用Brave API。

## 示例：

在 `examples/` 文件夹中，有一个README供你阅读以理解示例的全部内容，以及当你为上述功能创建文档时如何构建你自己的README。

- `examples/cli.py` - 用作创建CLI的模板
- `examples/agent/` - 阅读这里的所有文件以理解创建支持不同提供商和LLMs的Pydantic AI代理的最佳实践，处理代理依赖关系，以及向代理添加工具。

不要直接复制任何这些示例，它们是完全不同的项目。但将其作为灵感和最佳实践使用。

## 文档：

Pydantic AI文档：https://ai.pydantic.dev/

## 其他考虑：

- 包括.env.example，README包含设置说明，包括如何配置Gmail和Brave。
- 在README中包含项目结构。
- 虚拟环境已设置必要的依赖项。
- 使用python_dotenv和load_env()处理环境变量