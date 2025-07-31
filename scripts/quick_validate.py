#!/usr/bin/env python3
"""
快速数据集验证脚本
专为VENV调试阶段设计，确保在5分钟内完成数据集验证
"""

import os
import sys
import time
import yaml
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Any
import logging

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class QuickValidator:
    """快速数据集验证器"""
    
    def __init__(self, config_path: str, dataset_name: str):
        self.config_path = Path(config_path)
        self.dataset_name = dataset_name
        self.config = self.load_config()
        self.results = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "dataset": dataset_name,
            "config_path": str(self.config_path),
            "checks": {},
            "passed": True,
            "duration": 0
        }
    
    def load_config(self) -> Dict[str, Any]:
        """加载数据集配置"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            # 根据数据集名称获取配置
            if 'debug_datasets' in config and self.dataset_name in config['debug_datasets']:
                return config['debug_datasets'][self.dataset_name]
            elif 'production_datasets' in config and self.dataset_name in config['production_datasets']:
                return config['production_datasets'][self.dataset_name]
            else:
                raise ValueError(f"数据集 {self.dataset_name} 未在配置中找到")
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
            sys.exit(1)
    
    def check_directory_structure(self) -> bool:
        """检查目录结构"""
        logger.info("检查目录结构...")
        
        data_dir = Path(self.config['data_dir'])
        required_dirs = ['train', 'val']
        
        missing_dirs = []
        for dir_name in required_dirs:
            dir_path = data_dir / dir_name
            if not dir_path.exists():
                missing_dirs.append(str(dir_path))
        
        # COCO格式额外检查
        if self.config['dataset_type'] == 'COCODetection':
            annotations_dir = data_dir / 'annotations'
            if not annotations_dir.exists():
                missing_dirs.append(str(annotations_dir))
        
        if missing_dirs:
            logger.warning(f"缺失目录: {missing_dirs}")
            self.results["checks"]["directory_structure"] = {
                "status": "FAILED",
                "message": f"缺失目录: {missing_dirs}",
                "missing_dirs": missing_dirs
            }
            return False
        else:
            logger.success("✅ 目录结构完整")
            self.results["checks"]["directory_structure"] = {
                "status": "PASSED",
                "message": "所有必需目录存在"
            }
            return True
    
    def check_file_count(self) -> bool:
        """检查文件数量"""
        logger.info("检查文件数量...")
        
        data_dir = Path(self.config['data_dir'])
        
        # 检查训练集
        train_dir = data_dir / 'train'
        if train_dir.exists():
            train_images = list(train_dir.glob('*.jpg')) + list(train_dir.glob('*.png'))
            actual_count = len(train_images)
            expected_count = self.config.get('max_train_samples', self.config.get('num_samples', 100))
            
            if actual_count >= min(expected_count * 0.8, expected_count - 5):
                logger.success(f"✅ 训练集文件数量正常: {actual_count}")
                self.results["checks"]["train_file_count"] = {
                    "status": "PASSED",
                    "actual": actual_count,
                    "expected": expected_count
                }
                return True
            else:
                logger.warning(f"训练集文件数量不足: {actual_count} < {expected_count}")
                self.results["checks"]["train_file_count"] = {
                    "status": "FAILED",
                    "actual": actual_count,
                    "expected": expected_count,
                    "message": "训练集文件数量不足"
                }
                return False
        else:
            logger.error("训练集目录不存在")
            return False
    
    def check_image_files(self) -> bool:
        """检查图像文件可读性"""
        logger.info("检查图像文件可读性...")
        
        data_dir = Path(self.config['data_dir'])
        train_dir = data_dir / 'train'
        
        if not train_dir.exists():
            return False
        
        # 随机检查前5个图像文件
        image_files = list(train_dir.glob('*.jpg'))[:5] + list(train_dir.glob('*.png'))[:5]
        failed_files = []
        
        try:
            from PIL import Image
            for img_file in image_files:
                try:
                    with Image.open(img_file) as img:
                        img.verify()
                except Exception as e:
                    failed_files.append(str(img_file))
        except ImportError:
            logger.warning("PIL未安装，跳过图像验证")
            self.results["checks"]["image_files"] = {
                "status": "SKIPPED",
                "message": "PIL未安装，跳过图像验证"
            }
            return True
        
        if failed_files:
            logger.warning(f"损坏的图像文件: {failed_files}")
            self.results["checks"]["image_files"] = {
                "status": "FAILED",
                "message": f"{len(failed_files)}个图像文件损坏",
                "failed_files": failed_files
            }
            return False
        else:
            logger.success("✅ 所有图像文件可读")
            self.results["checks"]["image_files"] = {
                "status": "PASSED",
                "message": "所有图像文件可读"
            }
            return True
    
    def check_annotations(self) -> bool:
        """检查标注文件"""
        logger.info("检查标注文件...")
        
        data_dir = Path(self.config['data_dir'])
        
        if self.config['dataset_type'] == 'COCODetection':
            annot_file = data_dir / 'annotations' / 'instances_train2017.json'
            if annot_file.exists():
                try:
                    with open(annot_file, 'r') as f:
                        annot_data = json.load(f)
                    
                    # 检查基本结构
                    required_keys = ['images', 'annotations', 'categories']
                    missing_keys = [key for key in required_keys if key not in annot_data]
                    
                    if missing_keys:
                        logger.warning(f"标注文件缺失键: {missing_keys}")
                        self.results["checks"]["annotations"] = {
                            "status": "FAILED",
                            "message": f"标注文件缺失键: {missing_keys}"
                        }
                        return False
                    else:
                        logger.success("✅ 标注文件格式正确")
                        self.results["checks"]["annotations"] = {
                            "status": "PASSED",
                            "message": "标注文件格式正确",
                            "num_images": len(annot_data['images']),
                            "num_annotations": len(annot_data['annotations']),
                            "num_categories": len(annot_data['categories'])
                        }
                        return True
                        
                except Exception as e:
                    logger.error(f"标注文件读取失败: {e}")
                    return False
            else:
                logger.warning("标注文件不存在")
                return True  # 对于非COCO格式，跳过此检查
        
        return True
    
    def check_memory_usage(self) -> bool:
        """检查内存使用"""
        logger.info("检查内存使用...")
        
        try:
            import psutil
            
            # 检查数据集目录大小
            data_dir = Path(self.config['data_dir'])
            if data_dir.exists():
                total_size = sum(f.stat().st_size for f in data_dir.rglob('*') if f.is_file())
                total_size_mb = total_size / (1024 * 1024)
                
                # 获取可用内存
                memory = psutil.virtual_memory()
                available_memory = memory.available / (1024 * 1024 * 1024)
                
                logger.success(f"数据集大小: {total_size_mb:.1f}MB, 可用内存: {available_memory:.1f}GB")
                
                self.results["checks"]["memory_usage"] = {
                    "status": "PASSED",
                    "dataset_size_mb": round(total_size_mb, 1),
                    "available_memory_gb": round(available_memory, 1)
                }
                return True
            else:
                logger.warning("数据集目录不存在")
                return False
                
        except ImportError:
            logger.warning("psutil未安装，跳过内存检查")
            self.results["checks"]["memory_usage"] = {
                "status": "SKIPPED",
                "message": "psutil未安装，跳过内存检查"
            }
            return True
    
    def run_all_checks(self) -> Dict[str, Any]:
        """运行所有检查"""
        start_time = time.time()
        
        logger.info(f"开始验证数据集: {self.dataset_name}")
        logger.info(f"数据目录: {self.config['data_dir']}")
        
        # 运行各项检查
        checks = [
            ("directory_structure", self.check_directory_structure),
            ("file_count", self.check_file_count),
            ("image_files", self.check_image_files),
            ("annotations", self.check_annotations),
            ("memory_usage", self.check_memory_usage)
        ]
        
        passed_checks = 0
        total_checks = len(checks)
        
        for name, check_func in checks:
            try:
                if check_func():
                    passed_checks += 1
                else:
                    self.results["passed"] = False
            except Exception as e:
                logger.error(f"检查 {name} 失败: {e}")
                self.results["checks"][name] = {
                    "status": "ERROR",
                    "message": str(e)
                }
                self.results["passed"] = False
        
        # 计算耗时
        end_time = time.time()
        self.results["duration"] = round(end_time - start_time, 2)
        
        # 生成报告
        self.generate_report()
        
        return self.results
    
    def generate_report(self):
        """生成验证报告"""
        report_path = Path("outputs") / f"dataset_validation_{self.dataset_name}.json"
        report_path.parent.mkdir(exist_ok=True)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        # 控制台输出摘要
        logger.info("=" * 50)
        logger.info("📊 验证结果摘要")
        logger.info("=" * 50)
        
        if self.results["passed"]:
            logger.success("✅ 所有检查通过！")
        else:
            logger.error("❌ 部分检查失败")
        
        logger.info(f"检查耗时: {self.results['duration']}秒")
        logger.info(f"详细报告: {report_path}")
        
        # 显示失败项
        failed_checks = [
            name for name, check in self.results["checks"].items()
            if check["status"] in ["FAILED", "ERROR"]
        ]
        
        if failed_checks:
            logger.warning(f"失败项: {failed_checks}")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="快速数据集验证工具")
    parser.add_argument("--config", type=str, default="configs/data/debug_datasets.yaml",
                       help="配置文件路径")
    parser.add_argument("--dataset", type=str, default="coco128",
                       help="数据集名称")
    parser.add_argument("--stage", type=str, choices=["debug", "production"], 
                       default="debug", help="验证阶段")
    parser.add_argument("--verbose", action="store_true", help="详细输出")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # 根据阶段选择默认配置
    if args.stage == "debug":
        config_path = "configs/data/debug_datasets.yaml"
    else:
        config_path = "configs/data/production_datasets.yaml"
    
    if args.config != "configs/data/debug_datasets.yaml":
        config_path = args.config
    
    validator = QuickValidator(config_path, args.dataset)
    results = validator.run_all_checks()
    
    # 退出码
    sys.exit(0 if results["passed"] else 1)

if __name__ == "__main__":
    main()