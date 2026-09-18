#!/usr/bin/env bash
# Runs unit + integration tests for backend, then ai-service tests.
set -e
(cd backend && npm test)
(cd ai-service && pytest)
