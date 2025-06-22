from setuptools import setup, find_packages

setup(
    name="mutsynchub-analytics",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8,<3.13",
    install_requires=[
        "pandas~=2.0.0",
        "numpy~=1.24.0",
        "prophet~=1.1.4",
        "redis~=5.0.0",
        "scikit-learn~=1.3.0",
        "scipy~=1.11.0",
        "statsmodels~=0.14.0",
        "networkx~=3.2.1",
        "Cython>=0.22",  # Required for prophet
        "cmdstanpy>=1.0.4",  # Required for prophet
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pylint>=2.17.0",
            "black>=23.0.0",
            "isort>=5.12.0",
        ]
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)
