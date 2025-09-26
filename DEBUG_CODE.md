# DEBUG_CODE.md - 代码验证技术规范

> 基于README.md 3.2.3节1-epoch验证规范，系统化验证代码正确性和可用性

## 六阶段验证流程

```
环境检查 → 导入测试 → 数据集验证 → 模型验证 → 训练测试 → 结果验证
```

## 阶段验证矩阵

| 验证阶段 | 关键检查 | 执行命令 | 通过标准 | README.md引用 |
|----------|----------|----------|----------|---------------|
| **环境检查** | Python版本/依赖 | `python --version` | 3.9-3.10，依赖完整 | 3.2.2节 |
| **导入测试** | 模块/类导入 | `python -c "import src.models"` | 零ImportError | 3.2.3节 |
| **数据集验证** | 数据下载/加载 | `python scripts/download.py` | 数据完整性100% | 3.2.2节 |
| **模型验证** | 模型创建/前向 | `python -c "model = YOLOv10"` | 参数计算正确 | 3.2.3节 |
| **训练测试** | 1-epoch训练 | `python scripts/train.py` | 日志生成，无错误 | 3.2.3节 |
| **结果验证** | 指标检查 | `python -c "pd.read_csv('metrics.csv')"` | 损失下降，指标正常 | 3.2.3节 |

## 关键验证脚本

### 1. 环境验证
```bash
# Python版本检查
python --version  # 期望: 3.9-3.10

# 依赖完整性验证
python -c "import torch, paddle, pytorch_lightning; print('框架依赖OK')"

# GPU可用性检查
python -c "import torch; print(f'CUDA可用: {torch.cuda.is_available()}')"
```

### 2. 导入验证
```bash
# 核心模块导入测试
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

### 3. 数据集验证
```bash
# Mini数据集下载
python scripts/download.py --dataset coco128 --data_dir ./data/mini

# 数据完整性验证
python -c "
from pathlib import Path
data_dir = Path('./data/mini/coco128')
required = ['train2017', 'val2017', 'annotations']
for item in required:
    assert (data_dir / item).exists(), f'{item} 缺失'
print('✅ 数据集完整性验证通过')
"
```

### 4. 模型验证
```bash
# 模型创建测试
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

### 5. 训练验证
```bash
# 1-epoch快速训练
python scripts/train.py \
  model=yolov10n \
  data=coco128 \
  trainer.max_epochs=1 \
  trainer.fast_dev_run=true \
  trainer.precision=16

# 验证训练结果
ls -la logs/lightning_logs/version_0/checkpoints/
```

### 6. 性能基准
```bash
# GPU性能测试
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

## 一键验证脚本

```bash
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

## 性能基准矩阵

| 数据集 | Batch Size | Epoch时间 | GPU内存 | 利用率 | 数据来源 |
|--------|------------|-----------|---------|--------|----------|
| CIFAR-10 | 32 | ~8秒 | ~2GB | 95% | ML.md第266行 |
| COCO128 | 32 | ~45秒 | ~4GB | 95% | ML.md第267行 |
| ImageNet | 32 | ~8分钟 | ~8GB | 94% | ML.md第267行 |

## 规格一致性验证

### requirements.md+tech.md追踪
```bash
# 验证规格文档存在
for doc in requirements.md tech.md; do
    [ -f "../$doc" ] && echo "✅ $doc 存在" || echo "❌ $doc 缺失"
done

# 关键规格字段检查
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

### 框架版本验证
```bash
# ML.md版本矩阵验证
python -c "
import torch, paddle
print(f'PyTorch: {torch.__version__} (ML.md要求: 2.4.1)')
print(f'PaddlePaddle: {paddle.__version__} (ML.md要求: 2.6.0)')
print(f'Python: {torch.__import__('sys').version.split()[0]} (ML.md要求: 3.9-3.10)')
"
```

## 关键验证指标

- **环境兼容性**: Python 3.9-3.10，依赖完整
- **导入成功率**: 100%模块导入，零ImportError
- **数据完整性**: 数据集下载100%，格式正确
- **模型功能性**: 创建+前向传播无错误
- **训练稳定性**: 1-epoch完成，日志生成
- **性能达标**: GPU利用率>90%，时间符合ML.md基准

## 质量检查

- [ ] 六阶段验证流程全部通过
- [ ] 一键验证脚本执行成功
- [ ] 性能基准符合ML.md标准数据
- [ ] 规格文档完整性验证通过
- [ ] 框架版本兼容性确认
- [ ] GPU利用率达到>90%目标

## 技术约束

- **验证环境**: GPU环境，CUDA 12.4+
- **代码要求**: 高层API实现，≤200行约束
- **性能标准**: 1-epoch验证，GPU利用率>90%
- **规格追踪**: requirements.md+tech.md完整继承
- **自动化**: 一键验证，零人工干预

## 错误处理

### 常见错误模式
- **CUDA OOM**: batch_size过大，根据ML.md内存公式调整
- **导入失败**: 模块路径错误，检查PYTHONPATH设置
- **数据缺失**: 下载不完整，重新执行download脚本
- **版本冲突**: 框架版本不匹配，按ML.md矩阵重新安装
- **性能不达标**: GPU利用率低，检查num_workers和pin_memory设置

### 自动修复机制
```bash
# 内存不足自动调整
python -c "
import torch
gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
batch_size = int(gpu_memory * 0.8 / 0.5)  # ML.md内存公式
print(f'推荐batch_size: {max(4, min(batch_size, 64))}')
"
```

## 下一步

验证完成后：
1. 查看DOCKER_CONFIG.md进行生产部署
2. 更新PROJECT_BUILD_LOG.md记录验证结果
3. 进入README.md 3.3节生产部署阶段

---
**验证时间**: ~10分钟 | **自动化程度**: 100% | **规格符合**: README.md 3.2.3节标准