import sys
import pandas as pd
import numpy as np
from prophet import Prophet
import redis
from sklearn.preprocessing import StandardScaler
import networkx as nx
from statsmodels.tsa.seasonal import seasonal_decompose

# Print versions
print(f"Python version: {sys.version}")
print(f"Pandas version: {pd.__version__}")
print(f"NumPy version: {np.__version__}")
print(f"Prophet version: {Prophet.__version__}")
print(f"Redis version: {redis.__version__}")
print(f"Scikit-learn version: {StandardScaler.__module__.split('.')[0]}")
print(f"NetworkX version: {nx.__version__}")
print(f"Statsmodels version: {seasonal_decompose.__module__.split('.')[0]}")

print("\nAll imports successful!")
