import redis
import json
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Union
from sklearn.preprocessing import StandardScaler
from prophet import Prophet
from .json_utils import CustomJSONEncoder

class AnalyticsService:
    def __init__(self, redis_host='localhost', redis_port=6379):
        """Initialize the analytics service with Redis connection."""
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True
        )
        self.cache_ttl = 3600  # Cache for 1 hour by default

    def _get_cache_key(self, analysis_type: str, dataset_id: str, params: Dict = None) -> str:
        """Generate a unique cache key based on analysis parameters."""
        key_parts = [analysis_type, dataset_id]
        if params:
            key_parts.append(json.dumps(params, sort_keys=True))
        return ':'.join(key_parts)

    def _get_cached_result(self, cache_key: str) -> Optional[Dict]:
        """Retrieve cached analysis result."""
        cached = self.redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
        return None

    def _cache_result(self, cache_key: str, result: Dict):
        """Cache analysis result with TTL."""
        self.redis_client.setex(
            cache_key, 
            self.cache_ttl, 
            json.dumps(result, cls=CustomJSONEncoder)
        )

    def analyze_time_series(self, data: List[Dict], date_column: str, value_column: str, params: Dict = None) -> Dict:
        """Perform time series analysis with Prophet."""
        cache_key = self._get_cache_key('time_series', f"{date_column}:{value_column}", params)
        
        # Check cache first
        cached = self._get_cached_result(cache_key)
        if cached:
            return cached

        # Prepare data for Prophet
        df = pd.DataFrame(data)
        forecast_df = df[[date_column, value_column]].rename(columns={
            date_column: 'ds',
            value_column: 'y'
        })

        # Train Prophet model
        model = Prophet()
        model.fit(forecast_df)
        
        # Make future predictions
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)
        
        result = {
            'forecast': forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(30).to_dict('records'),
            'components': {
                'trend': forecast['trend'].tolist(),
                'weekly': forecast['weekly'].tolist() if 'weekly' in forecast else None,
                'yearly': forecast['yearly'].tolist() if 'yearly' in forecast else None
            }
        }

        # Cache the result
        self._cache_result(cache_key, result)
        return result

    def pattern_detection(self, data: List[Dict], numeric_columns: List[str]) -> Dict:
        """Detect patterns and correlations in numeric data."""
        cache_key = self._get_cache_key('pattern_detection', ','.join(numeric_columns))
        
        cached = self._get_cached_result(cache_key)
        if cached:
            return cached
            
        df = pd.DataFrame(data)
        numeric_data = df[numeric_columns]
        
        # Calculate correlations
        correlations = numeric_data.corr().to_dict()
        
        # Detect outliers using Z-score
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(numeric_data)
        outliers = {
            col: (abs(scaled_data[:, i]) > 3).sum() 
            for i, col in enumerate(numeric_columns)
        }
        
        # Basic statistics
        stats = numeric_data.describe().to_dict()
        
        result = {
            'correlations': correlations,
            'outliers': outliers,
            'statistics': stats
        }
        
        self._cache_result(cache_key, result)
        return result

    def market_basket_analysis(self, transactions: List[Dict], item_column: str, transaction_id_column: str) -> Dict:
        """Perform market basket analysis on transaction data."""
        cache_key = self._get_cache_key('market_basket', f"{item_column}:{transaction_id_column}")
        
        cached = self._get_cached_result(cache_key)
        if cached:
            # Convert string keys back to tuples for common_pairs
            if 'common_pairs' in cached:
                cached['common_pairs'] = {
                    tuple(k.split(',')): v 
                    for k, v in cached['common_pairs'].items()
                }
            return cached
            
        df = pd.DataFrame(transactions)
        
        # Group items by transaction
        baskets = df.groupby(transaction_id_column)[item_column].agg(list).reset_index()
        
        # Calculate item frequencies
        item_freq = df[item_column].value_counts().to_dict()
        
        # Find common item pairs
        item_pairs = []
        for basket in baskets[item_column]:
            if len(basket) > 1:
                for i in range(len(basket)):
                    for j in range(i + 1, len(basket)):
                        item_pairs.append(tuple(sorted([basket[i], basket[j]])))
        
        pair_freq = pd.Series(item_pairs).value_counts().head(10).to_dict()
        
        # Convert tuple keys to strings for JSON serialization
        common_pairs = {
            ','.join(k): v for k, v in pair_freq.items()
        }
        
        result = {
            'item_frequencies': item_freq,
            'common_pairs': common_pairs
        }
        
        # Cache the result
        self._cache_result(cache_key, result)
        
        # Convert string keys back to tuples before returning
        result['common_pairs'] = {
            tuple(k.split(',')): v for k, v in common_pairs.items()
        }
        return result

    def segment_analysis(self, data: List[Dict], numeric_columns: List[str], n_segments: int = 3) -> Dict:
        """Perform customer/data segmentation analysis."""
        from sklearn.cluster import KMeans
        
        cache_key = self._get_cache_key('segmentation', ','.join(numeric_columns), {'n_segments': n_segments})
        
        cached = self._get_cached_result(cache_key)
        if cached:
            return cached
            
        df = pd.DataFrame(data)
        numeric_data = df[numeric_columns]
        
        # Normalize data
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(numeric_data)
        
        # Perform clustering
        kmeans = KMeans(n_clusters=n_segments, random_state=42)
        clusters = kmeans.fit_predict(scaled_data)
        
        # Calculate segment profiles
        segment_profiles = {}
        for i in range(n_segments):
            segment_mask = clusters == i
            segment_data = numeric_data[segment_mask]
            
            segment_profiles[f'segment_{i}'] = {
                'size': int(segment_mask.sum()),
                'percentage': float(segment_mask.mean() * 100),
                'means': segment_data.mean().to_dict(),
                'medians': segment_data.median().to_dict()
            }
            
        result = {
            'n_segments': n_segments,
            'segment_profiles': segment_profiles,
            'cluster_centers': {
                f'center_{i}': center.tolist()
                for i, center in enumerate(kmeans.cluster_centers_)
            }
        }
        
        self._cache_result(cache_key, result)
        return result

    def sustainability_metrics(self, data: List[Dict], metrics: Dict[str, str]) -> Dict:
        """Calculate sustainability and environmental impact metrics."""
        cache_key = self._get_cache_key('sustainability', json.dumps(metrics, sort_keys=True))
        
        cached = self._get_cached_result(cache_key)
        if cached:
            return cached
            
        df = pd.DataFrame(data)
        
        # Initialize results
        results = {}
        
        # Calculate metrics based on provided mappings
        for metric_name, column in metrics.items():
            if column in df.columns:
                results[metric_name] = {
                    'total': float(df[column].sum()),
                    'average': float(df[column].mean()),
                    'trend': df[column].rolling(window=7).mean().tail(30).tolist()
                }
        
        # Add percentage changes
        for metric_name in results:
            try:
                current = results[metric_name]['total']
                previous = df[metrics[metric_name]].iloc[:-30].sum()
                results[metric_name]['change_pct'] = ((current - previous) / previous) * 100
            except:
                results[metric_name]['change_pct'] = 0
        
        result = {
            'metrics': results,
            'last_updated': datetime.now().isoformat()
        }
        
        self._cache_result(cache_key, result)
        return result

    def cross_industry_correlation(self, datasets: List[Dict], metrics: List[str]) -> Dict:
        """Analyze correlations across different industry datasets."""
        cache_key = self._get_cache_key('cross_industry', ','.join(metrics))
        
        cached = self._get_cached_result(cache_key)
        if cached:
            return cached
            
        results = {}
        
        # Process each dataset
        for dataset in datasets:
            industry = dataset.get('industry')
            df = pd.DataFrame(dataset.get('data', []))
            
            if not all(metric in df.columns for metric in metrics):
                continue
                
            results[industry] = {
                'correlations': df[metrics].corr().to_dict(),
                'summary': df[metrics].describe().to_dict()
            }
        
        # Calculate cross-industry correlations
        cross_correlations = {}
        industries = list(results.keys())
        
        for i, ind1 in enumerate(industries):
            for ind2 in industries[i+1:]:
                key = f"{ind1}_vs_{ind2}"
                cross_correlations[key] = {
                    metric: np.corrcoef(
                        [float(x) for x in results[ind1]['summary'][metric]['mean']],
                        [float(x) for x in results[ind2]['summary'][metric]['mean']]
                    )[0,1]
                    for metric in metrics
                }
        
        result = {
            'industry_metrics': results,
            'cross_correlations': cross_correlations
        }
        
        self._cache_result(cache_key, result)
        return result
