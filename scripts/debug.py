#!/usr/bin/env python3
"""
调试脚本 - 支持人工调试阶段
一键运行所有调试检查
"""

import os
import sys
import subprocess
import importlib
from pathlib import Path

def check_import(module_path):
    """检查模块导入"""
    try:
        importlib.import_module(module_path)
        print(f"✓ {module_path} 导入成功")
        return True
    except ImportError as e:
        print(f"✗ {module_path} 导入失败: {e}")
        return False

def check_gpu():
    """检查GPU可用性"""
    try:
        import torch
        if torch.cuda.is_available():
            print(f"✓ GPU可用: {torch.cuda.get_device_name()}")
            return True
        else:
            print("- 无GPU，使用CPU")
            return False
    except ImportError:
        print("✗ PyTorch未安装")
        return False

def check_data_download(data_dir="./test_data"):
    """检查数据集下载"""
    data_path = Path(data_dir)
    if data_path.exists() and any(data_path.iterdir()):
        print(f"✓ 数据集目录已存在: {data_dir}")
        return True
    else:
        print(f"- 需要下载数据集到: {data_dir}")
        return False

def run_debug_checks():
    """运行所有调试检查"""
    print("🔍 开始调试检查...")
    print("-" * 50)
    
    # 1. 基础导入检查
    print("\n1. 基础导入检查:")
    check_import("torch")
    check_import("pytorch_lightning")
    check_import("torchvision")
    
    # 2. 项目模块检查
    print("\n2. 项目模块检查:")
    module_checks = [
        "src.models.pytorch.resnet_classifier",
        "src.datasets.datamodules.cifar10_datamodule"
    ]
    
    for module in module_checks:
        check_import(module)
    
    # 3. GPU检查
    print("\n3. GPU检查:")
    check_gpu()
    
    # 4. 数据集检查
    print("\n4. 数据集检查:")
    check_data_download()
    
    # 5. 环境信息
    print("\n5. 环境信息:")
    try:
        import torch
        print(f"PyTorch版本: {torch.__version__}")
    except ImportError:
        print("PyTorch未安装")
    
    print("\n" + "=" * 50)
    print("调试检查完成！")
    print("下一步建议:")
    print("- 运行: python scripts/download.py --datasets cifar10")
    print("- 运行: python scripts/train.py model=resnet18 data=cifar10 trainer.fast_dev_run=true")

if __name__ == "__main__":
    run_debug_checks()