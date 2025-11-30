# DEBUG_CODE.md - 代码验证技术规范

> 基于README.md 3.2.3节1-epoch验证规范，系统化验证代码正确性和可用性。支持用户根据企业需求进行配置修改。

## 1. 概述

### 1.1 规范目标
- **核心目标**: 提供标准化的代码验证流程
- **适用范围**: 深度学习项目代码验证
- **技术覆盖**: PyTorch、PaddlePaddle双栈支持
- **验证标准**: 六阶段验证流程全部通过，GPU利用率>90%

### 1.2 快速sprint集成
- 快速sprint插件会自动读取此配置
- 修改配置后，快速sprint插件会使用新的配置
- 集成示例：
  ```bash
  # 快速sprint集成命令
  /sprint-plugin:快速sprint --validation debug
  ```

## 2. 配置项

### 2.1 六阶段验证流程配置
- **描述**: 代码验证的六阶段流程配置
- **默认值**: 环境检查 → 导入测试 → 数据集验证 → 模型验证 → 训练测试 → 结果验证
- **示例**: 
  ```yaml
  # 六阶段验证流程配置
  six_stage_validation:
    stages:
      - environment_check
      - import_test
      - dataset_validation
      - model_validation
      - training_test
      - result_validation
    
    stage_config:
      environment_check:
        key_checks: 'Python版本/依赖'
        command: 'python --version'
        pass_criteria: '3.9-3.10，依赖完整'
        readme_reference: '3.2.2节'
      
      import_test:
        key_checks: '模块/类导入'
        command: "python -c \"import src.models\""
        pass_criteria: '零ImportError'
        readme_reference: '3.2.3节'
      
      dataset_validation:
        key_checks: '数据下载/加载'
        command: 'python scripts/download.py'
        pass_criteria: '数据完整性100%'
        readme_reference: '3.2.2节'
      
      model_validation:
        key_checks: '模型创建/前向'
        command: "python -c \"model = YOLOv10\""
        pass_criteria: '参数计算正确'
        readme_reference: '3.2.3节'
      
      training_test:
        key_checks: '1-epoch训练'
        command: 'python scripts/train.py'
        pass_criteria: '日志生成，无错误'
        readme_reference: '3.2.3节'
      
      result_validation:
        key_checks: '指标检查'
        command: "python -c \"pd.read_csv('metrics.csv')\""
        pass_criteria: '损失下降，指标正常'
        readme_reference: '3.2.3节'
  ```

### 2.2 关键验证脚本配置

#### 2.2.1 环境验证配置
- **描述**: 环境验证配置
- **默认值**: Python版本3.9-3.10，依赖完整
- **示例**: 
  ```yaml
  # 环境验证配置
  environment_validation:
    python_version_check:
      command: 'python --version'
      expected: '3.9-3.10'
    
    dependency_validation:
      command: "python -c \"import torch, paddle, pytorch_lightning; print('框架依赖OK')\""
    
    gpu_availability:
      command: "python -c \"import torch; print(f'CUDA可用: {torch.cuda.is_available()}')\""
  ```

#### 2.2.2 导入验证配置
- **描述**: 导入验证配置
- **默认值**: 核心模块导入测试
- **示例**: 
  ```yaml
  # 导入验证配置
  import_validation:
    core_module_test:
      command: |
        python -c "
        try:
            import src.models
            import src.datasets
            print('✅ 核心模块导入成功')
        except ImportError as e:
            print(f'❌ 导入失败: {e}')
            exit(1)
        "
  ```

#### 2.2.3 数据集验证配置
- **描述**: 数据集验证配置
- **默认值**: COCO128数据集
- **示例**: 
  ```yaml
  # 数据集验证配置
  dataset_validation:
    mini_dataset_download:
      command: 'python scripts/download.py --dataset coco128 --data_dir ./data/mini'
    
    data_integrity_validation:
      command: |
        python -c "
        from pathlib import Path
        data_dir = Path('./data/mini/coco128')
        required = ['train2017', 'val2017', 'annotations']
        for item in required:
            assert (data_dir / item).exists(), f'{item} 缺失'
        print('✅ 数据集完整性验证通过')
        "
  ```

#### 2.2.4 模型验证配置
- **描述**: 模型验证配置
- **默认值**: YOLOv10模型
- **示例**: 
  ```yaml
  # 模型验证配置
  model_validation:
    model_creation_test:
      command: |
        python -c "
        from src.models.pytorch.yolov10 import YOLOv10
        import torch
        
        model = YOLOv10(num_classes=80)
        x = torch.randn(1, 3, 640, 640)
        outputs = model(x)
        print(f'✅ 模型创建成功，参数: {sum(p.numel() for p in model.parameters())}')
        print(f'✅ 前向传播成功，输出形状: {[out.shape for out in outputs]}')
        "
  ```

#### 2.2.5 训练验证配置
- **描述**: 训练验证配置
- **默认值**: 1-epoch快速训练
- **示例**: 
  ```yaml
  # 训练验证配置
  training_validation:
    one_epoch_training:
      command: |
        python scripts/train.py \
          model=yolov10n \
          data=coco128 \
          trainer.max_epochs=1 \
          trainer.fast_dev_run=true \
          trainer.precision=16
    
    training_result_validation:
      command: 'ls -la logs/lightning_logs/version_0/checkpoints/'
  ```

#### 2.2.6 性能基准配置
- **描述**: 性能基准配置
- **默认值**: GPU性能测试
- **示例**: 
  ```yaml
  # 性能基准配置
  performance_benchmark:
    gpu_performance_test:
      command: |
        python -c "
        import torch
        import time
        
        # 矩阵乘法基准
        size = 8192
        a = torch.randn(size, size).cuda()
        b = torch.randn(size, size).cuda()
        
        torch.cuda.synchronize()
        start = time.time()
        c = torch.matmul(a, b)
        torch.cuda.synchronize()
        elapsed = time.time() - start
        
        print(f'GPU矩阵乘法: {size}x{size} 用时 {elapsed:.3f}s')
        print(f'GPU内存: {torch.cuda.memory_allocated()/1024**3:.1f}GB')
        "
  ```

### 2.3 一键验证脚本配置
- **描述**: 一键验证脚本配置
- **默认值**: 完整验证流程
- **示例**: 
  ```yaml
  # 一键验证脚本配置
  one_click_validation:
    script_content: |
      #!/bin/bash
      # validate_all.sh - 完整验证流程
      
      echo "=== 代码验证开始 ==="
      
      # 环境检查
      echo "1. 环境检查..."
      python --version
      python -c "import torch, paddle; print('✅ 框架依赖OK')"
      
      # 导入测试
      echo "2. 导入测试..."
      python -c "from src.models.pytorch.yolov10 import YOLOv10; print('✅ PyTorch模型')"
      python -c "from src.datasets.coco_detection import COCODetection; print('✅ 数据集')"
      
      # 数据集验证
      echo "3. 数据集验证..."
      python scripts/download.py --dataset coco128 --data_dir ./data/mini
      
      # 训练验证
      echo "4. 训练验证..."
      python scripts/train.py model=yolov10n data=coco128 trainer.max_epochs=1 trainer.fast_dev_run=true
      
      echo "=== 代码验证完成 ==="
  ```

### 2.4 性能基准矩阵配置
- **描述**: 性能基准矩阵配置
- **默认值**: 基于不同数据集和batch size
- **示例**: 
  ```yaml
  # 性能基准矩阵配置
  performance_benchmark_matrix:
    cifar10:
      batch_size: 32
      epoch_time: '~8秒'
      gpu_memory: '~2GB'
      utilization: 95%
      data_source: 'ML.md第266行'
    
    coco128:
      batch_size: 32
      epoch_time: '~45秒'
      gpu_memory: '~4GB'
      utilization: 95%
      data_source: 'ML.md第267行'
    
    imagenet:
      batch_size: 32
      epoch_time: '~8分钟'
      gpu_memory: '~8GB'
      utilization: 94%
      data_source: 'ML.md第267行'
  ```

### 2.5 规格一致性验证配置

#### 2.5.1 规格文档追踪配置
- **描述**: 规格文档追踪配置
- **默认值**: requirements.md+tech.md追踪
- **示例**: 
  ```yaml
  # 规格文档追踪配置
  specs_document_tracking:
    document_existence:
      command: |
        for doc in requirements.md tech.md; do
            [ -f "../$doc" ] && echo "✅ $doc 存在" || echo "❌ $doc 缺失"
        done
    
    key_specs_check:
      command: |
        python -c "
        from pathlib import Path
        specs = ['project定义', '性能目标', '框架选择', '模型架构']
        for spec in specs:
            content = Path('../requirements.md').read_text() + Path('../tech.md').read_text()
            if spec in content:
                print(f'✅ {spec} 已定义')
            else:
                print(f'❌ {spec} 缺失')
        "
  ```

#### 2.5.2 框架版本验证配置
- **描述**: 框架版本验证配置
- **默认值**: ML.md版本矩阵验证
- **示例**: 
  ```yaml
  # 框架版本验证配置
  framework_version_validation:
    ml_matrix_validation:
      command: |
        python -c "
        import torch, paddle
        print(f'PyTorch: {torch.__version__} (ML.md要求: 2.4.1)')
        print(f'PaddlePaddle: {paddle.__version__} (ML.md要求: 2.6.0)')
        print(f'Python: {torch.__import__('sys').version.split()[0]} (ML.md要求: 3.9-3.10)')
        "
  ```

### 2.6 质量检查配置
- **描述**: 质量检查配置
- **默认值**: 基础质量检查项
- **示例**: 
  ```yaml
  # 质量检查配置
  quality_check:
    six_stage_validation: true
    one_click_script: true
    performance_benchmark: true
    specs_document_integrity: true
    framework_version_compatibility: true
    gpu_utilization: '>90%'
  ```

### 2.7 技术约束配置
- **描述**: 技术约束配置
- **默认值**: GPU环境，CUDA 12.4+
- **示例**: 
  ```yaml
  # 技术约束配置
  technical_constraints:
    validation_environment: 'GPU环境，CUDA 12.4+'
    code_requirements: '高层API实现，≤200行约束'
    performance_standard: '1-epoch验证，GPU利用率>90%'
    specs_tracking: 'requirements.md+tech.md完整继承'
    automation: '一键验证，零人工干预'
  ```

### 2.8 错误处理配置

#### 2.8.1 常见错误模式配置
- **描述**: 常见错误模式配置
- **默认值**: 常见错误解决方案
- **示例**: 
  ```yaml
  # 常见错误模式配置
  common_error_patterns:
    cuda_oom:
      symptom: '内存不足'
      solution: 'batch_size过大，根据ML.md内存公式调整'
    
    import_failure:
      symptom: '导入失败'
      solution: '模块路径错误，检查PYTHONPATH设置'
    
    data_missing:
      symptom: '数据缺失'
      solution: '下载不完整，重新执行download脚本'
    
    version_conflict:
      symptom: '版本冲突'
      solution: '框架版本不匹配，按ML.md矩阵重新安装'
    
    performance_not_meeting:
      symptom: '性能不达标'
      solution: 'GPU利用率低，检查num_workers和pin_memory设置'
  ```

#### 2.8.2 自动修复机制配置
- **描述**: 自动修复机制配置
- **默认值**: 内存不足自动调整
- **示例**: 
  ```yaml
  # 自动修复机制配置
  auto_fix_mechanism:
    memory_auto_adjustment:
      command: |
        python -c "
        import torch
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        batch_size = int(gpu_memory * 0.8 / 0.5)  # ML.md内存公式
        print(f'推荐batch_size: {max(4, min(batch_size, 64))}')
        "
  ```

## 3. 执行示例

### 3.1 快速sprint集成示例

```bash
# 快速sprint集成命令
/sprint-plugin:快速sprint --validation debug

# 执行流程
1. 快速sprint插件读取DEBUG_CODE.md配置
2. 自动执行六阶段验证流程
3. 执行一键验证脚本
4. 验证性能基准
5. 检查规格一致性
6. 生成验证报告
```

## 4. 关键验证指标

- **环境兼容性**: Python 3.9-3.10，依赖完整
- **导入成功率**: 100%模块导入，零ImportError
- **数据完整性**: 数据集下载100%，格式正确
- **模型功能性**: 创建+前向传播无错误
- **训练稳定性**: 1-epoch完成，日志生成
- **性能达标**: GPU利用率>90%，时间符合ML.md基准

## 5. 下一步

验证完成后：
1. 查看DOCKER_CONFIG.md进行生产部署
2. 更新PROJECT_BUILD_LOG.md记录验证结果
3. 进入README.md 3.3节生产部署阶段

---
**验证时间**: ~10分钟 | **自动化程度**: 100% | **规格符合**: README.md 3.2.3节标准