"""
智能数据集选择器
根据运行环境自动选择合适的调试或生产数据集
"""

import os
import torch
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class DatasetSelector:
    """智能数据集选择器，根据环境自动选择合适的数据集"""
    
    def __init__(self, config_dir: str = "configs/data"):
        self.config_dir = Path(config_dir)
        self.debug_config = self.config_dir / "debug_datasets.yaml"
        self.prod_config = self.config_dir / "production_datasets.yaml"
        
    def get_environment_info(self) -> Dict[str, Any]:
        """获取当前运行环境信息"""
        info = {
            "cuda_available": torch.cuda.is_available(),
            "device_count": 0,
            "gpu_memory": {},
            "cpu_count": os.cpu_count(),
            "memory_available": None,
        }
        
        if info["cuda_available"]:
            info["device_count"] = torch.cuda.device_count()
            for i in range(info["device_count"]):
                props = torch.cuda.get_device_properties(i)
                info["gpu_memory"][f"gpu_{i}"] = {
                    "name": props.name,
                    "total_memory_gb": props.total_memory / 1024**3,
                    "memory_gb": round(props.total_memory / 1024**3, 1)
                }
        
        # 获取可用内存（近似）
        try:
            import psutil
            memory = psutil.virtual_memory()
            info["memory_available"] = memory.available / 1024**3
        except ImportError:
            info["memory_available"] = 8.0  # 默认值
            
        return info
    
    def select_dataset_config(self) -> str:
        """根据环境信息选择合适的数据集配置"""
        env_info = self.get_environment_info()
        
        logger.info(f"环境信息: {env_info}")
        
        # 决策逻辑
        if not env_info["cuda_available"]:
            # CPU环境：强制使用调试数据集
            logger.info("CPU环境检测，使用调试数据集")
            return str(self.debug_config)
        
        # GPU环境：根据显存大小选择
        gpu_memory = list(env_info["gpu_memory"].values())[0]["memory_gb"]
        
        if gpu_memory < 8:
            # 小显存：使用调试数据集
            logger.info(f"小显存GPU({gpu_memory}GB)，使用调试数据集")
            return str(self.debug_config)
        elif gpu_memory < 16:
            # 中等显存：使用生产数据集，但限制batch size
            logger.info(f"中等显存GPU({gpu_memory}GB)，使用生产数据集(保守配置)")
            return str(self.prod_config)
        else:
            # 大显存：使用生产数据集，完整配置
            logger.info(f"大显存GPU({gpu_memory}GB)，使用生产数据集(完整配置)")
            return str(self.prod_config)
    
    def get_recommended_batch_size(self, dataset_name: str) -> int:
        """根据GPU内存推荐合适的batch size"""
        env_info = self.get_environment_info()
        
        if not env_info["cuda_available"]:
            return 4  # CPU环境小batch
        
        gpu_memory = list(env_info["gpu_memory"].values())[0]["memory_gb"]
        
        # 基于数据集和显存的batch size映射
        batch_size_map = {
            "coco128": {8: 16, 16: 32, 24: 64},
            "coco2017": {8: 16, 16: 32, 24: 64, 48: 128},
            "imagenet": {8: 64, 16: 128, 24: 256, 48: 512},
            "cifar10": {8: 128, 16: 256, 24: 512},
            "tiny_imagenet": {8: 64, 16: 128, 24: 256},
            "openimages": {8: 8, 16: 16, 24: 32, 48: 64}
        }
        
        if dataset_name in batch_size_map:
            # 找到最适合的显存档位
            memory_keys = sorted(batch_size_map[dataset_name].keys())
            for mem_key in memory_keys:
                if gpu_memory >= mem_key:
                    return batch_size_map[dataset_name][mem_key]
        
        # 默认保守值
        return min(16, int(gpu_memory * 2))
    
    def load_dataset_config(self, config_path: str) -> Dict[str, Any]:
        """加载数据集配置文件"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            return config
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
            return {}
    
    def get_dataset_info(self, dataset_name: str, stage: str = "auto") -> Dict[str, Any]:
        """获取指定数据集的详细信息"""
        if stage == "auto":
            config_path = self.select_dataset_config()
        elif stage == "debug":
            config_path = str(self.debug_config)
        elif stage == "production":
            config_path = str(self.prod_config)
        else:
            raise ValueError(f"不支持的stage: {stage}")
        
        config = self.load_dataset_config(config_path)
        
        # 根据配置类型提取对应数据集信息
        if "debug_datasets" in config and dataset_name in config["debug_datasets"]:
            dataset_info = config["debug_datasets"][dataset_name]
        elif "production_datasets" in config and dataset_name in config["production_datasets"]:
            dataset_info = config["production_datasets"][dataset_name]
        else:
            raise ValueError(f"数据集 {dataset_name} 未在配置中找到")
        
        # 添加推荐的batch size
        dataset_info["recommended_batch_size"] = self.get_recommended_batch_size(dataset_name)
        dataset_info["config_path"] = config_path
        dataset_info["stage"] = "debug" if "debug" in config_path else "production"
        
        return dataset_info
    
    def print_environment_summary(self):
        """打印环境摘要"""
        env_info = self.get_environment_info()
        
        print("=" * 50)
        print("🖥️  环境信息摘要")
        print("=" * 50)
        
        print(f"CUDA可用: {env_info['cuda_available']}")
        print(f"CPU核心数: {env_info['cpu_count']}")
        print(f"可用内存: {env_info['memory_available']:.1f}GB")
        
        if env_info['cuda_available']:
            print(f"GPU数量: {env_info['device_count']}")
            for gpu_key, gpu_info in env_info['gpu_memory'].items():
                print(f"  {gpu_info['name']}: {gpu_info['memory_gb']}GB")
        
        selected_config = self.select_dataset_config()
        print(f"选择的数据集配置: {Path(selected_config).name}")
        print("=" * 50)

# 快捷使用函数
def get_dataset_config(dataset_name: str = None, stage: str = "auto") -> Dict[str, Any]:
    """获取数据集配置的快捷函数"""
    selector = DatasetSelector()
    
    if dataset_name is None:
        # 返回配置路径
        return {"config_path": selector.select_dataset_config()}
    
    return selector.get_dataset_info(dataset_name, stage)

def auto_setup_dataset():
    """自动设置数据集"""
    selector = DatasetSelector()
    config_path = selector.select_dataset_config()
    
    print(f"自动选择的数据集配置: {config_path}")
    selector.print_environment_summary()
    
    return config_path

if __name__ == "__main__":
    # 命令行使用
    import argparse
    
    parser = argparse.ArgumentParser(description="智能数据集选择器")
    parser.add_argument("--dataset", type=str, help="数据集名称")
    parser.add_argument("--stage", type=str, choices=["auto", "debug", "production"], 
                       default="auto", help="选择阶段")
    parser.add_argument("--info", action="store_true", help="显示环境信息")
    
    args = parser.parse_args()
    
    selector = DatasetSelector()
    
    if args.info:
        selector.print_environment_summary()
    
    if args.dataset:
        info = selector.get_dataset_info(args.dataset, args.stage)
        print("\n📊 数据集信息:")
        print(f"名称: {info['name']}")
        print(f"类型: {info['dataset_type']}")
        print(f"描述: {info['description']}")
        print(f"样本数: {info['num_samples']}")
        print(f"推荐batch_size: {info['recommended_batch_size']}")
        print(f"配置路径: {info['config_path']}")
        print(f"阶段: {info['stage']}")
    else:
        config_path = selector.select_dataset_config()
        print(f"\n选择的数据集配置: {config_path}")