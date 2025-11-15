# DOCKER_CONFIG.md - 生产部署技术规范

> 基于README.md 3.3节，容器化部署与GPU生产环境

## 部署矩阵

| 组件 | 版本 | 规格要求 | 验证标准 | README.md引用 |
|------|------|----------|----------|---------------|
| CUDA | 12.6 | GPU runtime | nvidia-smi通过 | 3.3.1节 |
| PyTorch | 2.4.1+cu12.6 | GPU生产版 | torch.cuda可用 | 3.3.2节 |
| PaddlePaddle | 2.6.0+gpu | GPU生产版 | paddle.is_compiled_with_cuda | 3.3.2节 |
| GPU显存 | ≥6GB | RTX3060+ | 内存检测通过 | 3.3节 |

## 一键部署

```bash
# 构建+运行
docker-compose -f deploy/docker-compose.yml up -d

# 验证
docker exec ml-project python -c "
import torch, paddle
print(f'PyTorch: {torch.__version__}')
print(f'CUDA: {torch.cuda.is_available()}')
print(f'Paddle: {paddle.__version__}')
"
```

## Dockerfile规范

```dockerfile
FROM nvidia/cuda:12.6.0-cudnn9-runtime-ubuntu22.04
WORKDIR /workspace
COPY requirements-gpu.txt .
RUN pip3 install --no-cache-dir -r requirements-gpu.txt
COPY . .
ENV PYTHONPATH=/workspace
ENV CUDA_VISIBLE_DEVICES=auto
EXPOSE 8888 6006 8000
CMD ["python", "scripts/serve.py"]
```

## Compose配置

```yaml
version: '3.8'
services:
  ml-project:
    build: .
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    volumes:
      - ./:/workspace
      - ./data:/workspace/data
      - ./logs:/workspace/logs
    ports:
      - "8888:8888"
      - "6006:6006"
      - "8000:8000"
```

## 性能基准

| GPU型号 | 显存 | Epoch时间 | GPU利用率 | Batch大小 |
|---------|------|-----------|-----------|-----------|
| RTX3060 | 12GB | ~45分钟 | >90% | 32 |
| RTX4090 | 24GB | ~25分钟 | >90% | 64 |
| A100 | 40GB | ~15分钟 | >90% | 128 |

## 验证清单

- [ ] nvidia-smi检测通过
- [ ] 镜像构建成功
- [ ] 容器启动正常
- [ ] GPU识别正确
- [ ] 多GPU支持验证
- [ ] GPU利用率>90%

## 技术约束

- **环境要求**: Docker 20.10+, nvidia-docker2
- **内存管理**: 自动GPU内存分配
- **性能标准**: GPU利用率>90%
- **部署时间**: 5分钟完成
- **监控端口**: 8888/6006/8000

## 多GPU配置

```bash
# 4GPU训练
docker run --gpus '"device=0,1,2,3"' -it ml-project bash
export CUDA_VISIBLE_DEVICES=0,1,2,3
export NCCL_DEBUG=INFO
```

## 错误处理

| 错误类型 | 症状 | 解决方案 |
|----------|------|----------|
| CUDA OOM | 内存不足 | batch_size减半 |
| NCCL错误 | 通信失败 | export NCCL_P2P_DISABLE=1 |
| 权限问题 | docker拒绝 | sudo usermod -aG docker $USER |

---
**部署时间**: 5分钟 | **GPU利用率**: >90% | **容器化**: 100%