#!/bin/bash

# Exit on error
set -e

echo "Running tests for MutSyncHub Analytics..."

# Set up environment
export PYTHONPATH=/home/peter/mutsynchub/server

# Activate virtual environment
source venv/bin/activate

# Run tests with full output
python -m pytest tests/test_analytics_service.py -vv --capture=no
