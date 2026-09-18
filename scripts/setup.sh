#!/usr/bin/env bash
# One-time project setup: copies env files and installs dependencies for all 3 services.
set -e

echo "Setting up environment files..."
cp -n .env.example .env || true
cp -n mobile/.env.example mobile/.env || true
cp -n backend/.env.example backend/.env || true
cp -n ai-service/.env.example ai-service/.env || true

echo "Installing backend dependencies..."
(cd backend && npm install)

echo "Installing mobile dependencies..."
(cd mobile && npm install)

echo "Installing ai-service dependencies..."
(cd ai-service && pip install -r requirements.txt)

echo "Setup complete. Fill in the .env files with real credentials, then run scripts/dev.sh"
