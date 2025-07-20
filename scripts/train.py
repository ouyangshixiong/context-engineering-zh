#!/usr/bin/env python3
"""
极简训练脚本 - 使用OmegaConf配置系统
一行命令训练：python scripts/train.py --config configs/config.yaml
"""

import argparse
from pathlib import Path
import torch
import pytorch_lightning as pl
from omegaconf import OmegaConf

# 动态导入模型和数据模块
def import_class(class_path):
    """从字符串路径导入类"""
    module_path, class_name = class_path.rsplit('.', 1)
    module = __import__(module_path, fromlist=[class_name])
    return getattr(module, class_name)

def main():
    parser = argparse.ArgumentParser(description="训练深度学习模型")
    parser.add_argument("--config", type=str, default="configs/config.yaml",
                       help="配置文件路径")
    parser.add_argument("--model", type=str, help="覆盖模型名称")
    parser.add_argument("--data", type=str, help="覆盖数据集名称")
    parser.add_argument("--epochs", type=int, help="覆盖训练轮数")
    
    args = parser.parse_args()
    
    # 加载配置
    cfg = OmegaConf.load(args.config)
    
    # 命令行参数覆盖
    if args.model:
        cfg.model.name = args.model
    if args.data:
        cfg.data.name = args.data
    if args.epochs:
        cfg.trainer.max_epochs = args.epochs
    
    # 设置随机种子
    pl.seed_everything(cfg.seed)
    
    # 动态实例化模型
    model_class = import_class(f'src.models.pytorch.{cfg.model.name}_model')
    model = model_class(**cfg.model)
    
    # 动态实例化数据模块
    datamodule_class = import_class(f'src.datasets.datamodules.{cfg.data.name}_datamodule')
    datamodule = datamodule_class(**cfg.data)
    
    # 创建训练器
    trainer = pl.Trainer(**cfg.trainer)
    
    # 训练
    trainer.fit(model, datamodule)
    
    # 测试
    trainer.test(model, datamodule)

if __name__ == "__main__":
    main()