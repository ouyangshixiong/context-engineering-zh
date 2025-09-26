# DEPLOY.md - 生产部署技术规范

> 基于README.md 3.3.4节，容器化生产部署与监控

## 部署矩阵

| 部署阶段 | 关联Agent | 输入规范 | 输出标准 | 验证标准 |
|----------|-----------|----------|----------|----------|
| 模型优化 | 性能优化智能体 | 训练模型 | 优化模型配置 | 性能提升≥20% |
| 容器构建 | 部署编排智能体 | Dockerfile | 生产镜像 | 一键构建成功 |
| 性能验证 | 性能优化智能体 | 基准测试脚本 | 性能报告 | GPU利用率>90% |
| 生产发布 | 部署编排智能体 | 完整配置包 | 生产服务 | 99.9%可用性 |

## 模型优化

```bash
# INT8量化
optimize.py --checkpoint best.ckpt --method quantize --bits 8 --output yolov10_int8.onnx

# 剪枝压缩
optimize.py --checkpoint best.ckpt --method prune --sparsity 0.5 --output yolov10_pruned.pth

# 多格式导出
export.py --checkpoint best.ckpt --format onnx --output yolov10.onnx
export.py --checkpoint best.ckpt --format tensorrt --precision fp16 --output yolov10_fp16.trt
```

## 容器配置

```dockerfile
FROM nvidia/cuda:12.6-devel-ubuntu20.04
WORKDIR /app
COPY requirements-production.txt .
RUN pip3 install --no-cache-dir -r requirements-production.txt
COPY models/ src/ inference.py ./
ENV PYTHONPATH=/app CUDA_VISIBLE_DEVICES=0
EXPOSE 8000
CMD ["python3", "inference.py", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  yolov10-api:
    build: .
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    ports:
      - "8000:8000"
    volumes:
      - ./models:/app/models:ro
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 性能基准

| 指标 | 目标值 | 测试方法 | 数据来源 |
|------|--------|----------|----------|
| 推理延迟 | <100ms | 单张图片 | ML.md第274行 |
| 吞吐量 | >100FPS | 批量测试 | ML.md第275行 |
| GPU利用率 | >90% | nvidia-smi | ML.md第276行 |
| 内存使用 | <8GB | docker stats | ML.md第277行 |

## K8s部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: yolov10-deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: yolov10
        image: your-registry/yolov10:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
            nvidia.com/gpu: 1
          limits:
            memory: "4Gi"
            cpu: "2000m"
            nvidia.com/gpu: 1
```

## 一键部署

```bash
#!/bin/bash
# 模型优化
optimize.py --all

# 构建镜像
docker build -t yolov10:latest -f deploy/production/Dockerfile .

# 本地测试
docker-compose -f deploy/production/docker-compose.yml up --build -d
curl -f http://localhost:8000/health

# 生产发布
kubectl apply -f deploy/k8s/
```

## 监控配置

```python
# 监控端点
@app.get("/metrics")
async def metrics():
    return {
        "inference_count": inference_counter.value(),
        "avg_latency": latency_histogram.value(),
        "gpu_utilization": gpu_metrics.value(),
        "memory_usage": memory_metrics.value()
    }
```

## 验证清单

- [ ] 模型优化完成
- [ ] 容器构建成功
- [ ] 性能基准达标
- [ ] 健康检查配置
- [ ] 监控指标正常
- [ ] 资源限制设置

## 回滚策略

```bash
# Kubernetes回滚
kubectl rollout undo deployment/yolov10-deployment

# 版本切换
docker tag yolov10:latest yolov10:v1.0.0
docker run --rm -p 8000:8000 yolov10:v1.0.0
```

## 错误处理

| 问题 | 症状 | 解决方案 |
|------|------|----------|
| GPU OOM | 内存不足 | 减少batch_size或启用量化 |
| 网络超时 | 连接失败 | 检查负载均衡配置 |
| 模型加载慢 | 延迟高 | 使用模型缓存 |
| 推理延迟高 | 性能差 | 启用TensorRT优化 |

---
**部署时间**: 15分钟 | **验证时间**: 10分钟 | **可用性**: 99.9%