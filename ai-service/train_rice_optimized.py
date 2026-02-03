"""
Rice Disease Detection - OPTIMIZED FINAL VERSION
Improved MobileNetV2 with better training strategy
Estimated time: 30-45 minutes on CPU | Target: 85%+ accuracy
"""

import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# Optimized config - balanced speed vs accuracy
CONFIG = {
    "image_size": (224, 224),
    "batch_size": 32,  # Larger for faster training
    "epochs": 60,  # Reduced but effective
    "learning_rate": 0.003,  # Higher for faster convergence
    "fine_tune_epochs": 30,
    "fine_tune_lr": 0.0002,
    "dataset_path": os.path.abspath(os.path.join(os.path.dirname(__file__), "dataset")),
    "model_save_path": os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))
}

DISEASE_INFO = {
    "Bacterial Leaf Blight": {"si_name": "බැක්ටීරියා පත්‍ර අංගමාරය", "description": "Caused by Xanthomonas oryzae. Yellow to white lesions along leaf veins.", "treatment": ["Use certified disease-free seeds", "Apply copper-based bactericides", "Drain fields and avoid excessive nitrogen", "Remove and destroy infected plant debris"], "severity": "high"},
    "Brown Spot": {"si_name": "දුඹුරු පුල්ලි රෝගය", "description": "Fungal disease causing oval brown spots with gray centers on leaves.", "treatment": ["Apply fungicides like Mancozeb or Carbendazim", "Use balanced fertilizers (avoid nitrogen excess)", "Ensure proper seed treatment before planting", "Maintain field hygiene"], "severity": "medium"},
    "Healthy Rice Leaf": {"si_name": "නිරෝගී වී පත්‍රය", "description": "The leaf is healthy with no signs of disease.", "treatment": ["Continue good agricultural practices", "Monitor regularly for early disease detection", "Maintain proper water management", "Apply balanced fertilization"], "severity": "none"},
    "Leaf Blast": {"si_name": "පත්‍ර පිපිරුම් රෝගය", "description": "Caused by Magnaporthe oryzae. Diamond-shaped lesions with gray centers.", "treatment": ["Apply Tricyclazole or Isoprothiolane fungicide", "Use resistant rice varieties (BG 250, BG 300)", "Avoid excessive nitrogen fertilizer", "Maintain proper plant spacing"], "severity": "high"},
    "Leaf scald": {"si_name": "පත්‍ර පිළිස්සුම් රෝගය", "description": "Fungal disease with zonate lesions starting from leaf tips.", "treatment": ["Apply fungicides at early infection stage", "Remove infected plant residues", "Use disease-free seeds", "Avoid water stress conditions"], "severity": "medium"},
    "Narrow Brown Leaf Spot": {"si_name": "පටු දුඹුරු පත්‍ර ලප රෝගය", "description": "Linear brown lesions on leaves caused by Cercospora oryzae.", "treatment": ["Apply Mancozeb or Zineb fungicides", "Use balanced potassium fertilization", "Ensure proper drainage", "Remove crop residues after harvest"], "severity": "medium"},
    "Rice Hispa": {"si_name": "වී හිස්පා පළිබෝධය", "description": "Insect pest causing white streaks by scraping leaf surface.", "treatment": ["Apply Chlorpyrifos or Carbofuran insecticide", "Remove grassy weeds from field borders", "Use light traps to monitor adult population", "Clip and destroy affected leaf tips"], "severity": "medium"},
    "Sheath Blight": {"si_name": "කොපු අංගමාරය", "description": "Fungal disease with irregular grayish-green lesions on sheaths.", "treatment": ["Apply Validamycin or Hexaconazole fungicide", "Reduce plant density and nitrogen", "Ensure proper field drainage", "Remove sclerotia from field after harvest"], "severity": "high"}
}

def create_generators(config):
    """Strong augmentation for small dataset"""
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=50,
        width_shift_range=0.4,
        height_shift_range=0.4,
        shear_range=0.4,
        zoom_range=[0.65, 1.5],
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode='reflect',
        brightness_range=[0.5, 1.6],
        channel_shift_range=45
    )
    
    val_datagen = ImageDataGenerator(rescale=1./255)
    
    train_gen = train_datagen.flow_from_directory(
        os.path.join(config["dataset_path"], "train"),
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=True
    )
    
    val_gen = val_datagen.flow_from_directory(
        os.path.join(config["dataset_path"], "valid"),
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=False
    )
    
    test_gen = val_datagen.flow_from_directory(
        os.path.join(config["dataset_path"], "test"),
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=False
    )
    
    return train_gen, val_gen, test_gen

def build_model(num_classes, config):
    """Optimized MobileNetV2 architecture"""
    base_model = MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=(*config["image_size"], 3)
    )
    base_model.trainable = False
    
    inputs = keras.Input(shape=(*config["image_size"], 3))
    x = base_model(inputs, training=False)
    
    # Stronger classification head
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    
    x = layers.Dense(1024, activation='relu', kernel_regularizer=keras.regularizers.l2(0.0008))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.45)(x)
    
    x = layers.Dense(512, activation='relu', kernel_regularizer=keras.regularizers.l2(0.0008))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    
    x = layers.Dense(256, activation='relu', kernel_regularizer=keras.regularizers.l2(0.0008))(x)
    x = layers.Dropout(0.3)(x)
    
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = keras.Model(inputs, outputs, name='rice_disease')
    return model, base_model

def train():
    """Main training function"""
    print("=" * 80)
    print("🚀 RICE DISEASE DETECTION - OPTIMIZED TRAINING")
    print(f"📊 Estimated Time: 30-45 minutes | Target: 85%+ accuracy")
    print("=" * 80)
    
    os.makedirs(CONFIG["model_save_path"], exist_ok=True)
    
    # Load data
    print("\n📁 Loading dataset...")
    train_gen, val_gen, test_gen = create_generators(CONFIG)
    print(f"   ✓ Training: {train_gen.samples} images")
    print(f"   ✓ Validation: {val_gen.samples} images")
    print(f"   ✓ Test: {test_gen.samples} images")
    
    class_indices = train_gen.class_indices
    class_names = {v: k for k, v in class_indices.items()}
    num_classes = len(class_indices)
    
    # Save class indices
    with open(os.path.join(CONFIG["model_save_path"], "class_indices.json"), "w") as f:
        json.dump(class_indices, f, indent=2)
    
    # Build model
    print("\n🏗️ Building MobileNetV2 model...")
    model, base_model = build_model(num_classes, CONFIG)
    
    # Compile with strong regularization
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["learning_rate"]),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.2),
        metrics=['accuracy']
    )
    
    # Callbacks
    checkpoint_path = os.path.join(CONFIG["model_save_path"], "best_model.keras")
    callbacks = [
        ModelCheckpoint(
            checkpoint_path,
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_accuracy',
            patience=18,
            restore_best_weights=True,
            verbose=1,
            min_delta=0.003
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.7,
            patience=7,
            min_lr=1e-8,
            verbose=1
        )
    ]
    
    # Phase 1: Train head (faster convergence with higher LR)
    print(f"\n🔵 PHASE 1: Training classification head")
    print(f"   Epochs: {CONFIG['epochs']} | Learning Rate: {CONFIG['learning_rate']}")
    print(f"   Batch Size: {CONFIG['batch_size']} | Label Smoothing: 0.2")
    print("-" * 80)
    
    history1 = model.fit(
        train_gen,
        epochs=CONFIG["epochs"],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Phase 2: Fine-tune with unfrozen layers
    print(f"\n🟠 PHASE 2: Fine-tuning with unfrozen layers")
    print(f"   Epochs: {CONFIG['fine_tune_epochs']} | Learning Rate: {CONFIG['fine_tune_lr']}")
    print("-" * 80)
    
    base_model.trainable = True
    for layer in base_model.layers[:-85]:  # Unfreeze last 85 layers
        layer.trainable = False
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["fine_tune_lr"]),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.2),
        metrics=['accuracy']
    )
    
    history2 = model.fit(
        train_gen,
        epochs=CONFIG["fine_tune_epochs"],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Final evaluation
    print("\n📊 FINAL EVALUATION ON TEST SET...")
    print("-" * 80)
    test_loss, test_accuracy = model.evaluate(test_gen, verbose=1)
    print(f"\n✅ FINAL TEST ACCURACY: {test_accuracy * 100:.2f}%")
    
    if test_accuracy >= 0.85:
        print(f"🎯 TARGET ACHIEVED! Accuracy is above 85%")
    else:
        print(f"⚠️ Current accuracy: {test_accuracy * 100:.2f}% (Target: 85%)")
    
    # Save final model
    model.save(checkpoint_path)
    print(f"\n💾 Model saved to: {checkpoint_path}")
    
    # Save disease info
    with open(os.path.join(CONFIG["model_save_path"], "disease_info.json"), "w", encoding='utf-8') as f:
        json.dump(DISEASE_INFO, f, indent=2, ensure_ascii=False)
    
    # Save training history
    with open(os.path.join(CONFIG["model_save_path"], "training_history.json"), "w") as f:
        json.dump({
            'test_accuracy': float(test_accuracy),
            'test_loss': float(test_loss),
            'total_epochs': CONFIG['epochs'] + CONFIG['fine_tune_epochs'],
            'config': CONFIG
        }, f, indent=2)
    
    # Generate detailed report
    generate_report(model, test_gen, class_names, CONFIG["model_save_path"])
    
    print("\n" + "=" * 80)
    print("✅ TRAINING COMPLETE!")
    print("=" * 80)
    
    return model, test_accuracy

def generate_report(model, test_gen, class_names, save_path):
    """Generate classification report and confusion matrix"""
    from sklearn.metrics import classification_report as sklearn_report
    
    print("\n📋 Generating detailed classification report...")
    
    test_gen.reset()
    predictions = model.predict(test_gen, verbose=0)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_gen.classes
    
    # Generate sklearn report
    report = sklearn_report(
        y_true, y_pred,
        target_names=[class_names[i] for i in range(len(class_names))],
        output_dict=True,
        zero_division=0
    )
    
    # Save JSON report
    with open(os.path.join(save_path, "classification_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    
    # Print report
    print("\n" + "=" * 80)
    print("CLASSIFICATION REPORT:")
    print("=" * 80)
    print(sklearn_report(
        y_true, y_pred,
        target_names=[class_names[i] for i in range(len(class_names))],
        zero_division=0
    ))
    
    # Create confusion matrix visualization
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(14, 12))
    sns.heatmap(
        cm, annot=True, fmt='d', cmap='Blues',
        xticklabels=[class_names[i] for i in range(len(class_names))],
        yticklabels=[class_names[i] for i in range(len(class_names))],
        cbar_kws={'label': 'Count'}
    )
    plt.title('Confusion Matrix - Rice Disease Detection', fontsize=16, fontweight='bold')
    plt.xlabel('Predicted Label', fontsize=12)
    plt.ylabel('True Label', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(os.path.join(save_path, 'confusion_matrix.png'), dpi=150, bbox_inches='tight')
    plt.close()
    
    print("\n✅ Classification report and confusion matrix saved")

if __name__ == "__main__":
    # Configure TensorFlow
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print(f"🎮 GPU Available: {len(gpus)} device(s)")
        except RuntimeError as e:
            print(e)
    else:
        print("💻 Running on CPU (Training will take ~30-45 minutes)")
    
    # Set random seeds for reproducibility
    np.random.seed(42)
    tf.random.set_seed(42)
    
    # Start training
    train()
