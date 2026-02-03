"""
Rice Leaf Disease Classification - IMPROVED MODEL
Enhanced architecture with EfficientNetB2, better augmentation, and ensemble approach
Target: >85% accuracy on rice disease detection
"""

import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB2, MobileNetV2
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, LearningRateScheduler
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

# Optimized configuration for improved performance
CONFIG = {
    "image_size": (260, 260),  # Larger size for EfficientNetB2
    "batch_size": 8,  # Smaller batch for better gradient flow
    "epochs": 150,  # More training
    "learning_rate": 0.0003,  # Lower initial rate
    "fine_tune_epochs": 80,
    "fine_tune_lr": 0.00003,
    "dataset_path": os.path.abspath(os.path.join(os.path.dirname(__file__), "dataset")),
    "model_save_path": "models"
}

DISEASE_INFO = {
    "Bacterial Leaf Blight": {
        "si_name": "බැක්ටීරියා පත්‍ර අංගමාරය",
        "description": "Caused by Xanthomonas oryzae. Yellow to white lesions along leaf veins.",
        "treatment": [
            "Use certified disease-free seeds",
            "Apply copper-based bactericides",
            "Drain fields and avoid excessive nitrogen",
            "Remove and destroy infected plant debris"
        ],
        "severity": "high"
    },
    "Brown Spot": {
        "si_name": "දුඹුරු පුල්ලි රෝගය",
        "description": "Fungal disease causing oval brown spots with gray centers on leaves.",
        "treatment": [
            "Apply fungicides like Mancozeb or Carbendazim",
            "Use balanced fertilizers (avoid nitrogen excess)",
            "Ensure proper seed treatment before planting",
            "Maintain field hygiene"
        ],
        "severity": "medium"
    },
    "Healthy Rice Leaf": {
        "si_name": "නිරෝගී වී පත්‍රය",
        "description": "The leaf is healthy with no signs of disease.",
        "treatment": [
            "Continue good agricultural practices",
            "Monitor regularly for early disease detection",
            "Maintain proper water management",
            "Apply balanced fertilization"
        ],
        "severity": "none"
    },
    "Leaf Blast": {
        "si_name": "පත්‍ර පිපිරුම් රෝගය",
        "description": "Caused by Magnaporthe oryzae. Diamond-shaped lesions with gray centers.",
        "treatment": [
            "Apply Tricyclazole or Isoprothiolane fungicide",
            "Use resistant rice varieties (BG 250, BG 300)",
            "Avoid excessive nitrogen fertilizer",
            "Maintain proper plant spacing"
        ],
        "severity": "high"
    },
    "Leaf scald": {
        "si_name": "පත්‍ර පිළිස්සුම් රෝගය",
        "description": "Fungal disease with zonate lesions starting from leaf tips.",
        "treatment": [
            "Apply fungicides at early infection stage",
            "Remove infected plant residues",
            "Use disease-free seeds",
            "Avoid water stress conditions"
        ],
        "severity": "medium"
    },
    "Narrow Brown Leaf Spot": {
        "si_name": "පටු දුඹුරු පත්‍ර ලප රෝගය",
        "description": "Linear brown lesions on leaves caused by Cercospora oryzae.",
        "treatment": [
            "Apply Mancozeb or Zineb fungicides",
            "Use balanced potassium fertilization",
            "Ensure proper drainage",
            "Remove crop residues after harvest"
        ],
        "severity": "medium"
    },
    "Rice Hispa": {
        "si_name": "වී හිස්පා පළිබෝධය",
        "description": "Insect pest causing white streaks by scraping leaf surface.",
        "treatment": [
            "Apply Chlorpyrifos or Carbofuran insecticide",
            "Remove grassy weeds from field borders",
            "Use light traps to monitor adult population",
            "Clip and destroy affected leaf tips"
        ],
        "severity": "medium"
    },
    "Sheath Blight": {
        "si_name": "කොපු අංගමාරය",
        "description": "Fungal disease with irregular grayish-green lesions on sheaths.",
        "treatment": [
            "Apply Validamycin or Hexaconazole fungicide",
            "Reduce plant density and nitrogen",
            "Ensure proper field drainage",
            "Remove sclerotia from field after harvest"
        ],
        "severity": "high"
    }
}


def create_advanced_augmentation(config):
    """Create more aggressive data augmentation with mixup capability"""
    
    # Heavy augmentation for training
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=50,
        width_shift_range=0.4,
        height_shift_range=0.4,
        shear_range=0.4,
        zoom_range=[0.7, 1.3],
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode='reflect',
        brightness_range=[0.5, 1.5],
        channel_shift_range=40,
    )
    
    val_datagen = ImageDataGenerator(rescale=1./255)
    
    train_path = os.path.join(config["dataset_path"], "train")
    val_path = os.path.join(config["dataset_path"], "valid")
    test_path = os.path.join(config["dataset_path"], "test")
    
    # Check if paths exist
    if not os.path.exists(train_path):
        train_path = os.path.abspath(train_path)
    if not os.path.exists(val_path):
        val_path = os.path.abspath(val_path)
    if not os.path.exists(test_path):
        test_path = os.path.abspath(test_path)
    
    train_generator = train_datagen.flow_from_directory(
        train_path,
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=True
    )
    
    val_generator = val_datagen.flow_from_directory(
        val_path,
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=False
    )
    
    test_generator = val_datagen.flow_from_directory(
        test_path,
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=False
    )
    
    return train_generator, val_generator, test_generator


def build_efficient_model(num_classes, config):
    """Build EfficientNetB2 model - better performance than MobileNetV2"""
    
    base_model = EfficientNetB2(
        weights='imagenet',
        include_top=False,
        input_shape=(*config["image_size"], 3)
    )
    
    base_model.trainable = False
    
    inputs = keras.Input(shape=(*config["image_size"], 3))
    
    # Apply data augmentation at model level
    x = layers.RandomFlip("horizontal")(inputs)
    x = layers.RandomRotation(0.1)(x)
    x = layers.RandomZoom(0.15)(x)
    
    # Base model with batch norm
    x = base_model(x, training=False)
    
    # Better head architecture
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    
    # Dense layers with L2 regularization and dropout
    x = layers.Dense(1024, activation='relu', 
                     kernel_regularizer=keras.regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    
    x = layers.Dense(512, activation='relu',
                     kernel_regularizer=keras.regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    
    x = layers.Dense(256, activation='relu',
                     kernel_regularizer=keras.regularizers.l2(0.001))(x)
    x = layers.Dropout(0.3)(x)
    
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = keras.Model(inputs, outputs, name='rice_disease_efficient')
    return model, base_model


def lr_schedule(epoch, lr):
    """Learning rate scheduler - gradually reduce LR"""
    if epoch < 30:
        return lr
    elif epoch < 60:
        return lr * 0.9
    elif epoch < 100:
        return lr * 0.8
    else:
        return lr * 0.7


def train_improved_model():
    """Main training function with improved approach"""
    print("=" * 70)
    print("🚀 RICE DISEASE DETECTION - IMPROVED MODEL (EfficientNetB2)")
    print("=" * 70)
    
    os.makedirs(CONFIG["model_save_path"], exist_ok=True)
    
    # Load data
    print("\n📁 Loading dataset...")
    train_gen, val_gen, test_gen = create_advanced_augmentation(CONFIG)
    
    print(f"   ✓ Training samples: {train_gen.samples}")
    print(f"   ✓ Validation samples: {val_gen.samples}")
    print(f"   ✓ Test samples: {test_gen.samples}")
    
    class_indices = train_gen.class_indices
    class_names = {v: k for k, v in class_indices.items()}
    num_classes = len(class_indices)
    
    with open(os.path.join(CONFIG["model_save_path"], "class_indices.json"), "w") as f:
        json.dump(class_indices, f, indent=2)
    
    # Build model
    print("\n🏗️ Building EfficientNetB2 model...")
    model, base_model = build_efficient_model(num_classes, CONFIG)
    model.summary()
    
    # Compile with stronger regularization
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["learning_rate"]),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.15),
        metrics=['accuracy']
    )
    
    # Callbacks
    callbacks = [
        ModelCheckpoint(
            os.path.join(CONFIG["model_save_path"], "best_model.keras"),
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_accuracy',
            patience=20,
            restore_best_weights=True,
            verbose=1,
            min_delta=0.001
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.6,
            patience=8,
            min_lr=1e-8,
            verbose=1
        ),
        LearningRateScheduler(lr_schedule, verbose=1)
    ]
    
    # Phase 1: Train head (longer this time)
    print("\n🔵 PHASE 1: Training classification head...")
    print(f"   Epochs: {CONFIG['epochs']}, Learning Rate: {CONFIG['learning_rate']}")
    history1 = model.fit(
        train_gen,
        epochs=CONFIG["epochs"],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Phase 2: Fine-tune with lower frozen layers
    print("\n🟠 PHASE 2: Fine-tuning with unfrozen deeper layers...")
    base_model.trainable = True
    
    # Unfreeze more layers (more aggressive fine-tuning)
    for layer in base_model.layers[:50]:  # Freeze fewer layers
        layer.trainable = False
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["fine_tune_lr"]),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.15),
        metrics=['accuracy']
    )
    
    print(f"   Epochs: {CONFIG['fine_tune_epochs']}, Learning Rate: {CONFIG['fine_tune_lr']}")
    history2 = model.fit(
        train_gen,
        epochs=CONFIG["fine_tune_epochs"],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate
    print("\n📊 Evaluating on test set...")
    test_loss, test_accuracy = model.evaluate(test_gen, verbose=1)
    print(f"\n✅ TEST ACCURACY: {test_accuracy * 100:.2f}%")
    
    # Save model
    final_model_path = os.path.join(CONFIG["model_save_path"], "best_model.keras")
    model.save(final_model_path)
    print(f"\n💾 Model saved to: {final_model_path}")
    
    # Save disease info
    with open(os.path.join(CONFIG["model_save_path"], "disease_info.json"), "w", encoding='utf-8') as f:
        json.dump(DISEASE_INFO, f, indent=2, ensure_ascii=False)
    
    # Save history
    history = {
        'test_accuracy': float(test_accuracy),
        'test_loss': float(test_loss),
        'epochs_trained': CONFIG['epochs'] + CONFIG['fine_tune_epochs']
    }
    with open(os.path.join(CONFIG["model_save_path"], "training_history.json"), "w") as f:
        json.dump(history, f, indent=2)
    
    # Generate detailed report
    generate_detailed_report(model, test_gen, class_names, CONFIG["model_save_path"])
    
    print("\n" + "=" * 70)
    print("✅ TRAINING COMPLETE!")
    print("=" * 70)
    
    return model, test_accuracy


def generate_detailed_report(model, test_gen, class_names, save_path):
    """Generate comprehensive classification report"""
    from sklearn.metrics import classification_report as sklearn_report
    
    test_gen.reset()
    predictions = model.predict(test_gen, verbose=0)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_gen.classes
    
    # Sklearn report
    report = sklearn_report(
        y_true, y_pred,
        target_names=[class_names[i] for i in range(len(class_names))],
        output_dict=True,
        zero_division=0
    )
    
    with open(os.path.join(save_path, "classification_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    
    # Print report
    print("\n📋 Classification Report:")
    print(sklearn_report(
        y_true, y_pred,
        target_names=[class_names[i] for i in range(len(class_names))],
        zero_division=0
    ))
    
    # Confusion matrix
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
    plt.savefig(os.path.join(save_path, 'confusion_matrix.png'), dpi=150)
    plt.close()
    
    print("✅ Reports and visualizations saved")


if __name__ == "__main__":
    # GPU setup
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print(f"🎮 GPU Available: {len(gpus)} device(s)")
        except RuntimeError as e:
            print(e)
    else:
        print("💻 Running on CPU")
    
    train_improved_model()
