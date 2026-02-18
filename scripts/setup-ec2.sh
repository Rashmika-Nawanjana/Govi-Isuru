#!/bin/bash

# ====================================
# GOVI-ISURU EC2 Initial Setup
# ====================================
# Run this ONCE on a fresh Ubuntu EC2 instance
# Usage: ssh -i goviisuru.pem ubuntu@<IP> 'bash -s' < scripts/setup-ec2.sh

set -e

echo "🚀 Setting up GOVI-ISURU EC2 instance..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose plugin (v2)
echo "📦 Ensuring Docker Compose is available..."
if ! docker compose version &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already available"
fi

# Create project directory
echo "📁 Creating project directory..."
mkdir -p /home/$USER/govi-isuru

# Create swap file (extra safety for memory)
echo "💾 Setting up 2GB swap..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap configured"
else
    echo "✅ Swap already exists"
fi

# Install useful tools
echo "🔧 Installing utilities..."
sudo apt-get install -y htop curl wget git

echo ""
echo "========================================="
echo "✅ EC2 SETUP COMPLETE!"
echo "========================================="
echo ""
echo "📋 Next steps:"
echo "1. Create a .env file in /home/$USER/govi-isuru/"
echo "   with your production secrets (MONGO_URI, JWT_SECRET, etc.)"
echo ""
echo "2. Push to GitHub 'main' branch to trigger auto-deploy"
echo "   OR manually copy files and run:"
echo "   cd /home/$USER/govi-isuru"
echo "   sudo docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "3. Check status:"
echo "   sudo docker compose -f docker-compose.prod.yml ps"
echo "   sudo docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "⚠️  NOTE: Log out and back in for Docker group to take effect"
echo "   (or run: newgrp docker)"
echo ""
