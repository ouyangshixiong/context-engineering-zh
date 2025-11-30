# DOCKER_CONFIG.md - 生产部署技术规范

> 基于README.md 3.3节，容器化部署与GPU生产环境。支持用户根据企业需求进行配置修改。

## 1. 概述

### 1.1 规范目标
- **核心目标**: 提供标准化的Docker部署配置
- **适用范围**: 深度学习项目生产部署
- **技术覆盖**: PyTorch、PaddlePaddle双栈支持
- **验证标准**: GPU利用率>90%，容器启动正常

### 1.2 快速sprint集成
- 快速sprint插件会自动读取此配置
- 修改配置后，快速sprint插件会使用新的配置
- 集成示例：
  ```bash
  # 快速sprint集成命令
  /sprint-plugin:快速sprint --deployment docker
  ```

## 2. 配置项

### 2.1 部署矩阵配置
- **描述**: 部署组件版本配置
- **默认值**: 基于最新稳定版本
- **示例**: 
  ```yaml
  # 部署矩阵配置
  deployment_matrix:
    cuda:
      version: 12.6
      specification: 'GPU runtime'
      verification: 'nvidia-smi通过'
      readme_reference: '3.3.1节'
    
    pytorch:
      version: '2.4.1+cu12.6'
      specification: 'GPU生产版'
      verification: 'torch.cuda可用'
      readme_reference: '3.3.2节'
    
    paddlepaddle:
      version: '2.6.0+gpu'
      specification: 'GPU生产版'
      verification: 'paddle.is_compiled_with_cuda'
      readme_reference: '3.3.2节'
    
    gpu_memory:
      minimum: 6GB
      specification: 'RTX3060+'
      verification: '内存检测通过'
      readme_reference: '3.3节'
  ```

### 2.2 一键部署配置
- **描述**: 一键部署配置
- **默认值**: 基于部署矩阵配置
- **示例**: 
  ```yaml
  # 一键部署配置
  one_click_deployment:
    build_run:
      command: 'docker-compose -f deploy/docker-compose.yml up -d'
    
    verification:
      command: |
        docker exec ml-project python -c "
        import torch, paddle
        print(f'PyTorch: {torch.__version__}')
        print(f'CUDA: {torch.cuda.is_available()}')
        print(f'Paddle: {paddle.__version__}')
        "
  ```

### 2.3 Dockerfile配置
- **描述**: Dockerfile配置
- **默认值**: 基于CUDA 12.6
- **示例**: 
  ```yaml
  # Dockerfile配置
  dockerfile:
    from: 'nvidia/cuda:12.6.0-cudnn9-runtime-ubuntu22.04'
    workdir: '/workspace'
    copy_requirements: 'requirements-gpu.txt .'
    install_requirements: 'pip3 install --no-cache-dir -r requirements-gpu.txt'
    copy_source: '.'
    environment:
      - 'PYTHONPATH=/workspace'
      - 'CUDA_VISIBLE_DEVICES=auto'
    expose_ports: '8888 6006 8000'
    cmd: '["python", "scripts/serve.py"]'
  ```

### 2.4 Compose配置
- **描述**: Docker Compose配置
- **默认值**: 基于版本3.8
- **示例**: 
  ```yaml
  # Compose配置
  compose:
    version: '3.8'
    services:
      ml-project:
        build: '.'
        runtime: 'nvidia'
        environment:
          - 'NVIDIA_VISIBLE_DEVICES=all'
        volumes:
          - './:/workspace'
          - './data:/workspace/data'
          - './logs:/workspace/logs'
        ports:
          - "8888:8888"
          - "6006:6006"
          - "8000:8000"
  ```

### 2.5 性能基准配置
- **描述**: 性能基准配置
- **默认值**: 基于不同GPU型号
- **示例**: 
  ```yaml
  # 性能基准配置
  performance_benchmark:
    rtx3060:
      memory: 12GB
      epoch_time: '~45分钟'
      gpu_utilization: '>90%'
      batch_size: 32
    
    rtx4090:
      memory: 24GB
      epoch_time: '~25分钟'
      gpu_utilization: '>90%'
      batch_size: 64
    
    a100:
      memory: 40GB
      epoch_time: '~15分钟'
      gpu_utilization: '>90%'
      batch_size: 128
  ```

### 2.6 验证清单配置
- **描述**: 验证清单配置
- **默认值**: 基础验证项
- **示例**: 
  ```yaml
  # 验证清单配置
  validation_checklist:
    - nvidia_smi: '检测通过'
    - image_build: '成功'
    - container_start: '正常'
    - gpu_recognition: '正确'
    - multi_gpu_support: '验证通过'
    - gpu_utilization: '>90%'
  ```

### 2.7 技术约束配置
- **描述**: 技术约束配置
- **默认值**: 基于Docker 20.10+
- **示例**: 
  ```yaml
  # 技术约束配置
  technical_constraints:
    environment_requirements: 'Docker 20.10+, nvidia-docker2'
    memory_management: '自动GPU内存分配'
    performance_standard: 'GPU利用率>90%'
    deployment_time: '5分钟完成'
    monitoring_ports: '8888/6006/8000'
  ```

### 2.8 多GPU配置
- **描述**: 多GPU配置
- **默认值**: 4GPU训练
- **示例**: 
  ```yaml
  # 多GPU配置
  multi_gpu_configuration:
    four_gpu_training:
      commands:
        - "docker run --gpus '\"device=0,1,2,3\"' -it ml-project bash"
        - 'export CUDA_VISIBLE_DEVICES=0,1,2,3'
        - 'export NCCL_DEBUG=INFO'
  ```

### 2.9 错误处理配置
- **描述**: 错误处理配置
- **默认值**: 常见错误解决方案
- **示例**: 
  ```yaml
  # 错误处理配置
  error_handling:
    cuda_oom:
      symptom: '内存不足'
      solution: 'batch_size减半'
    
    nccl_error:
      symptom: '通信失败'
      solution: 'export NCCL_P2P_DISABLE=1'
    
    permission_issue:
      symptom: 'docker拒绝'
      solution: 'sudo usermod -aG docker $USER'
  ```

## 3. 执行示例

### 3.1 快速sprint集成示例

```bash
# 快速sprint集成命令
/sprint-plugin:快速sprint --deployment docker

# 执行流程
1. 快速sprint插件读取DOCKER_CONFIG.md配置
2. 自动构建Docker镜像
3. 启动容器并验证
4. 执行性能基准测试
5. 生成部署报告
```

## 4. 部署时间

- **部署时间**: 5分钟
- **GPU利用率**: >90%
- **容器化**: 100%

---
**版本**: 1.0.0 | **最后更新**: 2025-11-30 | **文档类型**: 配置规范