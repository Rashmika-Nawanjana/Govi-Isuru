"""
Chili Plant Disease Classification Model Training
Using MobileNetV2 with Transfer Learning for Govi Isuru Platform
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

# Configuration
CONFIG = {
    "image_size": (224, 224),
    "batch_size": 16,
    "epochs": 80,
    "learning_rate": 0.0005,
    "fine_tune_epochs": 40,
    "fine_tune_lr": 0.00005,
    "dataset_path": "chili_dataset",
    "model_save_path": "models/chili"
}

# Chili Disease Information with Sinhala names
CHILI_DISEASE_INFO = {
    "Leaf Spot": {
        "si_name": "පත්‍ර පුල්ලි රෝගය (බෙර්කැක් දවුන්)",
        "description": "Leaf spot disease (Bercak Daun) is caused by fungal pathogens like Cercospora and Alternaria. Circular to irregular brown spots with dark margins appear on leaves, leading to defoliation.",
        "treatment": [
            "Apply copper-based fungicides (Copper Oxychloride)",
            "Remove and destroy infected leaves immediately",
            "Apply Mancozeb or Chlorothalonil fungicides",
            "Maintain proper plant spacing for air circulation",
            "Avoid overhead irrigation to reduce leaf wetness",
            "Apply neem oil spray as organic alternative"
        ],
        "severity": "medium"
    },
    "Healthy": {
        "si_name": "නිරෝගී මිරිස් පත්‍රය",
        "description": "The chili plant is healthy with no visible signs of disease or pest damage. Leaves show good green color with proper texture and no spots or discoloration.",
        "treatment": [
            "Continue regular monitoring for early disease detection",
            "Maintain balanced fertilization (NPK 10-10-10)",
            "Ensure proper irrigation without waterlogging",
            "Practice crop rotation to prevent soil-borne diseases",
            "Apply preventive neem oil spray monthly",
            "Monitor for early signs of pest infestation"
        ],
        "severity": "none"
    },
    "Thrips Damage": {
        "si_name": "තොප්ස් කෘමි හානිය",
        "description": "Thrips are tiny insects that feed on chili leaves causing silvery streaks, curling, and distortion. Heavy infestation leads to stunted growth and reduced yield.",
        "treatment": [
            "Apply systemic insecticides like Imidacloprid or Spinosad",
            "Use blue or yellow sticky traps to monitor populations",
            "Spray neem oil or insecticidal soap for organic control",
            "Remove heavily infested plant parts",
            "Apply Fipronil granules to soil for systemic protection",
            "Introduce natural predators like minute pirate bugs"
        ],
        "severity": "high"
    },
    "Yellow Virus": {
        "si_name": "කහ වයිරස් රෝගය (Virus Kuning)",
        "description": "Yellow virus disease (Gemini virus/Leaf Curl Virus) is transmitted by whiteflies. Causes yellowing, curling, and stunting of leaves. Severely affects plant growth and fruit production.",
        "treatment": [
            "Remove and destroy infected plants immediately",
            "Control whitefly vectors with Imidacloprid or Thiamethoxam",
            "Use reflective mulches to repel whiteflies",
            "Install insect-proof netting in nurseries",
            "Apply neem-based products to control vectors",
            "Plant resistant varieties if available",
            "Avoid planting near infected fields"
        ],
        "severity": "high"
    }
}

def create_data_generators(config):
    """Create data generators with augmentation for training"""
    
    # Strong augmentation for training
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

def create_model(num_classes, config):
    """Create MobileNetV2 model for chili disease classification"""
    
    # Load MobileNetV2 base model
    base_model = MobileNetV2(
        input_shape=(*config["image_size"], 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze base model initially
    base_model.trainable = False
    
    # Build model
    inputs = keras.Input(shape=(*config["image_size"], 3))
    
    # Data augmentation layers
    x = layers.RandomFlip("horizontal")(inputs)
    x = layers.RandomRotation(0.2)(x)
    x = layers.RandomZoom(0.2)(x)
    
    # Base model
    x = base_model(x, training=False)
    
    # Classification head
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(256, activation='relu', kernel_regularizer=keras.regularizers.l2(0.01))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(128, activation='relu', kernel_regularizer=keras.regularizers.l2(0.01))(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = keras.Model(inputs, outputs)
    
    return model, base_model

def train_model():
    """Main training function"""
    print("=" * 60)
    print("🌶️ Chili Plant Disease Classification Training")
    print("=" * 60)
    
    # Check for GPU
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        print(f"🎮 GPU available: {len(gpus)} device(s)")
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    else:
        print("💻 Training on CPU")
    
    # Create output directory
    os.makedirs(CONFIG["model_save_path"], exist_ok=True)
    
    # Create data generators
    print("\n📁 Loading dataset...")
    train_gen, val_gen, test_gen = create_data_generators(CONFIG)
    
    num_classes = len(train_gen.class_indices)
    class_names = list(train_gen.class_indices.keys())
    
    print(f"📊 Classes ({num_classes}): {class_names}")
    print(f"📷 Training samples: {train_gen.samples}")
    print(f"📷 Validation samples: {val_gen.samples}")
    print(f"📷 Test samples: {test_gen.samples}")
    
    # Create model
    print("\n🔧 Creating model...")
    model, base_model = create_model(num_classes, CONFIG)
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["learning_rate"]),
        loss='categorical_crossentropy',
        metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
    )
    
    model.summary()
    
    # Callbacks
    callbacks = [
        ModelCheckpoint(
            os.path.join(CONFIG["model_save_path"], "chili_best_model.keras"),
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Phase 1: Train classification head
    print("\n" + "=" * 60)
    print("📚 Phase 1: Training Classification Head")
    print("=" * 60)
    
    history1 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=CONFIG["epochs"],
        callbacks=callbacks,
        verbose=1
    )
    
    # Phase 2: Fine-tune top layers of base model
    print("\n" + "=" * 60)
    print("🔬 Phase 2: Fine-tuning Base Model")
    print("=" * 60)
    
    # Unfreeze top layers
    base_model.trainable = True
    for layer in base_model.layers[:-50]:
        layer.trainable = False
    
    # Recompile with lower learning rate
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["fine_tune_lr"]),
        loss='categorical_crossentropy',
        metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
    )
    
    # Update checkpoint path for fine-tuning
    callbacks[0] = ModelCheckpoint(
        os.path.join(CONFIG["model_save_path"], "chili_best_model.keras"),
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    )
    
    history2 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=CONFIG["fine_tune_epochs"],
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate on test set
    print("\n" + "=" * 60)
    print("📊 Evaluating on Test Set")
    print("=" * 60)
    
    test_results = model.evaluate(test_gen, verbose=1)
    print(f"\n✅ Test Accuracy: {test_results[1]*100:.2f}%")
    print(f"✅ Test Precision: {test_results[2]*100:.2f}%")
    print(f"✅ Test Recall: {test_results[3]*100:.2f}%")
    
    # Save class indices
    class_indices_path = os.path.join(CONFIG["model_save_path"], "chili_class_indices.json")
    # Save as {index: class_name} for consistency with rice model
    class_idx_map = {str(v): k for k, v in train_gen.class_indices.items()}
    with open(class_indices_path, 'w') as f:
        json.dump(class_idx_map, f, indent=2)
    print(f"💾 Saved class indices to {class_indices_path}")
    
    # Save disease info
    disease_info_path = os.path.join(CONFIG["model_save_path"], "chili_disease_info.json")
    with open(disease_info_path, 'w', encoding='utf-8') as f:
        json.dump(CHILI_DISEASE_INFO, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved disease info to {disease_info_path}")
    
    # Save training history
    history_path = os.path.join(CONFIG["model_save_path"], "chili_training_history.json")
    combined_history = {
        'phase1': {k: [float(v) for v in vals] for k, vals in history1.history.items()},
        'phase2': {k: [float(v) for v in vals] for k, vals in history2.history.items()}
    }
    with open(history_path, 'w') as f:
        json.dump(combined_history, f, indent=2)
    print(f"💾 Saved training history to {history_path}")
    
    # Plot training history
    plot_training_history(history1, history2, CONFIG["model_save_path"])
    
    print("\n" + "=" * 60)
    print("🎉 Training Complete!")
    print("=" * 60)
    print(f"📁 Model saved to: {CONFIG['model_save_path']}/chili_best_model.keras")

def plot_training_history(history1, history2, save_path):
    """Plot and save training history"""
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    
    # Combine histories
    acc1 = history1.history['accuracy']
    val_acc1 = history1.history['val_accuracy']
    loss1 = history1.history['loss']
    val_loss1 = history1.history['val_loss']
    
    acc2 = history2.history['accuracy']
    val_acc2 = history2.history['val_accuracy']
    loss2 = history2.history['loss']
    val_loss2 = history2.history['val_loss']
    
    # Phase 1 epochs
    epochs1 = range(1, len(acc1) + 1)
    epochs2 = range(len(acc1) + 1, len(acc1) + len(acc2) + 1)
    
    # Plot accuracy
    axes[0, 0].plot(epochs1, acc1, 'b-', label='Phase 1 Train')
    axes[0, 0].plot(epochs1, val_acc1, 'b--', label='Phase 1 Val')
    axes[0, 0].plot(epochs2, acc2, 'g-', label='Phase 2 Train')
    axes[0, 0].plot(epochs2, val_acc2, 'g--', label='Phase 2 Val')
    axes[0, 0].set_title('Model Accuracy')
    axes[0, 0].set_xlabel('Epoch')
    axes[0, 0].set_ylabel('Accuracy')
    axes[0, 0].legend()
    axes[0, 0].grid(True)
    
    # Plot loss
    axes[0, 1].plot(epochs1, loss1, 'b-', label='Phase 1 Train')
    axes[0, 1].plot(epochs1, val_loss1, 'b--', label='Phase 1 Val')
    axes[0, 1].plot(epochs2, loss2, 'g-', label='Phase 2 Train')
    axes[0, 1].plot(epochs2, val_loss2, 'g--', label='Phase 2 Val')
    axes[0, 1].set_title('Model Loss')
    axes[0, 1].set_xlabel('Epoch')
    axes[0, 1].set_ylabel('Loss')
    axes[0, 1].legend()
    axes[0, 1].grid(True)
    
    # Helper function to find metric keys (handles precision_1, precision_2, etc.)
    def find_metric_key(history_dict, metric_name):
        for key in history_dict.keys():
            if key.startswith(metric_name) and not key.startswith('val_'):
                return key
        return None
    
    def find_val_metric_key(history_dict, metric_name):
        for key in history_dict.keys():
            if key.startswith(f'val_{metric_name}'):
                return key
        return None
    
    # Plot precision if available
    prec_key1 = find_metric_key(history1.history, 'precision')
    val_prec_key1 = find_val_metric_key(history1.history, 'precision')
    prec_key2 = find_metric_key(history2.history, 'precision')
    val_prec_key2 = find_val_metric_key(history2.history, 'precision')
    
    if prec_key1 and val_prec_key1 and prec_key2 and val_prec_key2:
        prec1 = history1.history[prec_key1]
        val_prec1 = history1.history[val_prec_key1]
        prec2 = history2.history[prec_key2]
        val_prec2 = history2.history[val_prec_key2]
        
        axes[1, 0].plot(epochs1, prec1, 'b-', label='Phase 1 Train')
        axes[1, 0].plot(epochs1, val_prec1, 'b--', label='Phase 1 Val')
        axes[1, 0].plot(epochs2, prec2, 'g-', label='Phase 2 Train')
        axes[1, 0].plot(epochs2, val_prec2, 'g--', label='Phase 2 Val')
        axes[1, 0].set_title('Model Precision')
        axes[1, 0].set_xlabel('Epoch')
        axes[1, 0].set_ylabel('Precision')
        axes[1, 0].legend()
        axes[1, 0].grid(True)
    else:
        axes[1, 0].text(0.5, 0.5, 'Precision data not available', ha='center', va='center')
        axes[1, 0].set_title('Model Precision')
    
    # Plot recall if available
    rec_key1 = find_metric_key(history1.history, 'recall')
    val_rec_key1 = find_val_metric_key(history1.history, 'recall')
    rec_key2 = find_metric_key(history2.history, 'recall')
    val_rec_key2 = find_val_metric_key(history2.history, 'recall')
    
    if rec_key1 and val_rec_key1 and rec_key2 and val_rec_key2:
        rec1 = history1.history[rec_key1]
        val_rec1 = history1.history[val_rec_key1]
        rec2 = history2.history[rec_key2]
        val_rec2 = history2.history[val_rec_key2]
        
        axes[1, 1].plot(epochs1, rec1, 'b-', label='Phase 1 Train')
        axes[1, 1].plot(epochs1, val_rec1, 'b--', label='Phase 1 Val')
        axes[1, 1].plot(epochs2, rec2, 'g-', label='Phase 2 Train')
        axes[1, 1].plot(epochs2, val_rec2, 'g--', label='Phase 2 Val')
        axes[1, 1].set_title('Model Recall')
        axes[1, 1].set_xlabel('Epoch')
        axes[1, 1].set_ylabel('Recall')
        axes[1, 1].legend()
        axes[1, 1].grid(True)
    else:
        axes[1, 1].text(0.5, 0.5, 'Recall data not available', ha='center', va='center')
        axes[1, 1].set_title('Model Recall')
    
    plt.suptitle('🌶️ Chili Disease Model Training History', fontsize=14)
    plt.tight_layout()
    plt.savefig(os.path.join(save_path, 'chili_training_history.png'), dpi=150)
    plt.close()
    print(f"📊 Saved training plot to {save_path}/chili_training_history.png")

if __name__ == "__main__":
    train_model()
