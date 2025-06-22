import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.infrastructure.ml.analytics_service import AnalyticsService
import pandas as pd
import numpy as np

def main():
    print("Testing Analytics Service...")
    
    # Initialize service
    service = AnalyticsService(redis_host='localhost', redis_port=6379)
    
    # Create sample data
    dates = pd.date_range(start='2025-01-01', periods=100, freq='D')
    values = np.random.normal(100, 10, 100)
    data = [{'date': d.strftime('%Y-%m-%d'), 'value': float(v)} for d, v in zip(dates, values)]
    
    try:
        print("\nTesting time series analysis...")
        result = service.analyze_time_series(data=data, date_column='date', value_column='value')
        print("Time series result keys:", result.keys() if result else "No result")
    except Exception as e:
        print("Time series error:", str(e))
    
    try:
        print("\nTesting pattern detection...")
        data = [{'metric1': np.random.normal(100, 10), 'metric2': np.random.normal(50, 5)} for _ in range(100)]
        result = service.pattern_detection(data=data, numeric_columns=['metric1', 'metric2'])
        print("Pattern detection result keys:", result.keys() if result else "No result")
    except Exception as e:
        print("Pattern detection error:", str(e))

if __name__ == '__main__':
    main()
