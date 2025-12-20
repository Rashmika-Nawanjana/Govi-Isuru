"""
Rice Leaf Disease Prediction API with Grad-CAM Visualization
FastAPI service for Govi Isuru Smart Farming Platform
"""

import os
import io
import json
import base64
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from PIL import Image
import cv2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Configuration
MODEL_PATH = "models/rice_disease_model.keras"
CLASS_INDICES_PATH = "models/class_indices.json"
DISEASE_INFO_PATH = "models/disease_info.json"
IMAGE_SIZE = (224, 224)

# Initialize FastAPI
app = FastAPI(
    title="Govi Isuru - Rice Disease Predictor",
    description="AI-powered rice leaf disease detection with Grad-CAM visualization",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and metadata
model = None
class_indices = None
class_names = None
disease_info = None

def load_model_and_metadata():
    """Load the trained model and metadata"""
    global model, class_indices, class_names, disease_info
    
    print("🔄 Loading model and metadata...")
    
    # Load model
    if os.path.exists(MODEL_PATH):
        model = keras.models.load_model(MODEL_PATH)
        print(f"✅ Model loaded from {MODEL_PATH}")
    else:
        print(f"⚠️ Model not found at {MODEL_PATH}")
        return False
    
    # Load class indices
    if os.path.exists(CLASS_INDICES_PATH):
        with open(CLASS_INDICES_PATH, 'r') as f:
            class_indices = json.load(f)
        class_names = {v: k for k, v in class_indices.items()}
        print(f"✅ Class indices loaded: {list(class_indices.keys())}")
    else:
        print(f"⚠️ Class indices not found")
        return False
    
    # Load disease info
    if os.path.exists(DISEASE_INFO_PATH):
        with open(DISEASE_INFO_PATH, 'r', encoding='utf-8') as f:
            disease_info = json.load(f)
        print(f"✅ Disease info loaded")
    else:
        print(f"⚠️ Disease info not found, using defaults")
        disease_info = {}
    
    return True

def preprocess_image(image_bytes):
    """Preprocess image for model prediction"""
    # Open image
    image = Image.open(io.BytesIO(image_bytes))
    
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize
    image = image.resize(IMAGE_SIZE, Image.Resampling.LANCZOS)
    
    # Convert to numpy array and normalize
    img_array = np.array(image) / 255.0
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array, image

def generate_gradcam(model, img_array, class_idx, layer_name=None):
    """
    Generate Grad-CAM heatmap for the predicted class
    Works with MobileNetV2 architecture
    """
    try:
        # For MobileNetV2, get the last conv layer from the base model
        grad_model = None
        conv_layer = None
        
        # Find the MobileNetV2 base model and its last conv layer
        for layer in model.layers:
            if 'mobilenetv2' in layer.name.lower() or 'mobilenet' in layer.name.lower():
                # It's the base model
                base_model = layer
                # Get the last convolutional layer output
                for sub_layer in reversed(base_model.layers):
                    if 'conv' in sub_layer.name.lower() and 'bn' not in sub_layer.name.lower():
                        conv_layer = sub_layer
                        break
                break
            elif 'efficientnet' in layer.name.lower():
                base_model = layer
                for sub_layer in reversed(base_model.layers):
                    if 'conv' in sub_layer.name.lower():
                        conv_layer = sub_layer
                        break
                break
        
        if conv_layer is None:
            print("⚠️ Could not find conv layer for Grad-CAM")
            return None
        
        # Create grad model
        # Get the output of the conv layer through the base model
        base_model_output = base_model(model.input)
        
        # We need to rebuild to get intermediate outputs
        # Create a new model that outputs both conv features and predictions
        intermediate_model = keras.Model(
            inputs=base_model.input,
            outputs=base_model.get_layer(conv_layer.name).output
        )
        
        # Get conv outputs
        with tf.GradientTape() as tape:
            # Forward pass through base model to get conv outputs
            conv_outputs = intermediate_model(img_array)
            tape.watch(conv_outputs)
            
            # Continue forward pass to get predictions
            x = layers.GlobalAveragePooling2D()(conv_outputs)
            
            # We need predictions, so use the full model
            predictions = model(img_array)
            loss = predictions[:, class_idx]
        
        # Get gradients
        grads = tape.gradient(loss, conv_outputs)
        
        if grads is None:
            # Fallback: simple attention-based visualization
            return generate_simple_attention(model, img_array, class_idx)
        
        # Global average pooling of gradients
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        
        # Weight conv outputs by gradients
        conv_outputs = conv_outputs[0]
        heatmap = tf.reduce_sum(tf.multiply(pooled_grads, conv_outputs), axis=-1)
        
        # ReLU and normalize
        heatmap = np.maximum(heatmap.numpy(), 0)
        if np.max(heatmap) > 0:
            heatmap /= np.max(heatmap)
        
        return heatmap
        
    except Exception as e:
        print(f"⚠️ Grad-CAM error: {str(e)}")
        # Fallback to simple attention
        return generate_simple_attention(model, img_array, class_idx)

def generate_simple_attention(model, img_array, class_idx):
    """
    Generate a simple attention map based on gradient of output w.r.t. input
    Fallback when Grad-CAM fails
    """
    try:
        img_tensor = tf.convert_to_tensor(img_array)
        
        with tf.GradientTape() as tape:
            tape.watch(img_tensor)
            predictions = model(img_tensor)
            loss = predictions[:, class_idx]
        
        grads = tape.gradient(loss, img_tensor)
        
        if grads is None:
            return None
        
        # Take absolute value and average across channels
        attention = tf.reduce_mean(tf.abs(grads), axis=-1)[0]
        attention = attention.numpy()
        
        # Normalize
        if np.max(attention) > 0:
            attention /= np.max(attention)
        
        return attention
        
    except Exception as e:
        print(f"⚠️ Attention map error: {str(e)}")
        return None

def create_gradcam_overlay(original_image, heatmap, alpha=0.4):
    """
    Overlay Grad-CAM heatmap on original image
    
    Returns base64 encoded image
    """
    # Convert PIL image to numpy array
    img_array = np.array(original_image)
    
    # Resize heatmap to match image size
    heatmap_resized = cv2.resize(heatmap, (img_array.shape[1], img_array.shape[0]))
    
    # Convert heatmap to RGB colormap
    heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    # Overlay heatmap on original image
    overlay = np.uint8(img_array * (1 - alpha) + heatmap_colored * alpha)
    
    # Convert to base64
    overlay_image = Image.fromarray(overlay)
    buffer = io.BytesIO()
    overlay_image.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def create_heatmap_only(heatmap):
    """Create standalone heatmap image as base64"""
    # Resize to standard size
    heatmap_resized = cv2.resize(heatmap, IMAGE_SIZE)
    
    # Apply colormap
    heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    # Convert to base64
    heatmap_image = Image.fromarray(heatmap_colored)
    buffer = io.BytesIO()
    heatmap_image.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    success = load_model_and_metadata()
    if not success:
        print("⚠️ Model loading failed. Please train the model first.")

@app.get("/")
async def root():
    """API health check"""
    return {
        "status": "healthy",
        "service": "Govi Isuru Rice Disease Predictor",
        "version": "2.0.0",
        "model_loaded": model is not None,
        "classes": list(class_indices.keys()) if class_indices else []
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    """
    Predict rice leaf disease from uploaded image
    
    Returns:
    - prediction: Disease name
    - confidence: Prediction confidence (0-1)
    - all_predictions: All class probabilities
    - disease_info: Treatment and information
    - gradcam: Grad-CAM visualization (base64)
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please ensure the model is trained and available."
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image."
        )
    
    try:
        # Read image
        image_bytes = await file.read()
        
        # Preprocess
        img_array, original_image = preprocess_image(image_bytes)
        
        # Predict
        predictions = model.predict(img_array, verbose=0)[0]
        
        # Get top prediction
        predicted_idx = int(np.argmax(predictions))
        confidence = float(predictions[predicted_idx])
        predicted_class = class_names[predicted_idx]
        
        # Generate Grad-CAM
        gradcam_data = None
        heatmap = generate_gradcam(model, img_array, predicted_idx)
        
        if heatmap is not None:
            overlay_base64 = create_gradcam_overlay(original_image, heatmap)
            heatmap_base64 = create_heatmap_only(heatmap)
            gradcam_data = {
                "overlay": overlay_base64,
                "heatmap": heatmap_base64
            }
        
        # Get disease information
        info = disease_info.get(predicted_class, {})
        
        # Build all predictions
        all_preds = []
        for idx, prob in enumerate(predictions):
            all_preds.append({
                "class": class_names[idx],
                "probability": float(prob)
            })
        all_preds.sort(key=lambda x: x['probability'], reverse=True)
        
        return JSONResponse({
            "success": True,
            "prediction": predicted_class,
            "confidence": confidence,
            "si_name": info.get("si_name", predicted_class),
            "description": info.get("description", ""),
            "treatment": info.get("treatment", []),
            "severity": info.get("severity", "unknown"),
            "all_predictions": all_preds,
            "gradcam": gradcam_data
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

@app.get("/classes")
async def get_classes():
    """Get list of all disease classes"""
    if class_indices is None:
        return {"classes": []}
    
    classes_with_info = []
    for class_name in class_indices.keys():
        info = disease_info.get(class_name, {})
        classes_with_info.append({
            "name": class_name,
            "si_name": info.get("si_name", class_name),
            "severity": info.get("severity", "unknown")
        })
    
    return {"classes": classes_with_info}

@app.get("/disease/{disease_name}")
async def get_disease_info(disease_name: str):
    """Get detailed information about a specific disease"""
    if disease_info is None:
        raise HTTPException(status_code=503, detail="Disease info not loaded")
    
    # Find disease (case-insensitive)
    for name, info in disease_info.items():
        if name.lower() == disease_name.lower():
            return {
                "name": name,
                **info
            }
    
    raise HTTPException(status_code=404, detail=f"Disease '{disease_name}' not found")

if __name__ == "__main__":
    print("=" * 60)
    print("🌾 Govi Isuru - Rice Disease Predictor API")
    print("=" * 60)
    
    # Check for GPU
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        print(f"🎮 GPU available: {len(gpus)} device(s)")
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    else:
        print("💻 Running on CPU")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
