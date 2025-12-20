"""
Quick test script to verify the trained model works correctly
"""

import os
import json
import random
import numpy as np
import tensorflow as tf
from tensorflow import keras
from PIL import Image

MODEL_PATH = "models/rice_disease_model.keras"
CLASS_INDICES_PATH = "models/class_indices.json"
DATASET_PATH = "../dataset/test"
IMAGE_SIZE = (224, 224)

def load_and_test():
    """Load model and test on random images from test set"""
    
    print("=" * 60)
    print("🧪 Model Testing Script")
    print("=" * 60)
    
    # Check if model exists
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model not found at {MODEL_PATH}")
        print("   Please run train_model.py first!")
        return False
    
    # Load model
    print("\n📥 Loading model...")
    model = keras.models.load_model(MODEL_PATH)
    print("✅ Model loaded successfully!")
    
    # Load class indices
    with open(CLASS_INDICES_PATH, 'r') as f:
        class_indices = json.load(f)
    class_names = {v: k for k, v in class_indices.items()}
    
    print(f"\n📋 Classes: {list(class_indices.keys())}")
    
    # Test on random images from each class
    print("\n" + "=" * 60)
    print("🔍 Testing on sample images from test set")
    print("=" * 60)
    
    total_correct = 0
    total_tested = 0
    
    for class_name in class_indices.keys():
        class_path = os.path.join(DATASET_PATH, class_name)
        
        if not os.path.exists(class_path):
            print(f"⚠️ Test folder not found: {class_path}")
            continue
        
        # Get image files
        images = [f for f in os.listdir(class_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        if not images:
            continue
        
        # Test on 3 random images from this class
        test_images = random.sample(images, min(3, len(images)))
        
        print(f"\n📁 Testing {class_name}:")
        
        for img_name in test_images:
            img_path = os.path.join(class_path, img_name)
            
            # Load and preprocess image
            img = Image.open(img_path).convert('RGB')
            img = img.resize(IMAGE_SIZE, Image.Resampling.LANCZOS)
            img_array = np.array(img) / 255.0
            img_array = np.expand_dims(img_array, axis=0)
            
            # Predict
            predictions = model.predict(img_array, verbose=0)[0]
            predicted_idx = np.argmax(predictions)
            predicted_class = class_names[predicted_idx]
            confidence = predictions[predicted_idx]
            
            # Check if correct
            is_correct = predicted_class == class_name
            total_tested += 1
            if is_correct:
                total_correct += 1
            
            status = "✅" if is_correct else "❌"
            print(f"   {status} {img_name[:30]:30s} → {predicted_class} ({confidence*100:.1f}%)")
    
    # Summary
    accuracy = total_correct / total_tested * 100 if total_tested > 0 else 0
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {total_correct}/{total_tested} correct ({accuracy:.1f}%)")
    print("=" * 60)
    
    if accuracy >= 80:
        print("✅ Model is working well!")
        return True
    else:
        print("⚠️ Model accuracy is low. Consider retraining.")
        return False

if __name__ == "__main__":
    load_and_test()
