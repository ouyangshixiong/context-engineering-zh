# VENV_CONFIG.md - GPU调试环境规范

> 基于README.md 3.2.2节，GPU环境+mini数据集配置

## 环境矩阵

| 组件 | 版本 | 验证命令 | 通过标准 | README.md引用 |
|------|------|----------|----------|---------------|
| Python | 3.9-3.10 | python --version | 版本匹配 | 3.2.2节 |
| PyTorch | 2.4.1 | torch.__version__ | CUDA自动适配 | 3.2.3节 |
| PaddlePaddle | 2.6.0 | paddle.__version__ | GPU编译通过 | 3.2.3节 |
| CUDA | 12.4.1 | torch.version.cuda | 驱动兼容 | 3.2.2节 |
| GPU显存 | ≥6GB | nvidia-smi | 内存检测 | 3.2.2节 |

## 一键安装

```bash
# 创建环境
python3.10 -m venv venv
source venv/bin/activate

# 安装依赖
pip install torch==2.4.1 torchvision==0.19.1 torchaudio==2.4.1
pip install paddlepaddle-gpu==2.6.0
pip install pytorch-lightning==2.0.0 omegaconf==2.3.0

# 验证
python -c "import torch, paddle; print(f'PyTorch: {torch.cuda.is_available()}\nPaddle: {paddle.is_compiled_with_cuda()}')"
```

## 性能基准

| GPU型号 | 显存 | 矩阵运算 | 内存使用 | 利用率 |
|---------|------|----------|----------|--------|
| RTX3060 | 12GB | ~0.002s | ~2GB | 95% |
| RTX4090 | 24GB | ~0.001s | ~4GB | 95% |
| A100 | 40GB | ~0.0008s | ~6GB | 94% |

## Mini数据集

```bash
# 下载
download.py --dataset coco128 --data_dir ./data/mini --mini-mode

# 验证结构
ls data/mini/coco128/{train2017,val2017,annotations}

# 可视化样本
python -c "
from src.datasets.coco_detection import COCODetection
dataset = COCODetection('./data/mini/coco128', 'train')
print(f'样本数: {len(dataset)}')
"
```

## 1-epoch验证

```bash
# 快速训练
train.py model=yolov10n data=coco128 trainer.max_epochs=1 trainer.fast_dev_run=true trainer.precision=16

# 验证结果
ls logs/lightning_logs/version_0/checkpoints/
```

## 内存计算

```python
# GPU内存需求评估
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
```

## 验证清单

- [ ] Python 3.9-3.10
- [ ] PyTorch CUDA自动适配
- [ ] PaddlePaddle GPU编译
- [ ] Mini数据集完整性
- [ ] 1-epoch训练成功
- [ ] GPU利用率>90%

## 错误处理

| 问题 | 症状 | 解决 |
|------|------|------|
| CUDA不匹配 | 版本错误 | 重装torch==2.4.1 |
| OOM | 内存不足 | batch_size减半 |
| 驱动过低 | CUDA错误 | 升级nvidia-driver-535 |

## 环境切换

```bash
# CPU→GPU
source venv/bin/activate
pip install -r requirements-gpu.txt
python -c "import torch; print(f'GPU: {torch.cuda.is_available()}')"
```

---
**配置时间**: 5分钟 | **验证时间**: 2分钟 | **GPU利用率**: >90%