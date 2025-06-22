import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import datetime
import redis
import json
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest
from scipy import stats
from scipy.stats import pearsonr
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller
import networkx as nx
from sklearn.metrics import silhouette_score
from sklearn.feature_extraction.text import TfidfVectorizer
from .json_utils import CustomJSONEncoder

class BaseAnalyticsService:
    def __init__(self, redis_host='localhost', redis_port=6379, redis_db=0):
        """Initialize base analytics service with configurable Redis connection"""
        self.redis_client = redis.Redis(host=redis_host, port=redis_port, db=redis_db)
        
    def perform_eda(self, data):
        """
        Perform base Exploratory Data Analysis
        """
        if not data:
            raise ValueError("Empty dataset provided")
            
        df = pd.DataFrame(data)

        if df.empty:
            raise ValueError("Empty dataset provided")
            
        # Validate numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            raise ValueError("Non-numeric values found in dataset")
        
        # Convert date columns to datetime
        date_columns = []
        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    # Try to parse with a strict format first (ISO), fallback to flexible parsing
                    df[col] = pd.to_datetime(df[col], format='%Y-%m-%d', errors='coerce')
                    # If all values are NaT, try without format
                    if df[col].isna().all():
                        df[col] = pd.to_datetime(df[col], errors='coerce')
                    # Only append if at least some values were parsed
                    if df[col].notna().any():
                        date_columns.append(col)
                except (ValueError, TypeError):
                    continue
        
        # Get numeric columns excluding dates
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        # Advanced statistics and AI-ready features
        return {
            'basic_stats': df[numeric_cols].describe().to_dict() if len(numeric_cols) > 0 else {},
            'missing_values': df.isnull().sum().to_dict(),
            'columns': list(df.columns),
            'row_count': len(df),
            'correlation_matrix': df[numeric_cols].corr().to_dict() if len(numeric_cols) > 0 else {},
            'skewness': df[numeric_cols].skew().to_dict() if len(numeric_cols) > 0 else {},
            'kurtosis': df[numeric_cols].kurtosis().to_dict() if len(numeric_cols) > 0 else {},
            'outliers': self._detect_outliers(df),
            'distribution_tests': self._perform_distribution_tests(df),
            'dimensionality_reduction': self._perform_dimensionality_reduction(df),
            'temporal_patterns': self._analyze_temporal_patterns(df),
            'anomaly_detection': self._detect_anomalies(df),
            'feature_importance': self._calculate_feature_importance(df)
        }

    def forecast_timeseries(self, data, date_column, value_column):
        """
        Forecast time series data with support for edge cases
        """
        if not data:
            raise ValueError("Empty dataset provided")
            
        df = pd.DataFrame(data)
        if date_column not in df.columns:
            raise KeyError(f"Required column '{date_column}' not found")
        if value_column not in df.columns:
            raise KeyError(f"Required column '{value_column}' not found")
            
        # Convert to datetime
        try:
            # Try strict ISO first, fallback to flexible
            df[date_column] = pd.to_datetime(df[date_column], format='%Y-%m-%d', errors='coerce')
            if df[date_column].isna().all():
                df[date_column] = pd.to_datetime(df[date_column], errors='coerce')
            if df[date_column].isna().all():
                raise ValueError("Invalid date format")
        except ValueError as exc:
            raise ValueError("Invalid date format") from exc
            
        # Handle missing values
        has_missing = df[value_column].isnull().any()
        if has_missing:
            df[value_column] = df[value_column].interpolate(method='linear')
            
        # Detect and handle outliers
        Q1 = df[value_column].quantile(0.25)
        Q3 = df[value_column].quantile(0.75)
        IQR = Q3 - Q1
        outlier_mask = (df[value_column] < (Q1 - 1.5 * IQR)) | (df[value_column] > (Q3 + 1.5 * IQR))
        has_outliers = outlier_mask.any()
        
        # Prepare data for Prophet
        prophet_df = df.rename(columns={date_column: 'ds', value_column: 'y'})
        model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=True)
        model.fit(prophet_df)
        
        # Make future dataframe for forecasting
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)
        
        result = {
            'forecast': forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records'),
            'components': {
                'trend': forecast['trend'].to_dict(),
                'yearly': forecast['yearly'].to_dict() if 'yearly' in forecast else {},
                'weekly': forecast['weekly'].to_dict() if 'weekly' in forecast else {},
                'daily': forecast['daily'].to_dict() if 'daily' in forecast else {}
            }
        }
        
        if has_missing:
            result['handling_missing_values'] = {'filled_indices': df[value_column].isnull().sum()}
            
        if has_outliers:
            result['outlier_impact'] = {
                'outlier_indices': outlier_mask[outlier_mask].index.tolist(),
                'outlier_values': df.loc[outlier_mask, value_column].tolist()
            }
            
        # Detect seasonality
        decomposition = seasonal_decompose(df[value_column], period=7, extrapolate_trend='freq')
        result['seasonality_components'] = {
            'trend': decomposition.trend.to_dict(),
            'seasonal': decomposition.seasonal.to_dict(),
            'residual': decomposition.resid.to_dict()
        }
        
        # Cache the forecast with timestamp
        timestamp = datetime.now().strftime('%Y%m%d%H')
        cache_key = f"forecast_{date_column}_{value_column}_{timestamp}"
        self.redis_client.set(cache_key, json.dumps(result, cls=CustomJSONEncoder))
        
        return result
        
    def get_cached_forecast(self, date_column, value_column):
        """Retrieve cached forecast results"""
        timestamp = datetime.now().strftime('%Y%m%d%H')
        cache_key = f"forecast_{date_column}_{value_column}_{timestamp}"
        cached = self.redis_client.get(cache_key)
        
        if cached:
            return json.loads(cached)
        return None

    def prepare_ai_query_interface(self, df):
        """Prepare data for natural language analytics queries"""
        query_interface = {
            'semantic_mappings': {},
            'entity_relationships': {},
            'available_metrics': {},
            'temporal_context': {},
            'metric_relationships': {},
            'data_patterns': {},
            'suggested_queries': []
        }
        
        try:
            # Create semantic mappings for textual columns
            text_columns = df.select_dtypes(include=['object']).columns
            vectorizer = TfidfVectorizer(max_features=1000)
            
            for col in text_columns:
                if df[col].str.len().mean() > 5:  # Only process meaningful text fields
                    text_features = vectorizer.fit_transform(df[col].fillna('').astype(str))
                    query_interface['semantic_mappings'][col] = {
                        'vocabulary': vectorizer.vocabulary_,
                        'idf_values': vectorizer.idf_.tolist(),
                        'top_terms': dict(zip(
                            vectorizer.get_feature_names_out(),
                            np.asarray(text_features.sum(axis=0)).ravel()
                        ))
                    }
            
            query_interface.update({
                'entity_relationships': self._analyze_entity_relationships(df),
                'available_metrics': self._analyze_available_metrics(df),
                'temporal_context': self._analyze_temporal_context(df),
                'data_patterns': self._analyze_data_patterns(df),
                'suggested_queries': self._generate_suggested_queries(df)
            })
            
        except Exception as e:
            query_interface['error'] = str(e)
            
        return query_interface

    # Helper methods moved from original class
    def _detect_outliers(self, df):
        """Detect outliers using IQR method"""
        outliers = {}
        for column in df.select_dtypes(include=[np.number]).columns:
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            outliers[column] = {
                'count': len(df[(df[column] < (Q1 - 1.5 * IQR)) | (df[column] > (Q3 + 1.5 * IQR))]),
                'percentage': len(df[(df[column] < (Q1 - 1.5 * IQR)) | (df[column] > (Q3 + 1.5 * IQR))]) / len(df) * 100
            }
        return outliers

    def _perform_distribution_tests(self, df):
        """Perform distribution tests for numerical columns"""
        tests = {}
        for column in df.select_dtypes(include=[np.number]).columns:
            shapiro_test = stats.shapiro(df[column].dropna())
            tests[column] = {
                'shapiro_test': {
                    'statistic': float(shapiro_test.statistic),
                    'p_value': float(shapiro_test.pvalue)
                }
            }
        return tests

    def _perform_dimensionality_reduction(self, df):
        """Perform PCA for dimensional insights"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return {}
            
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(df[numeric_cols])
        pca = PCA()
        pca_result = pca.fit_transform(scaled_data)
        
        return {
            'explained_variance_ratio': pca.explained_variance_ratio_.tolist(),
            'cumulative_variance_ratio': np.cumsum(pca.explained_variance_ratio_).tolist(),
            'n_components_95_variance': np.argmax(np.cumsum(pca.explained_variance_ratio_) >= 0.95) + 1
        }

    def _analyze_temporal_patterns(self, df):
        """Analyze temporal patterns and seasonality"""
        date_cols = df.select_dtypes(include=['datetime64']).columns
        if len(date_cols) == 0:
            return None
            
        patterns = {}
        for date_col in date_cols:
            df['year'] = df[date_col].dt.year
            df['month'] = df[date_col].dt.month
            df['day_of_week'] = df[date_col].dt.dayofweek
            
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            for metric in numeric_cols:
                if metric not in ['year', 'month', 'day_of_week']:
                    patterns[f"{metric}_by_month"] = df.groupby('month')[metric].mean().to_dict()
                    patterns[f"{metric}_by_day_of_week"] = df.groupby('day_of_week')[metric].mean().to_dict()
                    
        return patterns

    def _detect_anomalies(self, df):
        """Detect anomalies using Isolation Forest"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            return None
            
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(df[numeric_cols])
        
        isolation_forest = IsolationForest(random_state=42, contamination=0.1)
        anomalies = isolation_forest.fit_predict(scaled_data)
        
        return {
            'anomaly_percentage': float((anomalies == -1).mean() * 100),
            'anomaly_indices': np.where(anomalies == -1)[0].tolist()
        }

    def _calculate_feature_importance(self, df):
        """Calculate feature importance and relationships"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return None
            
        importance = {}
        for col in numeric_cols:
            correlations = []
            for other_col in numeric_cols:
                if col != other_col:
                    if df[col].nunique() <= 1 or df[other_col].nunique() <= 1:
                        continue
                    try:
                        corr, _ = pearsonr(df[col].fillna(0), df[other_col].fillna(0))
                        if not np.isnan(corr):
                            correlations.append((other_col, abs(corr)))
                    except ValueError:
                        continue
            
            correlation_values = [abs(c[1]) for c in correlations]
            importance[col] = {
                'top_correlations': sorted(correlations, key=lambda x: abs(x[1]), reverse=True)[:3],
                'correlation_strength': float(np.mean(correlation_values)) if correlation_values else 0.0
            }
            
        return importance

    # Additional helper methods for AI query interface
    def _analyze_entity_relationships(self, df):
        """Analyze entity relationships in the data"""
        relationships = {}
        entity_columns = [col for col in df.columns if any(entity in col.lower() 
                        for entity in ['id', 'category', 'type', 'name', 'class', 'group'])]
        
        for col in entity_columns:
            if df[col].dtype == 'object':
                value_counts = df[col].value_counts()
                unique_values = df[col].unique().tolist()
                
                hierarchy = {}
                if '_' in col or col.lower().endswith('_id'):
                    related_cols = [c for c in df.columns if col.split('_')[0] in c and c != col]
                    for rel_col in related_cols:
                        hierarchy[rel_col] = df.groupby(col)[rel_col].agg(list).to_dict()
                
                relationships[col] = {
                    'unique_values': unique_values,
                    'value_counts': value_counts.to_dict(),
                    'hierarchy': hierarchy,
                    'cardinality': len(unique_values)
                }
        
        return relationships

    def _analyze_available_metrics(self, df):
        """Analyze available metrics in the data"""
        metrics = {}
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            stats = df[col].describe()
            metrics[col] = {
                'min': float(stats['min']),
                'max': float(stats['max']),
                'mean': float(stats['mean']),
                'std': float(stats['std']),
                'quartiles': {
                    '25%': float(stats['25%']),
                    '50%': float(stats['50%']),
                    '75%': float(stats['75%'])
                }
            }
        
        return metrics

    def _analyze_temporal_context(self, df):
        """Analyze temporal context in the data"""
        temporal_context = {}
        date_cols = df.select_dtypes(include=['datetime64']).columns
        
        if len(date_cols) == 0:
            for col in df.columns:
                if df[col].dtype == 'object':
                    try:
                        # Try strict ISO first, fallback to flexible
                        parsed = pd.to_datetime(df[col], format='%Y-%m-%d', errors='coerce')
                        if parsed.notna().any():
                            date_cols = pd.Index([col])
                            break
                        parsed = pd.to_datetime(df[col], errors='coerce')
                        if parsed.notna().any():
                            date_cols = pd.Index([col])
                            break
                    except Exception:
                        continue
        for date_col in date_cols:
            df[date_col] = pd.to_datetime(df[date_col], format='%Y-%m-%d', errors='coerce')
            if df[date_col].isna().all():
                df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            temporal_context[date_col] = {
                'min_date': df[date_col].min().isoformat(),
                'max_date': df[date_col].max().isoformat(),
                'frequency': pd.infer_freq(df[date_col]),
                'temporal_patterns': {
                    'daily_pattern': df.groupby(df[date_col].dt.dayofweek).size().to_dict(),
                    'monthly_pattern': df.groupby(df[date_col].dt.month).size().to_dict(),
                    'yearly_pattern': df.groupby(df[date_col].dt.year).size().to_dict()
                }
            }
        
        return temporal_context

    def _analyze_data_patterns(self, df):
        """Analyze patterns in the data"""
        return {
            'missing_patterns': df.isnull().sum().to_dict(),
            'unique_value_counts': df.nunique().to_dict(),
            'distribution_types': self._analyze_distributions(df)
        }

    def _analyze_distributions(self, df):
        """Analyze value distributions"""
        distributions = {}
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if df[col].nunique() > 5:
                _, p_value = stats.normaltest(df[col].dropna())
                skewness = float(df[col].skew())
                kurtosis = float(df[col].kurtosis())
                
                distributions[col] = {
                    'distribution_type': 'normal' if p_value > 0.05 else 'non_normal',
                    'skewness': skewness,
                    'kurtosis': kurtosis
                }
        return distributions

    def _generate_suggested_queries(self, df):
        """Generate relevant query suggestions"""
        suggestions = []
        
        if 'date' in df.columns:
            suggestions.extend([
                "Show the trend over time",
                "Compare year-over-year growth",
                "Find seasonal patterns"
            ])
            
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            suggestions.extend([
                f"Analyze the distribution of {col}" for col in numeric_cols[:3]
            ])
            
        categorical_cols = df.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            suggestions.extend([
                f"Break down metrics by {col}" for col in categorical_cols[:3]
            ])
            
        return suggestions
