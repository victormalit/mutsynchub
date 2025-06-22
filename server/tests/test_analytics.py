import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from src.infrastructure.ml.analytics_service import AnalyticsService

def test_analytics_service():
    # Create sample data
    np.random.seed(42)
    dates = pd.date_range(start='2025-01-01', end='2025-05-21', freq='D')
    data = {
        'date': dates,
        'sales_amount': np.random.normal(1000, 200, len(dates)),
        'customer_id': np.random.randint(1, 100, len(dates)),
        'stock_level': np.random.normal(500, 100, len(dates)),
        'price': np.random.normal(50, 10, len(dates)),
        'competitor_price': np.random.normal(55, 12, len(dates))
    }
    df = pd.DataFrame(data)

    # Initialize and test AnalyticsService
    service = AnalyticsService()
    results = service.perform_eda(df.to_dict('records'), industry='retail')

    # Print test results
    print('Basic Stats Available:', 'basic_stats' in results)
    print('Outliers Detected:', 'outliers' in results)
    print('Industry Metrics:', 'industry_metrics' in results)
    print('Cross Industry Insights:', 'cross_industry_insights' in results)
    print('\nSample Retail Metrics:')
    if 'industry_metrics' in results:
        print(results['industry_metrics']['sales_performance'])

    # Test forecasting functionality
    forecast = service.forecast_timeseries(df.to_dict('records'), 'date', 'sales_amount', periods=7)
    print('\nForecast Results Available:', bool(forecast))

    # Test Redis caching
    cached = service.get_cached_forecast('date', 'sales_amount')
    print('Forecast Cache Working:', bool(cached))

if __name__ == '__main__':
    test_analytics_service()
