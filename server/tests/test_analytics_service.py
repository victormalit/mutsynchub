import pytest
import pandas as pd
import numpy as np
import math
from datetime import datetime, timedelta
from src.infrastructure.ml.industry_analytics_service import IndustryAnalyticsService

@pytest.fixture
def analytics_service():
    return IndustryAnalyticsService()  # Use modular industry analytics service

@pytest.fixture
def sample_time_series_data():
    # Generate 100 days of sample data with additional metrics
    dates = pd.date_range(start='2025-01-01', periods=100, freq='D')
    base_values = np.random.normal(100, 10, 100) + np.sin(np.arange(100) * 0.1) * 20
    return [
        {
            'date': d.strftime('%Y-%m-%d'),
            'value': float(v),
            'sales_amount': float(v * 1.2),
            'customer_id': np.random.randint(1, 20),
            'stock_level': float(v * 2),
            'price': float(v * 0.1),
            'competitor_price': float(v * 0.11),
            'transaction_id': f"T{i+1}",
            'product_id': f"P{np.random.randint(1, 10)}"  # 9 different products
        }
        for i, (d, v) in enumerate(zip(dates, base_values))
    ]

def test_comprehensive_analysis(analytics_service, sample_time_series_data):
    """Test the comprehensive analytics features"""
    print("\nRunning comprehensive analytics test...")
    try:
        # Test EDA with retail industry context
        eda_result = analytics_service.perform_eda(sample_time_series_data, industry='retail')
        assert isinstance(eda_result, dict)
        assert 'basic_stats' in eda_result
        assert 'correlation_matrix' in eda_result
        assert 'industry_metrics' in eda_result
        assert 'cross_industry_insights' in eda_result

        # Verify retail-specific metrics
        retail_metrics = eda_result['industry_metrics']
        assert 'sales_performance' in retail_metrics
        assert any(key in retail_metrics for key in ['customer_behavior', 'customer_metrics'])
        assert any(key in retail_metrics for key in ['inventory', 'inventory_turnover'])

        # Test cross-industry insights
        insights = eda_result['cross_industry_insights']
        assert 'market_dynamics' in insights
        assert 'customer_insights' in insights
        assert 'operational_efficiency' in insights

        # Test time series forecasting
        forecast_result = analytics_service.forecast_timeseries(
            data=sample_time_series_data,
            date_column='date',
            value_column='value'
        )
        assert 'forecast' in forecast_result
        assert 'components' in forecast_result
        assert len(forecast_result['forecast']) > 0

        # Test cache functionality - immediately after forecasting
        cached_forecast = analytics_service.get_cached_forecast('date', 'value')  # Use 'value' instead of 'sales_amount'
        assert cached_forecast is not None
        assert 'forecast' in cached_forecast
        assert len(cached_forecast['forecast']) > 0  # Ensure we have actual forecast data

        # Test market basket analysis with extended features
        basket_data = analytics_service.perform_market_basket_analysis(pd.DataFrame(sample_time_series_data))
        assert 'product_associations' in basket_data
        assert 'temporal_baskets' in basket_data

        # Test sustainability metrics
        df = pd.DataFrame(sample_time_series_data)
        df['energy_consumption'] = np.random.normal(1000, 100, len(df))
        df['water_consumption'] = np.random.normal(500, 50, len(df))
        df['waste_generated'] = np.random.normal(200, 20, len(df))
        sustainability_metrics = analytics_service._analyze_sustainability_metrics(df)
        assert 'environmental_impact' in sustainability_metrics
        assert 'energy_metrics' in sustainability_metrics
        assert 'water_usage' in sustainability_metrics

        # Test AI query interface
        query_interface = analytics_service.prepare_ai_query_interface(pd.DataFrame(sample_time_series_data))
        assert 'semantic_mappings' in query_interface
        assert 'entity_relationships' in query_interface
        assert 'suggested_queries' in query_interface

    except Exception as e:
        print("Error in comprehensive analysis test:", str(e))
        raise

def test_industry_specific_analysis(analytics_service):
    """Test industry-specific analytics"""
    # Generate sample industry data
    industry_data = []
    for i in range(100):
        base_value = np.random.normal(1000, 100)
        record = {
            'date': (datetime(2025, 1, 1) + timedelta(days=i)).strftime('%Y-%m-%d'),
            'industry': np.random.choice(['retail', 'wholesale', 'manufacturing']),
            'revenue': float(base_value),
            'cost': float(base_value * 0.7),
            'customer_satisfaction': float(np.random.normal(4, 0.5)),
            'units_produced': int(np.random.normal(100, 10)),
            'defect_rate': float(np.random.normal(0.02, 0.005))
        }
        industry_data.append(record)

    # Test each industry's metrics
    for industry in ['retail', 'wholesale', 'manufacturing']:
        industry_specific_data = [d for d in industry_data if d['industry'] == industry]
        result = analytics_service.perform_eda(industry_specific_data, industry=industry)
        
        assert 'industry_metrics' in result
        metrics = result['industry_metrics']
        
        if industry == 'retail':
            assert 'sales_performance' in metrics
            assert 'customer_behavior' in metrics
        elif industry == 'wholesale':
            assert 'order_analytics' in metrics
            assert 'supplier_performance' in metrics
        elif industry == 'manufacturing':
            assert 'production_efficiency' in metrics
            assert 'quality_control' in metrics

def test_cross_industry_analysis(analytics_service):
    """Test cross-industry analytics and correlations"""
    # Generate cross-industry data
    data = []
    industries = ['retail', 'wholesale', 'manufacturing']
    
    for i in range(100):
        for industry in industries:
            base_value = np.random.normal(1000, 100)
            record = {
                'date': (datetime(2025, 1, 1) + timedelta(days=i)).strftime('%Y-%m-%d'),
                'industry': industry,
                'revenue': float(base_value),
                'cost': float(base_value * 0.7),
                'market_share': float(np.random.normal(30, 5)),
                'customer_satisfaction': float(np.random.normal(4, 0.5))
            }
            data.append(record)

    # Test cross-industry correlation analysis
    correlations = analytics_service.enhance_cross_industry_correlations(pd.DataFrame(data))
    assert 'metric_correlations' in correlations
    assert 'shared_trends' in correlations

    # Test market dynamics analysis
    market_analysis = analytics_service._analyze_market_dynamics(pd.DataFrame(data))
    assert 'market_trends' in market_analysis
    assert 'competitive_analysis' in market_analysis
    assert 'growth_patterns' in market_analysis

def test_sustainability_metrics_detailed(analytics_service, sample_time_series_data):
    """Test detailed sustainability metrics analysis"""
    df = pd.DataFrame(sample_time_series_data)
    # Add sustainability-related columns
    df['energy_consumption'] = np.random.normal(1000, 100, len(df))
    df['water_consumption'] = np.random.normal(500, 50, len(df))
    df['waste_generated'] = np.random.normal(200, 20, len(df))
    df['carbon_footprint'] = df['energy_consumption'] * 0.5
    df['recycling_rate'] = np.random.uniform(0.6, 0.9, len(df))

    sustainability_metrics = analytics_service._analyze_sustainability_metrics(df)
    
    # Test environmental impact metrics
    assert 'environmental_impact' in sustainability_metrics
    assert 'carbon_footprint_trend' in sustainability_metrics['environmental_impact']
    assert 'total_emissions' in sustainability_metrics['environmental_impact']
    
    # Test resource utilization
    assert 'resource_utilization' in sustainability_metrics
    assert 'energy_efficiency' in sustainability_metrics['resource_utilization']
    assert 'water_efficiency' in sustainability_metrics['resource_utilization']
    
    # Test waste management metrics
    assert 'waste_management' in sustainability_metrics
    assert 'recycling_performance' in sustainability_metrics['waste_management']
    assert 'waste_reduction_trend' in sustainability_metrics['waste_management']

def test_market_basket_comprehensive(analytics_service):
    """Test comprehensive market basket analysis with various scenarios"""
    # Create sample transaction data
    transactions = pd.DataFrame({
        'transaction_id': np.repeat(range(50), 3),
        'product_id': np.random.randint(1, 20, 150),
        'quantity': np.random.randint(1, 5, 150),
        'timestamp': pd.date_range(start='2025-01-01', periods=50).repeat(3)
    })
    
    basket_analysis = analytics_service.perform_market_basket_analysis(transactions)
    
    # Test association rules
    assert 'product_associations' in basket_analysis
    assert 'support' in basket_analysis['product_associations']
    assert 'confidence' in basket_analysis['product_associations']
    assert 'lift' in basket_analysis['product_associations']
    
    # Test temporal patterns
    assert 'temporal_baskets' in basket_analysis
    assert 'daily_patterns' in basket_analysis['temporal_baskets']
    assert 'weekly_patterns' in basket_analysis['temporal_baskets']
    
    # Test product clusters
    assert 'product_clusters' in basket_analysis
    assert len(basket_analysis['product_clusters']) > 0

def test_time_series_edge_cases(analytics_service, sample_time_series_data):
    """Test time series forecasting with edge cases"""
    # Test with missing values
    data_with_gaps = sample_time_series_data.copy()
    for i in range(10, 15):
        data_with_gaps[i]['value'] = None
    
    forecast_result = analytics_service.forecast_timeseries(
        data=data_with_gaps,
        date_column='date',
        value_column='value'
    )
    assert 'forecast' in forecast_result
    assert 'handling_missing_values' in forecast_result
    
    # Test with extreme outliers
    data_with_outliers = sample_time_series_data.copy()
    data_with_outliers[20]['value'] = 999999
    forecast_outliers = analytics_service.forecast_timeseries(
        data=data_with_outliers,
        date_column='date',
        value_column='value'
    )
    assert 'outlier_impact' in forecast_outliers
    
    # Test with seasonality detection
    seasonal_data = sample_time_series_data.copy()
    for i in range(len(seasonal_data)):
        if seasonal_data[i]['value'] is None:
            seasonal_data[i]['value'] = 0
        seasonal_data[i]['value'] += math.sin(i / 7 * math.pi) * 10
    
    seasonal_forecast = analytics_service.forecast_timeseries(
        data=seasonal_data,
        date_column='date',
        value_column='value'
    )
    assert 'seasonality_components' in seasonal_forecast

def test_industry_specific_metrics_detailed(analytics_service):
    """Test detailed industry-specific metrics for each supported industry"""
    sample_data = pd.DataFrame({
        'date': pd.date_range(start='2025-01-01', periods=100),
        'sales': np.random.normal(1000, 100, 100),
        'inventory': np.random.normal(500, 50, 100),
        'customer_satisfaction': np.random.uniform(3.5, 5.0, 100),
        'order_fulfillment_time': np.random.normal(24, 5, 100),
        'production_volume': np.random.normal(800, 80, 100),
        'defect_rate': np.random.uniform(0.01, 0.05, 100),
        'patient_satisfaction': np.random.uniform(4.0, 5.0, 100),
        'treatment_success_rate': np.random.uniform(0.8, 0.95, 100)
    })
    
    # Test retail metrics
    retail_metrics = analytics_service._retail_metrics(sample_data)
    assert 'sales_performance' in retail_metrics
    assert 'inventory_turnover' in retail_metrics
    assert 'customer_metrics' in retail_metrics
    
    # Test manufacturing metrics
    manufacturing_metrics = analytics_service._manufacturing_metrics(sample_data)
    assert 'production_efficiency' in manufacturing_metrics
    assert 'quality_metrics' in manufacturing_metrics
    assert 'equipment_utilization' in manufacturing_metrics
    
    # Test healthcare metrics
    healthcare_metrics = analytics_service._healthcare_metrics(sample_data)
    assert 'patient_outcomes' in healthcare_metrics
    assert 'operational_efficiency' in healthcare_metrics
    assert 'quality_of_care' in healthcare_metrics

def test_error_handling(analytics_service):
    """Test error handling for various edge cases"""
    # Test with empty dataset
    with pytest.raises(ValueError, match="Empty dataset provided"):
        analytics_service.perform_eda([])
    
    # Test with invalid date format
    invalid_dates = [{'date': 'invalid', 'value': 100}]
    with pytest.raises(ValueError, match="Invalid date format"):
        analytics_service.forecast_timeseries(invalid_dates, 'date', 'value')
    
    # Test with non-numeric values in numeric columns
    invalid_numbers = [{'date': '2025-01-01', 'value': 'invalid'}]
    with pytest.raises(ValueError, match="Non-numeric values found"):
        analytics_service.perform_eda(invalid_numbers)
    
    # Test with missing required columns
    missing_columns = [{'date': '2025-01-01'}]  # missing 'value' column
    with pytest.raises(KeyError, match="Required column 'value' not found"):
        analytics_service.forecast_timeseries(missing_columns, 'date', 'value')

def test_advanced_statistical_methods(analytics_service, sample_time_series_data):
    """Test advanced statistical analysis methods"""
    df = pd.DataFrame(sample_time_series_data)
    
    # Test correlation analysis
    correlation_matrix = analytics_service._calculate_correlations(df)
    assert isinstance(correlation_matrix, dict)
    assert len(correlation_matrix) > 0
    
    # Test clustering analysis
    clusters = analytics_service._perform_clustering(df)
    assert 'cluster_assignments' in clusters
    assert 'cluster_centroids' in clusters
    assert 'silhouette_score' in clusters
    
    # Test dimensionality reduction
    pca_results = analytics_service._perform_dimensionality_reduction(df)
    assert 'components' in pca_results
    assert 'explained_variance' in pca_results
    assert 'reduced_data' in pca_results
    
    # Test anomaly detection
    anomalies = analytics_service._detect_anomalies(df)
    assert 'anomaly_indices' in anomalies
    assert 'anomaly_scores' in anomalies
    assert 'threshold' in anomalies
