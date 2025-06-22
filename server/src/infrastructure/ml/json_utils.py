import json
from datetime import datetime
import numpy as np
import pandas as pd

class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for handling numpy, pandas types, and tuples as dictionary keys."""
    def default(self, obj):
        """Custom JSON encoder for handling numpy and pandas types."""
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
            np.int16, np.int32, np.int64, np.uint8,
            np.uint16, np.uint32, np.uint64)):
            return int(obj)
        elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, (pd.Timestamp, datetime)):
            return obj.isoformat()
        elif isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        elif isinstance(obj, pd.Series):
            return obj.to_dict()
        return super().default(obj)
