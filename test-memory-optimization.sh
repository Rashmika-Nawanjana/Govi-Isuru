#!/bin/bash
# Test script to verify memory optimizations

echo "================================="
echo "Memory Optimization Test Script"
echo "================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "1️⃣ Cleaning up old containers..."
docker compose down

echo ""
echo "2️⃣ Building optimized AI service image..."
docker compose build ai-service

echo ""
echo "3️⃣ Checking image size..."
echo "Before optimization: ~3.5GB"
echo "After optimization:"
docker images | grep govi-isuru-ai-service | head -1

echo ""
echo "4️⃣ Starting containers..."
docker compose up -d

echo ""
echo "5️⃣ Waiting for API to be ready (10 seconds)..."
sleep 10

echo ""
echo "6️⃣ Initial memory usage (should be ~200-300MB for ai-service):"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "7️⃣ Testing health endpoint..."
curl -s http://localhost:8000/ | jq '.models_loaded'

echo ""
echo "8️⃣ Testing first prediction (will trigger model load, expect 2-3s delay)..."
echo "Note: This test requires a sample image. Skipping if not available."

# Optional: Test with a sample image if available
# curl -X POST "http://localhost:8000/predict?crop_type=rice" \
#   -F "file=@test_image.jpg" | jq '.confidence'

echo ""
echo "9️⃣ Memory usage after first prediction (should be ~800-1200MB):"
sleep 5
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "✅ Memory optimization test complete!"
echo ""
echo "Expected results:"
echo "- Image size: ~1.8GB (down from 3.5GB)"
echo "- Initial memory: 200-300MB (down from 2.5GB)"
echo "- After 1 prediction: 800-1200MB (down from 2.5GB)"
echo ""
echo "To monitor continuously: docker stats"
