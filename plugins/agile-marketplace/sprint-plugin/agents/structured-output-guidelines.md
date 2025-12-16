---
name: structured-output-guidelines
description: 面向sprint-plugin的统一结构化输出规范与示例
---

# 统一结构化输出规范
- 目的：为所有agents提供一致、可验证、可集成的JSON输出
- 标准：遵循JSON Schema（draft 2020-12），确保输出稳定、类型安全

## 核心约定
- 键命名使用`snake_case`
- 必须使用`additionalProperties: false`
- 必须声明`required`字段集合
- 使用`enum`约束状态与类别
- 时间采用`date-time`格式
- 数值范围明确标注`minimum`/`maximum`

## 通用枚举
- 状态：`["dispatched","running","completed","failed"]`
- 严重度：`["low","medium","high","critical"]`
- 优先级：`["Highest","High","Medium","Low"]`

## 验证与类型安全
- TypeScript：使用Agent SDK的`outputFormat: { type: "json_schema" }`
- Python：同样通过Agent SDK的`output_format`传入模式
- 推荐：在业务侧使用Zod/Pydantic进行二次校验与类型推断

## 错误处理策略
- 当无法满足Schema时返回错误并重试
- 业务侧根据`result_status`或`errors`字段进行降级与补偿

## 适配范围
- Development Team Agent：交付产物与测试指标
- Quality Agent：验证通过率、问题清单、JIRA缺陷
- Scrum Master Agent：调度汇总、子智能体调用状态、后续动作

## 快速检查清单
- 是否包含摘要字段（`summary`或同类字段）
- 是否声明所有必要字段为`required`
- 是否限制未知字段（`additionalProperties: false`）
- 是否为枚举型字段设置`enum`
- 是否使用`date-time`格式标注时间戳
