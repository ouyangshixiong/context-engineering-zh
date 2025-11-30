# VENV_CONFIG.md - GPU调试环境规范

> 基于README.md 3.2.2节，GPU环境+mini数据集配置。支持用户根据企业需求进行配置修改。

## 1. 概述

### 1.1 规范目标
- **核心目标**: 提供标准化的GPU调试环境配置
- **适用范围**: 深度学习项目开发与调试
- **技术覆盖**: PyTorch、PaddlePaddle双栈支持
- **验证标准**: GPU利用率>90%，1-epoch训练成功

### 1.2 快速sprint集成
- 快速sprint插件会自动读取此配置
- 修改配置后，快速sprint插件会使用新的配置
- 集成示例：
  ```bash
  # 快速sprint集成命令
  /sprint-plugin:快速sprint --environment gpu
  ```

## 2. 配置项

### 2.1 环境矩阵配置
- **描述**: 环境组件版本配置
- **默认值**: 基于最新稳定版本
- **示例**: 
  ```yaml
  # 环境矩阵配置
  environment_matrix:
    python:
      version: 3.10
      verification_command: 'python --version'
      pass_criteria: '版本匹配'
    
    pytorch:
      version: 2.4.1
      verification_command: 'torch.__version__'
      pass_criteria: 'CUDA自动适配'
    
    paddlepaddle:
      version: 2.6.0
      verification_command: 'paddle.__version__'
      pass_criteria: 'GPU编译通过'
    
    cuda:
      version: 12.4.1
      verification_command: 'torch.version.cuda'
      pass_criteria: '驱动兼容'
    
    gpu_memory:
      minimum: 6GB
      verification_command: 'nvidia-smi'
      pass_criteria: '内存检测'
  ```

### 2.2 一键安装配置
- **描述**: 一键安装配置
- **默认值**: 基于环境矩阵配置
- **示例**: 
  ```yaml
  # 一键安装配置
  one_click_install:
    create_environment:
      command: 'python3.10 -m venv venv'
    
    activate_environment:
      command: 'source venv/bin/activate'
    
    install_dependencies:
      commands:
        - 'pip install torch==2.4.1 torchvision==0.19.1 torchaudio==2.4.1'
        - 'pip install paddlepaddle-gpu==2.6.0'
        - 'pip install pytorch-lightning==2.0.0 omegaconf==2.3.0'
    
    verification:
      command: "python -c \"import torch, paddle; print(f'PyTorch: {torch.cuda.is_available()}\nPaddle: {paddle.is_compiled_with_cuda()}')\""
  ```

### 2.3 性能基准配置
- **描述**: 性能基准配置
- **默认值**: 基于不同GPU型号
- **示例**: 
  ```yaml
  # 性能基准配置
  performance_benchmark:
    rtx3060:
      memory: 12GB
      matrix_operation: ~0.002s
      memory_usage: ~2GB
      utilization: 95%
    
    rtx4090:
      memory: 24GB
      matrix_operation: ~0.001s
      memory_usage: ~4GB
      utilization: 95%
    
    a100:
      memory: 40GB
      matrix_operation: ~0.0008s
      memory_usage: ~6GB
      utilization: 94%
  ```

### 2.4 Mini数据集配置
- **描述**: Mini数据集配置
- **默认值**: COCO128数据集
- **示例**: 
  ```yaml
  # Mini数据集配置
  mini_dataset:
    download:
      command: 'download.py --dataset coco128 --data_dir ./data/mini --mini-mode'
    
    verify_structure:
      command: 'ls data/mini/coco128/{train2017,val2017,annotations}'
    
    visualize_sample:
      command: |
        python -c "
        from src.datasets.coco_detection import COCODetection
        dataset = COCODetection('./data/mini/coco128', 'train')
        print(f'样本数: {len(dataset)}')
        "
  ```

### 2.5 1-epoch验证配置
- **描述**: 1-epoch验证配置
- **默认值**: yolov10n模型，coco128数据集
- **示例**: 
  ```yaml
  # 1-epoch验证配置
  one_epoch_validation:
    fast_training:
      command: 'train.py model=yolov10n data=coco128 trainer.max_epochs=1 trainer.fast_dev_run=true trainer.precision=16'
    
    verify_results:
      command: 'ls logs/lightning_logs/version_0/checkpoints/'
  ```

### 2.6 内存计算配置
- **描述**: GPU内存计算配置
- **默认值**: 基于模型类型
- **示例**: 
  ```yaml
  # 内存计算配置
  memory_calculation:
    model_memory_requirements:
      yolov10n: 3.5  # GB
      yolov10s: 5.0  # GB
      yolov10m: 8.0  # GB
    
    batch_size_calculation:
      command: |
        python -c "
        import torch
        model_memory = {
            'yolov10n': 3.5,  # GB
            'yolov10s': 5.0,  # GB
            'yolov10m': 8.0,  # GB
        }
        
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        for model, mem in model_memory.items():
            if gpu_memory >= mem * 1.2:
                batch_size = int(gpu_memory / mem * 8)
                print(f'{model}: batch={max(4, min(batch_size, 64))}')
        "
  ```

### 2.7 验证清单配置
- **描述**: 验证清单配置
- **默认值**: 基础验证项
- **示例**: 
  ```yaml
  # 验证清单配置
  validation_checklist:
    - python_version: '3.9-3.10'
    - pytorch_cuda_auto_adaptation: true
    - paddlepaddle_gpu_compilation: true
    - mini_dataset_integrity: true
    - one_epoch_training_success: true
    - gpu_utilization: '>90%'
  ```

### 2.8 错误处理配置
- **描述**: 错误处理配置
- **默认值**: 常见错误解决方案
- **示例**: 
  ```yaml
  # 错误处理配置
  error_handling:
    cuda_mismatch:
      symptom: '版本错误'
      solution: '重装torch==2.4.1'
    
    out_of_memory:
      symptom: '内存不足'
      solution: 'batch_size减半'
    
    driver_too_old:
      symptom: 'CUDA错误'
      solution: '升级nvidia-driver-535'
  ```

### 2.9 环境切换配置
- **描述**: 环境切换配置
- **默认值**: CPU到GPU切换
- **示例**: 
  ```yaml
  # 环境切换配置
  environment_switching:
    cpu_to_gpu:
      commands:
        - 'source venv/bin/activate'
        - 'pip install -r requirements-gpu.txt'
        - "python -c \"import torch; print(f'GPU: {torch.cuda.is_available()}')\""
  ```

## 3. 执行示例

### 3.1 快速sprint集成示例

```bash
# 快速sprint集成命令
/sprint-plugin:快速sprint --environment gpu

# 执行流程
1. 快速sprint插件读取VENV_CONFIG.md配置
2. 自动创建并配置GPU环境
3. 安装依赖并验证
4. 下载mini数据集
5. 执行1-epoch验证
6. 生成验证报告
```

## 4. 配置时间

- **配置时间**: 5分钟
- **验证时间**: 2分钟
- **GPU利用率**: >90%

---
**版本**: 1.0.0 | **最后更新**: 2025-11-30 | **文档类型**: 配置规范