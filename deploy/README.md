# CNN可视化教学项目 - Docker部署指南

## 🚀 快速开始

### CPU版本部署
```bash
# 构建镜像
docker build -t cnn-tutorial:cpu -f deploy/cpu/Dockerfile .

# 或者使用工具脚本
./deploy/shared/docker-utils.sh build-cpu

# 启动服务
docker-compose -f deploy/cpu/docker-compose.yml up -d

# 访问 Jupyter Lab
# 打开浏览器访问: http://localhost:8888
```

### GPU版本部署
```bash
# 构建镜像
docker build -t cnn-tutorial:gpu -f deploy/gpu/Dockerfile .

# 或者使用工具脚本
./deploy/shared/docker-utils.sh build-gpu

# 启动服务（需要NVIDIA Docker运行时）
docker-compose -f deploy/gpu/docker-compose.yml up -d

# 访问 Jupyter Lab
# 打开浏览器访问: http://localhost:8888
```

## 📂 目录结构

```
deploy/
├── cpu/
│   ├── Dockerfile           # CPU版本Docker镜像
│   ├── docker-compose.yml   # CPU版本服务配置
│   └── .env.example         # CPU环境变量示例
├── gpu/
│   ├── Dockerfile           # GPU版本Docker镜像
│   ├── docker-compose.yml   # GPU版本服务配置
│   └── .env.example         # GPU环境变量示例
├── shared/
│   ├── entrypoint.sh        # 容器启动脚本
│   └── docker-utils.sh      # Docker管理工具
└── README.md               # 本文件
```

## 🛠️ 系统要求

### CPU版本
- Docker Engine 20.10+
- 内存: 最少2GB，推荐4GB+
- 存储: 最少5GB可用空间

### GPU版本
- Docker Engine 20.10+
- NVIDIA Docker运行时
- NVIDIA GPU驱动 450.80.02+
- CUDA 11.8兼容性
- 内存: 最少8GB，推荐16GB+
- 存储: 最少10GB可用空间

## 🔧 安装指南

### 1. 安装Docker

#### Ubuntu/Debian
```bash
# 卸载旧版本
sudo apt-get remove docker docker-engine docker.io containerd runc

# 安装依赖
sudo apt-get update
sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加Docker官方GPG密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

#### CentOS/RHEL
```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加Docker仓库
sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

# 安装Docker
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 2. 安装NVIDIA Docker运行时（仅GPU版本需要）

```bash
# 添加NVIDIA Docker仓库
distribution=$(. /etc/os-release;echo $ID$VERSION_ID) \
   && curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add - \
   && curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

# 安装NVIDIA Docker
sudo apt-get update
sudo apt-get install -y nvidia-docker2

# 重启Docker
sudo systemctl restart docker
```

## 🎯 使用工具脚本

我们提供了一个方便的Docker管理工具脚本：

```bash
# 显示帮助
./deploy/shared/docker-utils.sh help

# 构建镜像
./deploy/shared/docker-utils.sh build-cpu    # 构建CPU版本
./deploy/shared/docker-utils.sh build-gpu    # 构建GPU版本

# 启动服务
./deploy/shared/docker-utils.sh start-cpu    # 启动CPU版本
./deploy/shared/docker-utils.sh start-gpu    # 启动GPU版本

# 管理容器
./deploy/shared/docker-utils.sh status       # 查看状态
./deploy/shared/docker-utils.sh logs cpu     # 查看CPU容器日志
./deploy/shared/docker-utils.sh logs gpu     # 查看GPU容器日志
./deploy/shared/docker-utils.sh shell cpu    # 进入CPU容器shell
./deploy/shared/docker-utils.sh shell gpu    # 进入GPU容器shell

# 停止服务
./deploy/shared/docker-utils.sh stop         # 停止所有容器

# 运行健康检查
./deploy/shared/docker-utils.sh test cpu     # 检查CPU环境
./deploy/shared/docker-utils.sh test gpu     # 检查GPU环境

# 清理资源
./deploy/shared/docker-utils.sh clean        # 清理Docker资源
```

## 🔍 验证安装

### 检查CPU版本
```bash
# 运行健康检查
./deploy/shared/docker-utils.sh test cpu

# 预期输出：
# ✅ PyTorch版本: 2.1.0+cpu
# ✅ PaddlePaddle版本: 2.5.0
# 💻 使用CPU模式
```

### 检查GPU版本
```bash
# 运行健康检查
./deploy/shared/docker-utils.sh test gpu

# 预期输出：
# ✅ PyTorch版本: 2.1.0+cu118
# ✅ PaddlePaddle版本: 2.5.0.post118
# ✅ CUDA可用，GPU数量: 1
```

## 🔧 环境变量配置

### CPU版本
复制环境变量示例文件：
```bash
cp deploy/cpu/.env.example deploy/cpu/.env
# 编辑deploy/cpu/.env文件以自定义配置
```

### GPU版本
复制环境变量示例文件：
```bash
cp deploy/gpu/.env.example deploy/gpu/.env
# 编辑deploy/gpu/.env文件以自定义配置
```

## 📋 常见问题

### 1. 端口冲突
如果端口8888已被占用，可以修改docker-compose.yml文件：
```yaml
ports:
  - "8889:8888"  # 改为其他端口
```

### 2. 权限问题
如果遇到权限问题，可以尝试：
```bash
sudo chown -R $USER:$USER .
```

### 3. GPU不可用
检查NVIDIA驱动和Docker运行时：
```bash
# 检查NVIDIA驱动
nvidia-smi

# 检查Docker运行时
docker run --rm --gpus all nvidia/cuda:11.8-base-ubuntu20.04 nvidia-smi
```

### 4. 内存不足
如果遇到内存不足错误：
- 减少Jupyter的内存使用
- 在docker-compose.yml中添加内存限制：
```yaml
deploy:
  resources:
    limits:
      memory: 4G
```

### 5. 构建失败
如果镜像构建失败：
- 检查网络连接
- 清理Docker缓存：
```bash
docker system prune -a
```

## 🐛 故障排除

### 查看容器日志
```bash
# CPU版本
docker-compose -f deploy/cpu/docker-compose.yml logs

# GPU版本
docker-compose -f deploy/gpu/docker-compose.yml logs
```

### 进入容器调试
```bash
# CPU版本
docker-compose -f deploy/cpu/docker-compose.yml exec cnn-cpu /bin/bash

# GPU版本
docker-compose -f deploy/gpu/docker-compose.yml exec cnn-gpu /bin/bash
```

### 检查容器状态
```bash
docker ps -a | grep cnn-tutorial
```

## 📊 性能优化

### CPU优化
- 使用Intel MKL优化：设置环境变量`MKL_NUM_THREADS`
- 限制线程数：设置`OMP_NUM_THREADS`

### GPU优化
- 设置GPU内存增长：`export TF_FORCE_GPU_ALLOW_GROWTH=true`
- 限制GPU内存使用：设置`CUDA_VISIBLE_DEVICES`

## 🔗 相关链接

- [Docker官方文档](https://docs.docker.com/)
- [NVIDIA Docker运行时文档](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/index.html)
- [PyTorch Docker镜像](https://hub.docker.com/r/pytorch/pytorch)
- [PaddlePaddle Docker镜像](https://hub.docker.com/r/paddlepaddle/paddle)

## 📞 支持

如有问题，请：
1. 检查本README中的故障排除部分
2. 查看容器日志
3. 提交Issue到项目仓库