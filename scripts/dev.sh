#!/usr/bin/env bash
# Starts db + backend + ai-service via Docker, and prints the command to start mobile separately.
set -e
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
