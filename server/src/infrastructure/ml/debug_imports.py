import sys
print("Python version:", sys.version)

try:
    import pandas as pd
    print("Pandas version:", pd.__version__)
except ImportError as e:
    print("Pandas import error:", e)
    print("Python path:", sys.path)

try:
    import prophet
    print("Prophet version:", prophet.__version__)
except ImportError as e:
    print("Prophet import error:", e)
    print("Python path:", sys.path)

try:
    import sklearn
    print("Scikit-learn version:", sklearn.__version__)
except ImportError as e:
    print("Scikit-learn import error:", e)
    print("Python path:", sys.path)
