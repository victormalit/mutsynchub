#!/usr/bin/env python3
"""Debug script to verify Python environment and package installation"""
import os
import sys
import subprocess

def check_environment():
    """Check Python environment and package installation"""
    print("=== Python Environment Information ===")
    print(f"Python Version: {sys.version}")
    print(f"Python Executable: {sys.executable}")
    print(f"Python Path: {sys.path}")
    
    print("\n=== Package Installation Status ===")
    packages = [
        "pandas",
        "numpy",
        "prophet",
        "redis",
        "scikit-learn",
        "scipy",
        "statsmodels",
        "networkx"
    ]
    
    for package in packages:
        try:
            module = __import__(package)
            version = getattr(module, '__version__', 'unknown')
            print(f"{package}: Successfully imported (version {version})")
        except ImportError as e:
            print(f"{package}: Import failed - {str(e)}")

    print("\n=== Environment Variables ===")
    relevant_vars = ['PYTHONPATH', 'VIRTUAL_ENV', 'PATH']
    for var in relevant_vars:
        print(f"{var}: {os.environ.get(var, 'Not set')}")

if __name__ == "__main__":
    check_environment()
