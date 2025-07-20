#!/usr/bin/env python3
"""
模型评估脚本 - 使用OmegaConf配置系统
使用：python scripts/eval.py --config configs/config.yaml --checkpoint path/to/checkpoint.ckpt
"""

import argparse
from pathlib import Path
import torch
import pytorch_lightning as pl
from omegaconf import OmegaConf

def import_class(class_path):
    """从字符串路径导入类"""
    module_path, class_name = class_path.rsplit('.', 1)
    module = __import__(module_path, fromlist=[class_name])
    return getattr(module, class_name)

def main():
    parser = argparse.ArgumentParser(description="评估训练好的模型")
    parser.add_argument("--config", type=str, default="configs/config.yaml",
                       help="配置文件路径")
    parser.add_argument("--checkpoint", type=str, required=True,
                       help="模型检查点路径")
    parser.add_argument("--model", type=str, help="覆盖模型名称")
    parser.add_argument("--data", type=str, help="覆盖数据集名称")
    
    args = parser.parse_args()
    
    # 加载配置
    cfg = OmegaConf.load(args.config)
    
    # 命令行参数覆盖
    if args.model:
        cfg.model.name = args.model
    if args.data:
        cfg.data.name = args.data
    
    # 动态实例化模型
    model_class = import_class(f'src.models.pytorch.{cfg.model.name}_model')
    model = model_class.load_from_checkpoint(args.checkpoint, **cfg.model)
    
    # 动态实例化数据模块
    datamodule_class = import_class(f'src.datasets.datamodules.{cfg.data.name}_datamodule')
    datamodule = datamodule_class(**cfg.data)
    
    # 创建训练器
    trainer = pl.Trainer(**cfg.trainer)
    
    # 评估
    results = trainer.test(model, datamodule)
    print("评估结果:", results)

if __name__ == "__main__":
    main()