"""
Rice Leaf Disease Classification Model Training - Optimized for Small Dataset
Using MobileNetV2 with aggressive augmentation and longer training
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
import matplotlib.pyplot as plt

# Configuration optimized for smaller dataset
CONFIG = {
    "image_size": (224, 224),
    "batch_size": 16,  # Smaller batch for better generalization
    "epochs": 100,  # More epochs
    "learning_rate": 0.0005,
    "fine_tune_epochs": 50,
    "fine_tune_lr": 0.00005,
    "dataset_path": "../dataset",
    "model_save_path": "models"
}

# Disease information
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

def create_data_generators(config):
    """Create data generators with strong augmentation"""
    
    # Strong augmentation for training (helps with small dataset)
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=40,
        width_shift_range=0.3,
        height_shift_range=0.3,
        shear_range=0.3,
        zoom_range=0.3,
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode='reflect',
        brightness_range=[0.6, 1.4],
        channel_shift_range=30
    )
    
    val_datagen = ImageDataGenerator(rescale=1./255)
    
    train_generator = train_datagen.flow_from_directory(
        os.path.join(config["dataset_path"], "train"),
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=True
    )
    
    val_generator = val_datagen.flow_from_directory(
        os.path.join(config["dataset_path"], "valid"),
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=False
    )
    
    test_generator = val_datagen.flow_from_directory(
        os.path.join(config["dataset_path"], "test"),
        target_size=config["image_size"],
        batch_size=config["batch_size"],
        class_mode='categorical',
        shuffle=False
    )
    
    return train_generator, val_generator, test_generator

def build_model(num_classes, config):
    """Build MobileNetV2 model - lighter and better for small datasets"""
    
    base_model = MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=(*config["image_size"], 3)
    )
    
    # Freeze base model
    base_model.trainable = False
    
    # Build model with stronger regularization
    inputs = keras.Input(shape=(*config["image_size"], 3))
    
    # Base model
    x = base_model(inputs, training=False)
    
    # Custom head with stronger dropout
    x = layers.GlobalAveragePooling2D(name='global_avg_pool')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(512, activation='relu', kernel_regularizer=keras.regularizers.l2(0.01))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(256, activation='relu', kernel_regularizer=keras.regularizers.l2(0.01))(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation='softmax', name='predictions')(x)
    
    model = keras.Model(inputs, outputs, name='rice_disease_classifier')
    
    return model, base_model

def train_model():
    """Main training function"""
    print("=" * 60)
    print("Rice Leaf Disease Classification - Optimized Training")
    print("=" * 60)
    
    os.makedirs(CONFIG["model_save_path"], exist_ok=True)
    
    # Create data generators
    print("\n📁 Loading dataset...")
    train_gen, val_gen, test_gen = create_data_generators(CONFIG)
    
    print(f"   Training samples: {train_gen.samples}")
    print(f"   Validation samples: {val_gen.samples}")
    print(f"   Test samples: {test_gen.samples}")
    
    class_indices = train_gen.class_indices
    class_names = {v: k for k, v in class_indices.items()}
    
    with open(os.path.join(CONFIG["model_save_path"], "class_indices.json"), "w") as f:
        json.dump(class_indices, f, indent=2)
    
    # Build model
    print("\n🏗️ Building model (MobileNetV2)...")
    num_classes = len(class_indices)
    model, base_model = build_model(num_classes, CONFIG)
    model.summary()
    
    # Compile with label smoothing
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["learning_rate"]),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
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
            patience=15,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=7,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Phase 1: Train classification head
    print("\n🚀 Phase 1: Training classification head...")
    history1 = model.fit(
        train_gen,
        epochs=CONFIG["epochs"],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Phase 2: Fine-tune
    print("\n🔧 Phase 2: Fine-tuning...")
    base_model.trainable = True
    
    # Freeze early layers (keep first 100 layers frozen)
    for layer in base_model.layers[:100]:
        layer.trainable = False
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["fine_tune_lr"]),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
        metrics=['accuracy']
    )
    
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
    print(f"\n✅ Test Accuracy: {test_accuracy * 100:.2f}%")
    
    # Save model
    final_model_path = os.path.join(CONFIG["model_save_path"], "rice_disease_model.keras")
    model.save(final_model_path)
    print(f"\n💾 Model saved to: {final_model_path}")
    
    # Save disease info
    with open(os.path.join(CONFIG["model_save_path"], "disease_info.json"), "w", encoding='utf-8') as f:
        json.dump(DISEASE_INFO, f, indent=2, ensure_ascii=False)
    
    # Save history
    history = {
        'test_accuracy': float(test_accuracy),
        'test_loss': float(test_loss)
    }
    with open(os.path.join(CONFIG["model_save_path"], "training_history.json"), "w") as f:
        json.dump(history, f, indent=2)
    
    # Generate classification report
    generate_report(model, test_gen, class_names, CONFIG["model_save_path"])
    
    print("\n" + "=" * 60)
    print("✅ Training Complete!")
    print("=" * 60)
    
    return model, test_accuracy

def generate_report(model, test_gen, class_names, save_path):
    """Generate classification report"""
    from sklearn.metrics import classification_report, confusion_matrix
    import seaborn as sns
    
    test_gen.reset()
    predictions = model.predict(test_gen, verbose=0)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_gen.classes
    
    report = classification_report(
        y_true, y_pred,
        target_names=[class_names[i] for i in range(len(class_names))],
        output_dict=True,
        zero_division=0
    )
    
    with open(os.path.join(save_path, "classification_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    
    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(12, 10))
    sns.heatmap(
        cm, annot=True, fmt='d', cmap='Blues',
        xticklabels=[class_names[i] for i in range(len(class_names))],
        yticklabels=[class_names[i] for i in range(len(class_names))]
    )
    plt.title('Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(os.path.join(save_path, 'confusion_matrix.png'), dpi=150)
    plt.close()
    print("📊 Reports saved")

if __name__ == "__main__":
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        print(f"🎮 GPU: {len(gpus)} device(s)")
    else:
        print("💻 Running on CPU")
    
    train_model()
