# 生产部署（容器化、镜像构建、部署与监控）
> 最终目标：在生产运行时构建并验证 Docker 镜像/Compose 编排，启动服务并通过健康检查与 smoke tests，配置监控与回滚策略。

## 2. deploy(current dir) workflow stages:

### deploy workflow stage 1 — Docker环境检测与准备
* **输入**：本地/远端节点信息、`DOCKER_CONFIG.md`。
* **DO WHAT**：
>检测 `docker` / `docker-compose` 是否存在并满足版本要求（脚本：`docker --version`、`docker-compose --version`）；若缺失，给出平台化安装步骤并在用户确认下执行安装命令（或提供交互指南）。
>根据`DOCKER_CONFIG.md`,检测 GPU passthrough 能力（NVIDIA Docker 支持）。
* **输出**：`docker_env_report.md`（docker\_version、compose\_version、gpu\_passthrough）。
* **WHO**：Ops智能体，用户确认安装。
* **满足条件**：`docker_env_report.md` 显示符合作业的必要条件（例如 GPU 镜像需 `nvidia-docker` 支持）。

### deploy workflow stage 2 — 镜像构建与容器校验
* **输入**：`Dockerfile`（CPU/GPU 变体由 `DOCKER_CONFIG.md` 生成）、docker环境的python依赖`requirements.txt`、模型权重文件（提示用户输入）。
* **DO WHAT**：
>构建镜像（`docker build -t my_project:gpu-v1 .`）；
>运行镜像内校验脚本（例如 `python -c "import torch; print(torch.cuda.is_available())"`）；生成 `container_env_check.log`。
* **输出**：构建的镜像（tag），`container_env_check.log`。
* **WHO**：Ops智能体。
* **满足条件**：若为 GPU 镜像，`container_env_check.log` 必须显示 `cuda_available: true`；镜像体积、层次结构符合规范（例如依赖层最小化）。

### deploy workflow stage 3 — 部署启动与 API、Docs、健康与性能检查
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

### deploy workflow stage 4 — Docker运行监控 / 需求回顾
* **输入**：运行的docker容器、`deploy_report.md`、`tech.md` 和`README.md`
* **活动**：
> 配置监控（Prometheus/Grafana 指标、告警规则）、设置规范漂移检测（生产指标触发 Spec 漂移器），定义回滚策略（蓝绿或 Canary）
> 回顾`README.md`中原始需求条目，并根据运行结果，监控结果更新`README.md`。
* **输出**：`docker_running_report.md`；更新`README.md`。
* **责任方**：Tester智能体, Planning智能体。
* **满足条件**：可通过监控仪表盘追踪指标；`README.md`中需求完全实现，API或者功能正常，性能指标正常，测试结果汇总完整。

---

# collaborative multi-agent systems
- **requirements-agent**，详细需求文档编写
- **research-agent**，技术选型
- **coder-agent**，编写代码
- **reviewer-agent**，代码完整性检查，代码质量评审，对齐需求（requirement）
- **planner-agent**，根据需求和技术选型编排计划（plan），生成任务清单todo
- **ops-agent**,创建python venv环境，创建docker环境（CPU或者GPU）
- **tester-agent**，代码测试、功能测试和模块测试 
- **dataset-agent**，找到ML算法对应的最适合的开源数据集；为1-epoch训练抽取小数据集；数据采样和可视化

# AI action rules
- **卓越工作原则**， 所有代码都要检查一遍，不可以遗漏功能，不可以偷懒，绝对不能省略代码不写，必须要完整代码
- **绝不假设目标项目已存在**，创建前必须检查
- **绝不在本目录中创建程序代码**，不允许在本目录创建任何代码文件
- **严格遵守'.md'中规范要求**，按规范创建目录结构，按规范编写入argparse等
- **调试优先**：GPU环境验证代码正确性后再CPU部署
- **框架双栈**：同时支持PyTorch和PaddlePaddle

# tools
- **日志规范**，打印tool use 的详细信息