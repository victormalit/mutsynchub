import sys
print(f"Python executable: {sys.executable}")

try:
    import pandas
    print("pandas version:", pandas.__version__)
except ImportError:
    print("pandas not installed")

try:
    import numpy
    print("numpy version:", numpy.__version__)
except ImportError:
    print("numpy not installed")

try:
    import prophet
    print("prophet version:", prophet.__version__)
except ImportError:
    print("prophet not installed")

try:
    import sklearn
    print("scikit-learn version:", sklearn.__version__)
except ImportError:
    print("scikit-learn not installed")
