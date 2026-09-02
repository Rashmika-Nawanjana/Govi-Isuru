#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ubuntu/govi-isuru"
DOMAIN="govi-isuru.rashmika.dev"

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Missing ${APP_DIR}/.env"
  exit 1
fi

if ! grep -q '^REFRESH_TOKEN_SECRET=' .env; then
  REFRESH_SECRET="$(openssl rand -hex 32)"
  echo "REFRESH_TOKEN_SECRET=${REFRESH_SECRET}" | sudo tee -a .env >/dev/null
  echo "Added REFRESH_TOKEN_SECRET"
fi

sudo sed -i "s|^APP_URL=.*|APP_URL=https://${DOMAIN}|" .env || true
sudo sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=https://${DOMAIN}|" .env || true

sudo systemctl stop nginx || true
sudo docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
sudo docker image prune -f

echo "Waiting for services..."
sleep 30
sudo docker compose -f docker-compose.prod.yml ps
curl -s http://localhost:5000/health || true
echo
