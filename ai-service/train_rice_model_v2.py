"""
Rice Leaf Disease Classification - IMPROVED v2
Enhanced MobileNetV2 with better training strategy and augmentation
Target: >85% accuracy
"""

import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, LearningRateScheduler
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

# Optimized configuration
CONFIG = {
    "image_size": (224, 224),
    "batch_size": 16,  # Slightly larger than before
    "epochs": 200,  # Much longer training
    "learning_rate": 0.001,  # Higher initial learning rate
    "fine_tune_epochs": 100,
    "fine_tune_lr": 0.0001,
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


def create_optimized_augmentation(config):
    """Create optimized data augmentation"""
    
    # Augmentation tuned for small medical/agricultural datasets
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=45,
        width_shift_range=0.35,
        height_shift_range=0.35,
        shear_range=0.35,
        zoom_range=[0.7, 1.4],
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode='reflect',
        brightness_range=[0.55, 1.45],
        channel_shift_range=35,
    )
    
    val_datagen = ImageDataGenerator(rescale=1./255)
    
    train_path = config["dataset_path"] + "/train"
    val_path = config["dataset_path"] + "/valid"
    test_path = config["dataset_path"] + "/test"
    
    train_generator = train_datagen.flow_from_directory(
        train_path,
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=True,
        seed=42
    )
    
    val_generator = val_datagen.flow_from_directory(
        val_path,
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=False,
        seed=42
    )
    
    test_generator = val_datagen.flow_from_directory(
        test_path,
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=False,
        seed=42
    )
    
    return train_generator, val_generator, test_generator


def build_optimized_model(num_classes, config):
    """Build optimized MobileNetV2 with better head"""
    
    base_model = MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=(*config["image_size"], 3)
    )
    
    base_model.trainable = False
    
    # Input with augmentation layers
    inputs = keras.Input(shape=(*config["image_size"], 3))
    
    x = base_model(inputs, training=False)
    
    # Optimized head architecture
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization(momentum=0.99)(x)
    x = layers.Dropout(0.4)(x)
    
    # First dense layer
    x = layers.Dense(
        1024,
        activation='relu',
        kernel_regularizer=keras.regularizers.l2(0.0005),
        kernel_initializer='he_normal'
    )(x)
    x = layers.BatchNormalization(momentum=0.99)(x)
    x = layers.Dropout(0.45)(x)
    
    # Second dense layer
    x = layers.Dense(
        512,
        activation='relu',
        kernel_regularizer=keras.regularizers.l2(0.0005),
        kernel_initializer='he_normal'
    )(x)
    x = layers.BatchNormalization(momentum=0.99)(x)
    x = layers.Dropout(0.35)(x)
    
    # Third dense layer
    x = layers.Dense(
        256,
        activation='relu',
        kernel_regularizer=keras.regularizers.l2(0.0005),
        kernel_initializer='he_normal'
    )(x)
    x = layers.Dropout(0.25)(x)
    
    outputs = layers.Dense(num_classes, activation='softmax', kernel_initializer='glorot_uniform')(x)
    
    model = keras.Model(inputs, outputs, name='rice_disease_optimized')
    return model, base_model


def lr_schedule(epoch, lr):
    """Adaptive learning rate schedule"""
    if epoch < 40:
        return lr
    elif epoch < 80:
        return lr * 0.9
    elif epoch < 130:
        return lr * 0.8
    elif epoch < 180:
        return lr * 0.6
    else:
        return lr * 0.4


def train_improved():
    """Main training with optimized strategy"""
    print("=" * 80)
    print("🚀 RICE DISEASE DETECTION - OPTIMIZED MODEL")
    print("=" * 80)
    
    os.makedirs(CONFIG["model_save_path"], exist_ok=True)
    
    # Load data
    print("\n📁 Loading dataset...")
    train_gen, val_gen, test_gen = create_optimized_augmentation(CONFIG)
    
    print(f"   ✓ Training samples: {train_gen.samples}")
    print(f"   ✓ Validation samples: {val_gen.samples}")
    print(f"   ✓ Test samples: {test_gen.samples}")
    
    class_indices = train_gen.class_indices
    class_names = {v: k for k, v in class_indices.items()}
    num_classes = len(class_indices)
    
    with open(os.path.join(CONFIG["model_save_path"], "class_indices.json"), "w") as f:
        json.dump(class_indices, f, indent=2)
    
    print("\n🏗️ Building optimized MobileNetV2 model...")
    model, base_model = build_optimized_model(num_classes, CONFIG)
    
    # Compile
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["learning_rate"], clipvalue=1.0),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.2),
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
            patience=25,
            restore_best_weights=True,
            verbose=1,
            min_delta=0.002
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.65,
            patience=10,
            min_lr=1e-9,
            verbose=1
        ),
        LearningRateScheduler(lr_schedule, verbose=0)
    ]
    
    # Phase 1: Train head
    print("\n🔵 PHASE 1: Training classification head...")
    print(f"   Epochs: {CONFIG['epochs']}")
    print(f"   Initial LR: {CONFIG['learning_rate']}")
    history1 = model.fit(
        train_gen,
        epochs=CONFIG["epochs"],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Phase 2: Fine-tune
    print("\n🟠 PHASE 2: Fine-tuning backbone...")
    base_model.trainable = True
    
    # Unfreeze only last 80 layers (keep early features frozen)
    for layer in base_model.layers[:-80]:
        layer.trainable = False
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["fine_tune_lr"], clipvalue=1.0),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.2),
        metrics=['accuracy']
    )
    
    print(f"   Epochs: {CONFIG['fine_tune_epochs']}")
    print(f"   Fine-tune LR: {CONFIG['fine_tune_lr']}")
    history2 = model.fit(
        train_gen,
        epochs=CONFIG["fine_tune_epochs"],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate
    print("\n📊 EVALUATING ON TEST SET...")
    test_loss, test_accuracy = model.evaluate(test_gen, verbose=1)
    print(f"\n✅ TEST ACCURACY: {test_accuracy * 100:.2f}%")
    
    # Save final model
    model.save(os.path.join(CONFIG["model_save_path"], "best_model.keras"))
    print(f"💾 Model saved")
    
    # Save disease info
    with open(os.path.join(CONFIG["model_save_path"], "disease_info.json"), "w", encoding='utf-8') as f:
        json.dump(DISEASE_INFO, f, indent=2, ensure_ascii=False)
    
    # Save history
    with open(os.path.join(CONFIG["model_save_path"], "training_history.json"), "w") as f:
        json.dump({
            'test_accuracy': float(test_accuracy),
            'test_loss': float(test_loss),
            'epochs': CONFIG['epochs'] + CONFIG['fine_tune_epochs']
        }, f, indent=2)
    
    # Generate report
    generate_report(model, test_gen, class_names, CONFIG["model_save_path"])
    
    print("\n" + "=" * 80)
    print("✅ TRAINING COMPLETE!")
    print("=" * 80)
    
    return model, test_accuracy


def generate_report(model, test_gen, class_names, save_path):
    """Generate classification report"""
    from sklearn.metrics import classification_report as sklearn_report
    
    test_gen.reset()
    predictions = model.predict(test_gen, verbose=0)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_gen.classes
    
    report = sklearn_report(
        y_true, y_pred,
        target_names=[class_names[i] for i in range(len(class_names))],
        output_dict=True,
        zero_division=0
    )
    
    with open(os.path.join(save_path, "classification_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    
    print("\n📋 CLASSIFICATION REPORT:")
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
    plt.xlabel('Predicted', fontsize=12)
    plt.ylabel('Actual', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(os.path.join(save_path, 'confusion_matrix.png'), dpi=150)
    plt.close()
    
    print("✅ Reports saved")


if __name__ == "__main__":
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print(f"🎮 GPU Available")
        except RuntimeError as e:
            print(e)
    else:
        print("💻 CPU Mode")
    
    train_improved()
