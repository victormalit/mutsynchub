#!/bin/bash

# Setup script for MutSyncHub analytics environment

echo "Setting up MutSyncHub analytics environment..."

# Check if we're in the right directory
if [ ! -f "setup.py" ]; then
    echo "Error: Must be run from the server directory containing setup.py"
    exit 1
fi

# Create and activate virtual environment
echo "Creating virtual environment..."
rm -rf venv
python3 -m venv venv
source venv/bin/activate

# Upgrade pip and install basic build tools
echo "Installing build prerequisites..."
pip install --upgrade pip setuptools wheel
pip install Cython numpy pandas

# Install the package in development mode
echo "Installing package dependencies..."
pip install -e .[dev]

# Run environment check
echo "Verifying environment..."
python3 debug_env.py

echo "Setup complete. To activate the environment:"
echo "source venv/bin/activate"
