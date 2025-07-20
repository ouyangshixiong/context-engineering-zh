#!/usr/bin/env python3
"""
数据集下载脚本 - 支持调试参数
极简实现，一行代码下载
"""

import argparse
import os
from pathlib import Path

def download_dataset(name: str, data_dir: str = "./data"):
    """下载指定数据集"""
    data_path = Path(data_dir)
    data_path.mkdir(parents=True, exist_ok=True)
    
    # 使用高层API自动下载
    if name.lower() == "cifar10":
        try:
            import torchvision.datasets as datasets
            datasets.CIFAR10(data_path, train=True, download=True)
            datasets.CIFAR10(data_path, train=False, download=True)
            print(f"✓ CIFAR-10 下载完成: {data_path}/cifar-10-batches-py")
        except ImportError:
            print("✗ torchvision 未安装")
    
    elif name.lower() == "mnist":
        try:
            import torchvision.datasets as datasets
            datasets.MNIST(data_path, train=True, download=True)
            datasets.MNIST(data_path, train=False, download=True)
            print(f"✓ MNIST 下载完成: {data_path}/MNIST")
        except ImportError:
            print("✗ torchvision 未安装")
    
    elif name.lower() == "cifar100":
        try:
            import torchvision.datasets as datasets
            datasets.CIFAR100(data_path, train=True, download=True)
            datasets.CIFAR100(data_path, train=False, download=True)
            print(f"✓ CIFAR-100 下载完成: {data_path}/cifar-100-python")
        except ImportError:
            print("✗ torchvision 未安装")
    
    else:
        print(f"✗ 不支持的数据集: {name}")

def main():
    parser = argparse.ArgumentParser(description="数据集下载器")
    parser.add_argument(
        "--datasets", 
        type=str, 
        default="cifar10",
        help="要下载的数据集，用逗号分隔 (cifar10,mnist,cifar100)"
    )
    parser.add_argument(
        "--data_dir", 
        type=str, 
        default="./data",
        help="数据保存目录"
    )
    
    args = parser.parse_args()
    
    datasets = [d.strip() for d in args.datasets.split(",")]
    
    print("🚀 开始下载数据集...")
    for dataset in datasets:
        print(f"\n正在下载: {dataset}")
        download_dataset(dataset, args.data_dir)
    
    print(f"\n✅ 所有数据集下载完成！")
    print(f"数据目录: {os.path.abspath(args.data_dir)}")

if __name__ == "__main__":
    main()