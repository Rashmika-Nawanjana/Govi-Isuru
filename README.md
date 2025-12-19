# 🌾 Govi Isuru - Smart Farming Platform for Sri Lanka

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2.3-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-green.svg)](https://fastapi.tiangolo.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-brightgreen.svg)](https://nodejs.org/)

**Govi Isuru** (Sinhala: ගොවි ඉසුරු) is a comprehensive digital farming platform designed to empower Sri Lankan farmers with AI-driven crop disease detection, real-time market intelligence, weather advisory, and a peer-to-peer marketplace. The name "Govi Isuru" translates to "Farmer's Fortune" in Sinhala, reflecting our mission to bring prosperity to the agricultural community.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [AI Model Information](#-ai-model-information)
- [Environment Variables](#-environment-variables)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🤖 AI Crop Doctor
- **Deep Learning Disease Detection**: Upload photos of rice crop leaves to detect diseases like Bacterial Leaf Blight, Brown Spot, and Leaf Smut
- **Confidence Scoring**: Get prediction confidence levels for accurate diagnosis
- **Treatment Recommendations**: Receive bilingual (English/Sinhala) treatment guidance for detected diseases
- **Transfer Learning**: Utilizes MobileNetV2 pre-trained on ImageNet for superior accuracy with limited training data
- **Balanced Model Training**: Implements class weighting to handle imbalanced datasets
- **🔥 Grad-CAM Explainability**: Visual heatmaps show exactly where the AI detected disease symptoms, building trust through transparency
  - Red areas indicate disease-affected regions
  - Side-by-side comparison of original image and AI detection map
  - Bilingual explanations for farmer understanding

### 📊 Market Intelligence Dashboard
- **Price Trend Analytics**: Visualize historical price trends for major crops (Rice, Chili, Tea) across 6 months
- **District Price Comparison**: Compare real-time prices across major Sri Lankan economic centers:
  - Dambulla
  - Thambutthegama
  - Keppetipola
  - Colombo (Manning Market)
  - Kandy
- **Interactive Charts**: Built with Recharts for responsive data visualization
- **Data-Driven Decisions**: Help farmers choose optimal selling times and locations

### 🛒 AgroLink Marketplace
- **Peer-to-Peer Trading**: Direct connection between farmers and buyers
- **Comprehensive Listings**: Post and browse crop listings with details:
  - Farmer name, location, phone
  - Crop type, quantity, price
  - Date posted
- **Instant Communication**: 
  - WhatsApp integration for quick messaging
  - Direct call functionality
  - Pre-filled message templates in English and Sinhala
- **MongoDB-Powered**: Scalable storage for marketplace data

### 🌤️ Weather Advisory
- **Real-Time Weather Data**: Integration with OpenWeatherMap API
- **Location-Based Forecasting**: Automatic geolocation or manual district selection
- **5-Day Forecast**: Plan agricultural activities with extended weather predictions
- **Agricultural Recommendations**: 
  - Humidity-based fungal disease warnings
  - Rain alerts for fertilizer application timing
  - Wind speed and temperature data
- **Localized Insights**: Weather data specific to Sri Lankan farming regions

### 👤 User Authentication & Profiles
- **Secure Registration**: JWT-based authentication with bcrypt password hashing
- **Administrative Location Tracking**: 
  - District-level data
  - DS Division (Divisional Secretariat)
  - GN Division (Grama Niladhari) for precise location tracking
- **Persistent Sessions**: Token-based login with localStorage
- **User Dashboard**: Personalized greeting with location badge

### 🌐 Bilingual Support
- **Full English/Sinhala Translation**: Toggle between languages instantly
- **Cultural Adaptation**: 
  - Sinhala Unicode support
  - Localized terminology for agricultural concepts
  - Culturally appropriate messaging

## 🛠️ Tech Stack

### Frontend
- **React 19.2.3**: Modern UI with hooks and context
- **Tailwind CSS 3.4.1**: Utility-first styling for responsive design
- **Lucide React**: Beautiful, consistent icon library
- **Recharts 3.6.0**: Data visualization for market analytics
- **Axios 1.13.2**: HTTP client for API communication
- **React Router**: (Implicit navigation via state management)

### Backend (Server)
- **Node.js**: Runtime environment
- **Express 5.2.1**: Web application framework
- **MongoDB**: Database via Mongoose 9.0.2
- **Mongoose**: ODM for MongoDB with schema validation
- **JWT (jsonwebtoken 9.0.3)**: Secure authentication
- **Bcrypt.js 3.0.3**: Password hashing
- **CORS 2.8.5**: Cross-origin resource sharing
- **Dotenv 17.2.3**: Environment variable management

### AI Service
- **FastAPI**: High-performance Python web framework
- **TensorFlow/Keras**: Deep learning model training and inference
- **Pillow (PIL)**: Image processing
- **NumPy**: Numerical computations
- **Uvicorn**: ASGI server for FastAPI
- **Scikit-learn**: Class weight calculation for balanced training
- **OpenCV (cv2)**: Image manipulation for Grad-CAM visualization
- **Grad-CAM**: Explainable AI technique for visual interpretation

### DevOps & Deployment
- **Docker**: Containerization for all services
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy for React production build
- **Multi-stage Builds**: Optimized container images

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                       │
│  - UI Components (AIDoctor, Marketplace, Weather, Trends)   │
│  - State Management (useState, useEffect)                   │
│  - Axios HTTP Client                                        │
└────────────┬──────────────────────────┬─────────────────────┘
             │                          │
             │ REST API                 │ REST API
             │ (Port 5000)              │ (Port 8888)
             ▼                          ▼
┌────────────────────────┐   ┌────────────────────────────┐
│   BACKEND (Express)    │   │   AI SERVICE (FastAPI)     │
│  - User Auth (JWT)     │   │  - TensorFlow Model        │
│  - Marketplace CRUD    │   │  - Image Preprocessing     │
│  - Market Price API    │   │  - Disease Prediction      │
│  - MongoDB Integration │   │  - Treatment Data          │
└───────────┬────────────┘   └────────────────────────────┘
            │
            │ Mongoose ODM
            ▼
┌────────────────────────┐
│   MongoDB (Cloud)      │
│  - Users Collection    │
│  - Listings Collection │
└────────────────────────┘

External APIs:
- OpenWeatherMap API (Weather data)
- MongoDB Atlas (Database hosting)
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** v22.x or higher
- **Python** 3.8+ (for AI service)
- **MongoDB** (Local or MongoDB Atlas account)
- **Docker** (optional, for containerized deployment)
- **OpenWeatherMap API Key** (free tier available)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/govi-isuru.git
cd govi-isuru
```

#### 2. Setup Backend Server
```bash
cd server
npm install

# Create .env file
echo "MONGO_URI=your_mongodb_connection_string" > .env
echo "JWT_SECRET=your_secret_key" >> .env
echo "PORT=5000" >> .env

# Start the server
```

#### 3. Setup Frontend Client
```bash
cd ../client
npm install

# Create .env file for weather API
echo "REACT_APP_WEATHER_KEY=your_openweathermap_api_key" > .env

# Start development server
npm start
```

#### 4. Setup AI Service
```bash
cd ../ai-service
pip install fastapi uvicorn tensorflow pillow numpy python-multipart scikit-learn opencv-python

# Ensure the trained model exists
# If not, run the training script:
python train_model.py

# Start the AI service
python main.py
```

The application will be accessible at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8888

### Docker Deployment

For production deployment using Docker:

```bash
# From the root directory
docker-compose up --build

# Access the application
# Frontend: http://localhost:80
# Backend: http://localhost:5000
```

**Note**: The AI service is not yet containerized in docker-compose.yml. To add it, create a Dockerfile in `ai-service/` and extend docker-compose.yml.

## 📁 Project Structure

```
govi-isuru/
├── client/                          # React Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── AIDoctor.js          # Disease detection UI
│   │   │   ├── Marketplace.js       # P2P marketplace
│   │   │   ├── MarketTrends.js      # Analytics dashboard
│   │   │   ├── PriceAnalytics.js    # Line chart component
│   │   │   ├── PriceComparison.js   # Bar chart component
│   │   │   ├── WeatherAdvisor.js    # Weather forecast UI
│   │   │   ├── Register.js          # User registration
│   │   │   └── Login.js             # User login
│   │   ├── data/
│   │   │   └── sriLankaData.js      # Administrative divisions
│   │   ├── App.js                   # Main application component
│   │   ├── index.js                 # React entry point
│   │   └── index.css                # Global styles
│   ├── Dockerfile                   # Multi-stage build for React
│   ├── package.json                 # Dependencies
│   └── tailwind.config.js           # Tailwind configuration
│
├── server/                          # Node.js Backend
│   ├── models/
│   │   └── User.js                  # User schema
│   ├── index.js                     # Express server
│   ├── Dockerfile                   # Node.js container
│   ├── package.json                 # Dependencies
│   └── .env                         # Environment variables (not in repo)
│
├── ai-service/                      # Python AI Service
│   ├── dataset/                     # Training images
│   │   ├── Bacterial leaf blight/
│   │   ├── Brown spot/
│   │   └── Leaf smut/
│   ├── main.py                      # FastAPI prediction API
│   ├── train_model.py               # Model training script
│   ├── gradcam.py                   # Grad-CAM explainability module
│   ├── rice_model_v2.h5             # Trained model (generated)
│   └── __pycache__/                 # Python cache
│
├── docker-compose.yml               # Multi-container orchestration
└── README.md                        # This file
```

## 📡 API Documentation

### Backend Server (Express)

#### Authentication

**POST** `/api/register`
```json
{
  "username": "string",
  "password": "string",
  "district": "string",
  "dsDivision": "string",
  "gnDivision": "string"
}
```
**Response**: `{ "token": "JWT", "user": {...} }`

**POST** `/api/login`
```json
{
  "username": "string",
  "password": "string"
}
```
**Response**: `{ "token": "JWT", "user": {...} }`

#### Marketplace

**GET** `/api/listings`
- Returns all marketplace listings (sorted by date, newest first)

**POST** `/api/listings`
```json
{
  "farmerName": "string",
  "cropType": "string",
  "quantity": "string",
  "price": "string",
  "location": "string",
  "phone": "string"
}
```

#### Market Data

**GET** `/api/price-trends`
- Returns 6-month price trend data for Rice, Chili, Tea

**GET** `/api/market-prices`
- Returns current prices across 5 major Sri Lankan districts

### AI Service (FastAPI)

**POST** `/predict`
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (image file)

**Response**:
```json
{
  "disease": "Bacterial leaf blight",
  "confidence": 0.89,
  "treatment": "Reduce Nitrogen fertilizer. Manage water levels properly.",
  "treatment_si": "නයිට්‍රජන් පොහොර භාවිතය අඩු කරන්න. ජල මට්ටම පාලනය කරන්න.",
  "heatmap": "base64_encoded_image_string",
  "explanation": "Red areas show where the AI detected disease symptoms on the leaf.",
  "explanation_si": "රතු පැහැයෙන් දිස්වන කොටස් AI විසින් රෝග ලක්ෂණ හඳුනාගත් ස්ථාන වේ."
}
```

## 🧠 AI Model Information

### Model Architecture
- **Base Model**: MobileNetV2 (pre-trained on ImageNet)
- **Transfer Learning**: Frozen base, custom top layers
- **Input Shape**: 224x224x3 RGB images
- **Output Classes**: 3 (Bacterial leaf blight, Brown spot, Leaf smut)
- **Final Activation**: Softmax (multi-class classification)

### Training Configuration
- **Optimizer**: Adam (learning rate: 0.0001)
- **Loss Function**: Categorical Crossentropy
- **Epochs**: 15
- **Batch Size**: 32
- **Data Augmentation**: 
  - Rotation (40°)
  - Width/Height shift (20%)
  - Shear, Zoom (20%)
  - Horizontal flip
- **Validation Split**: 20%
- **Class Balancing**: Computed class weights to handle imbalanced dataset

### Training the Model

```bash
cd ai-service
python train_model.py
```

This will:
1. Load images from `dataset/` directory
2. Apply data augmentation
3. Calculate class weights for balanced training
4. Train MobileNetV2 with custom layers
5. Save the model as `rice_model_v2.h5`

### Dataset Structure
```
ai-service/dataset/
├── Bacterial leaf blight/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
├── Brown spot/
│   └── ...
└── Leaf smut/
    └── ...
```

### Explainable AI (Grad-CAM)

**Govi Isuru** implements **Gradient-weighted Class Activation Mapping (Grad-CAM)** to provide visual explanations for AI predictions, a critical feature for building farmer trust.

#### What is Grad-CAM?
Grad-CAM generates a heatmap that highlights which regions of the leaf image the AI model focused on when making its disease prediction.

#### How It Works
1. **Forward Pass**: Image is processed through the neural network
2. **Gradient Calculation**: Computes gradients of the predicted class with respect to the last convolutional layer
3. **Importance Weighting**: Determines which feature maps are most important for the prediction
4. **Heatmap Generation**: Creates a visual overlay showing disease-affected areas

#### Visual Output
- **🔴 Red regions**: High attention - likely disease symptoms detected here
- **🟡 Yellow regions**: Moderate attention
- **🔵 Blue regions**: Low attention - healthy tissue

#### Benefits
- **Transparency**: Shows exactly where disease was detected
- **Trust Building**: Farmers can verify AI reasoning
- **Educational**: Helps farmers recognize disease patterns
- **Debugging**: Ensures model focuses on relevant features, not background

#### Technical Implementation
- **Base Layer**: `Conv_1` (MobileNetV2's final convolutional layer)
- **Overlay Alpha**: 0.4 (40% heatmap, 60% original image)
- **Colormap**: JET (blue → red scale)
- **Output Format**: Base64-encoded PNG for web display

## 🔐 Environment Variables

### Backend Server (`.env` in `server/`)
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/govi-isuru
JWT_SECRET=your_super_secret_key_here
PORT=5000
```

### Frontend Client (`.env` in `client/`)
```env
REACT_APP_WEATHER_KEY=your_openweathermap_api_key
```

**Important**: 
- Never commit `.env` files to version control
- For MongoDB Atlas, whitelist your IP address in Network Access
- OpenWeatherMap free tier allows 1,000 calls/day

## 📸 Screenshots

### AI Crop Doctor
![AI Doctor Interface](docs/screenshots/ai-doctor.png)
*Upload crop leaf images for instant disease diagnosis with treatment recommendations*

### Marketplace
![Marketplace](docs/screenshots/marketplace.png)
*Connect directly with buyers through WhatsApp or phone calls*

### Market Trends
![Market Analytics](docs/screenshots/market-trends.png)
*Visualize price trends and compare rates across districts*

### Weather Advisory
![Weather Forecast](docs/screenshots/weather.png)
*5-day weather forecast with agricultural recommendations*

## 🌟 Key Innovations

1. **Bilingual Support**: First-class Sinhala language support for rural farmers
2. **Explainable AI with Grad-CAM**: Visual heatmaps show exactly where diseases are detected, building trust through transparency
3. **Location Intelligence**: GN Division-level precision for hyper-local services
4. **Class-Balanced ML**: Ensures minority disease classes are detected accurately
5. **Transfer Learning**: Achieves high accuracy with limited training data
6. **Integrated Communication**: Direct WhatsApp/call links from marketplace
7. **Farmer-Centric UX**: Simplified, icon-driven interface for low digital literacy

## 🤝 Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add comments for complex logic
- Test on both English and Sinhala interfaces
- Ensure mobile responsiveness
- Update documentation for new features

## 📝 Future Roadmap

- [ ] Containerize AI service in Docker
- [ ] Add more crop types and diseases
- [ ] Implement real-time chat for marketplace
- [ ] Integrate government subsidy information
- [ ] Add soil health monitoring
- [ ] Create mobile app (React Native)
- [ ] Multi-language support (Tamil)
- [ ] IoT sensor integration for farm monitoring
- [ ] AI-powered crop yield prediction
- [ ] Community forum for farmers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Team Name** - *Initial work*

## 🙏 Acknowledgments

- **Sri Lankan Farmers**: For inspiring this project
- **Department of Agriculture, Sri Lanka**: For agricultural data insights
- **OpenWeatherMap**: For weather API
- **TensorFlow Team**: For the deep learning framework
- **MongoDB**: For database infrastructure
- **Tailwind CSS**: For the beautiful UI components

## 📞 Contact

For questions, suggestions, or collaboration:
- **Email**: contact@goviisuru.lk
- **GitHub**: [github.com/yourusername/govi-isuru](https://github.com/yourusername/govi-isuru)
- **Website**: [www.goviisuru.lk](https://www.goviisuru.lk)

---

<div align="center">
  <p><strong>Built with ❤️ for Sri Lankan Farmers</strong></p>
  <p>ගොවි ඉසුරු - ශ්‍රී ලාංකීය ගොවීන් සවිබල ගැන්වීම</p>
</div>
