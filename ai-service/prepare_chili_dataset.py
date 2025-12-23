"""
Chili Dataset Preparation Script
Converts YOLO object detection format to classification folder structure
for use with ImageDataGenerator in the Govi Isuru Platform
"""

import os
import shutil
from pathlib import Path
from collections import defaultdict

# Configuration
SOURCE_PATH = "../chili dataset"
DEST_PATH = "chili_dataset"

# Class mapping (extracted from image filenames)
# bercak_daun = Leaf Spot Disease
# sehat = Healthy
# thrips = Thrips Pest Damage
# virus_kuning = Yellow Virus Disease
CLASS_MAPPING = {
    "bercak_daun": "Leaf Spot",
    "sehat": "Healthy",
    "thrips": "Thrips Damage",
    "virus_kuning": "Yellow Virus"
}

def extract_class_from_filename(filename):
    """Extract the disease class from YOLO-format filename"""
    # Filenames are like: bercak_daun-13-_jpg.rf.xxx.jpg
    # Split by '-' and take the first part
    parts = filename.split('-')
    if parts:
        raw_class = parts[0].lower()
        return CLASS_MAPPING.get(raw_class, raw_class)
    return None

def organize_dataset():
    """Organize the YOLO dataset into classification folder structure"""
    print("=" * 60)
    print("🌶️ Chili Dataset Preparation")
    print("=" * 60)
    
    splits = ["train", "valid", "test"]
    stats = defaultdict(lambda: defaultdict(int))
    
    for split in splits:
        source_images = Path(SOURCE_PATH) / split / "images"
        
        if not source_images.exists():
            print(f"⚠️ Source folder not found: {source_images}")
            continue
        
        print(f"\n📁 Processing {split} split...")
        
        # Get all image files
        image_files = list(source_images.glob("*.jpg")) + list(source_images.glob("*.png"))
        
        for img_path in image_files:
            # Extract class from filename
            disease_class = extract_class_from_filename(img_path.name)
            
            if disease_class is None:
                print(f"  ⚠️ Could not determine class for: {img_path.name}")
                continue
            
            # Create destination directory
            dest_dir = Path(DEST_PATH) / split / disease_class
            dest_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy image to destination
            dest_path = dest_dir / img_path.name
            shutil.copy2(img_path, dest_path)
            
            stats[split][disease_class] += 1
        
        print(f"  ✅ Processed {len(image_files)} images")
    
    # Print statistics
    print("\n" + "=" * 60)
    print("📊 Dataset Statistics")
    print("=" * 60)
    
    total_images = 0
    for split in splits:
        print(f"\n{split.upper()} Split:")
        split_total = 0
        for disease_class, count in sorted(stats[split].items()):
            print(f"  {disease_class}: {count} images")
            split_total += count
        print(f"  Total: {split_total} images")
        total_images += split_total
    
    print(f"\n🎯 Grand Total: {total_images} images")
    print(f"📁 Dataset saved to: {os.path.abspath(DEST_PATH)}")
    
    # List final structure
    print("\n📂 Final folder structure:")
    for split in splits:
        split_path = Path(DEST_PATH) / split
        if split_path.exists():
            print(f"  {split}/")
            for class_dir in sorted(split_path.iterdir()):
                if class_dir.is_dir():
                    count = len(list(class_dir.glob("*")))
                    print(f"    └── {class_dir.name}/ ({count} images)")

def verify_dataset():
    """Verify the organized dataset is ready for training"""
    print("\n" + "=" * 60)
    print("✅ Dataset Verification")
    print("=" * 60)
    
    required_splits = ["train", "valid", "test"]
    all_classes = set()
    
    for split in required_splits:
        split_path = Path(DEST_PATH) / split
        if not split_path.exists():
            print(f"❌ Missing {split} folder")
            return False
        
        classes = [d.name for d in split_path.iterdir() if d.is_dir()]
        all_classes.update(classes)
        
        if len(classes) == 0:
            print(f"❌ No class folders found in {split}")
            return False
        
        print(f"✅ {split}: {len(classes)} classes found")
    
    print(f"\n🏷️ All classes: {sorted(all_classes)}")
    print("✅ Dataset is ready for training!")
    return True

if __name__ == "__main__":
    organize_dataset()
    verify_dataset()
