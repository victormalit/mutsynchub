#!/bin/bash

# Exit on error
set -e

echo "Setting up MutSyncHub Analytics Environment..."

# Get the absolute path to the server directory
SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SERVER_DIR"

# Clean up any existing virtual environment
if [ -d "venv" ]; then
    echo "Removing existing virtual environment..."
    rm -rf venv
fi

# Get system Python path
PYTHON_PATH=$(which python3)
echo "Using Python: $PYTHON_PATH"
$PYTHON_PATH --version

# Create new virtual environment
echo "Creating new virtual environment..."
$PYTHON_PATH -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip and install build tools
echo "Upgrading pip and installing build tools..."
python -m pip install --upgrade pip setuptools wheel

# Install base numeric packages first
echo "Installing base numeric packages..."
python -m pip install Cython numpy pandas

# Install all dependencies
echo "Installing all dependencies..."
python -m pip install -e .
