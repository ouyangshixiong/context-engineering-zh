# Specs 使用指南和配置说明

## 1. 概述

specs目录包含了机器学习项目开发的所有规范文件，支持用户根据企业需求进行配置和修改。这些规范文件与plugins目录的快速sprint插件协同工作，支持敏捷开发模式。

## 2. 目录结构

```
specs/
├── README.md                    # Specs使用指南和配置说明
├── ml-framework-specs/          # 机器学习框架规范
│   ├── ML.md                    # 机器学习技术栈规范
├── environment-configs/         # 环境配置规范
│   └── VENV_CONFIG.md           # GPU调试环境规范
├── deployment-configs/          # 部署配置规范
│   ├── DEPLOY.md                # 部署指南
│   └── DOCKER_CONFIG.md         # Docker配置规范
├── dataset-configs/             # 数据集配置规范
│   └── ModelScope与datasets不兼容.txt # 数据集兼容性说明
├── code-quality/                # 代码质量规范
│   └── DEBUG_CODE.md            # 调试代码规范
├── config-file-specs/           # 配置文件格式规范
│   └── OmegaConf_README.md      # OmegaConf配置指南
└── sprint-integration/          # 快速sprint集成规范
    └── SPRINT_INTEGRATION.md    # 快速sprint集成指南
```

## 3. 配置修改指南

每个规范文件都包含配置项和示例，用户可以根据企业需求修改这些配置项。修改步骤如下：

1. 选择需要修改的规范文件
2. 找到对应的配置项
3. 修改示例中的值
4. 保存文件
5. 快速sprint插件会自动使用新的配置

## 4. 快速sprint集成

快速sprint插件会自动读取specs目录下的配置文件，获取规范信息。集成示例：

```bash
# 快速sprint集成命令
/sprint-plugin:快速sprint --specs-path specs/ --framework pytorch --environment gpu
```

### 4.1 快速sprint工作流

快速sprint插件与specs协同工作的流程如下：

1. 插件读取specs目录下的配置文件
2. 根据配置生成任务清单
3. 执行任务清单
4. 验证执行结果
5. 生成报告

### 4.2 配置项优先级

快速sprint插件使用以下优先级读取配置：

1. 命令行参数
2. 环境变量
3. specs目录下的配置文件
4. 默认配置

## 5. 规范版本管理

- specs目录使用语义化版本管理
- 定期更新配置项和示例
- 保持与最新框架版本兼容
- 支持回滚到之前的配置版本

## 6. 企业定制建议

1. 建立企业级specs模板
2. 定期更新和维护规范
3. 培训开发团队使用规范
4. 结合CI/CD流程验证规范执行

## 7. 验证和测试

每个specs文件包含验证方法，用户可以使用这些方法验证配置是否正确。快速sprint插件也会自动验证配置，并提供详细的错误信息和修复建议。

## 8. 多智能体协作系统

框架使用以下智能体进行协作：

- **requirements-plugin**：详细需求文档编写
- **research-agent**：技术选型（来自requirements-plugin）
- **coder-agent**：编写代码
- **reviewer-agent**：代码完整性检查，代码质量评审，对齐需求（requirement）
- **planner-agent**：根据需求和技术选型编排计划（plan），生成任务清单todo
- **ops-agent**：创建python venv环境，创建docker环境（CPU或者GPU）
- **tester-agent**：代码测试、功能测试和模块测试 
- **dataset-agent**：找到ML算法对应的最适合的开源数据集；为1-epoch训练抽取小数据集；数据采样和可视化

## 9. 项目认知边界

- **本目录是框架（Framework）项目**，用于创建目标项目（如yolov10）
- **目标项目才是最终产物**，框架仅提供创建工具和流程
- **两阶段原则**：先VENV调试→后DOCKER部署

## 10. AI行为规则

- **卓越工作原则**：所有代码都要检查一遍，不可以遗漏功能，不可以偷懒，绝对不能省略代码不写，必须要完整代码
- **绝不假设目标项目已存在**：创建前必须检查
- **绝不在本目录中创建程序代码**：不允许在本目录创建任何代码文件
- **严格遵守'.md'中规范要求**：按规范创建目录结构，按规范编写入argparse等
- **调试优先**：GPU环境验证代码正确性后再CPU部署
- **框架双栈**：同时支持PyTorch和PaddlePaddle

## 11. 联系我们

如有任何问题或建议，请联系开发团队。