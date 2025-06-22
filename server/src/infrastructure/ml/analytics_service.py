import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import datetime
import redis
import json
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest
from .json_utils import CustomJSONEncoder
from scipy import stats
from scipy.stats import pearsonr
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller
import networkx as nx
from sklearn.metrics import silhouette_score
from sklearn.feature_extraction.text import TfidfVectorizer

class AnalyticsService:
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.industry_metrics = {
            'retail': self._retail_metrics,
            'wholesale': self._wholesale_metrics,
            'supermarket': self._supermarket_metrics,
            'manufacturing': self._manufacturing_metrics,
            'healthcare': self._healthcare_metrics
        }
        self.cross_industry_analyzers = {
            'market_dynamics': self._analyze_market_dynamics,
            'supply_chain': self._analyze_supply_chain,
            'customer_insights': self._analyze_customer_insights,
            'operational_efficiency': self._analyze_operational_efficiency,
            'risk_assessment': self._analyze_risk_patterns,
            'sustainability': self._analyze_sustainability_metrics
        }
        
    def perform_eda(self, data, industry=None):
        """
        Perform enhanced Exploratory Data Analysis with cross-industry insights
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
                    df[col] = pd.to_datetime(df[col])
                    date_columns.append(col)
                except (ValueError, TypeError):
                    continue
        
        # Get numeric columns excluding dates
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        # Advanced statistics and AI-ready features
        analysis_results = {
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
        
        # Add industry-specific metrics
        if industry and industry.lower() in self.industry_metrics:
            analysis_results['industry_metrics'] = self.industry_metrics[industry.lower()](df)
        
        # Add cross-industry insights
        analysis_results['cross_industry_insights'] = {}
        for analyzer_name, analyzer_func in self.cross_industry_analyzers.items():
            analysis_results['cross_industry_insights'][analyzer_name] = analyzer_func(df)
        
        return analysis_results

    def _detect_outliers(self, df):
        """
        Detect outliers using IQR method for numerical columns
        """
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
        """
        Perform distribution tests for numerical columns
        """
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
        """
        Perform PCA for dimensional insights
        """
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
        """
        Analyze temporal patterns and seasonality
        """
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
        """
        Detect anomalies using multiple methods
        """
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
        """
        Calculate feature importance and relationships
        """
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return None
            
        importance = {}
        for col in numeric_cols:
            correlations = []
            for other_col in numeric_cols:
                if col != other_col:
                    # Check if either column is constant
                    if df[col].nunique() <= 1 or df[other_col].nunique() <= 1:
                        continue
                    try:
                        corr, _ = pearsonr(df[col].fillna(0), df[other_col].fillna(0))
                        if not np.isnan(corr):  # Only add if correlation is valid
                            correlations.append((other_col, abs(corr)))
                    except ValueError:
                        continue  # Skip if correlation can't be calculated
            
            # Handle empty correlations case
            correlation_values = [abs(c[1]) for c in correlations]
            importance[col] = {
                'top_correlations': sorted(correlations, key=lambda x: abs(x[1]), reverse=True)[:3],
                'correlation_strength': float(np.mean(correlation_values)) if correlation_values else 0.0
            }
            
        return importance

    def _retail_metrics(self, df):

        """Calculate retail-specific metrics"""
        if not all(col in df.columns for col in ['sales', 'inventory', 'customer_satisfaction']):
            # Return default structure if required columns are missing
            return {
                'sales_performance': {},
                'customer_behavior': {},
                'inventory': {}
            }

        metrics = {
            'sales_performance': {
                'total_sales': float(df['sales'].sum()) if 'sales' in df.columns else 0.0,
                'average_daily_sales': float(df['sales'].mean()) if 'sales' in df.columns else 0.0,
                'sales_growth': float((df['sales'].iloc[-1] / df['sales'].iloc[0] - 1) * 100) if 'sales' in df.columns else 0.0
            },
            'inventory_turnover': {
                'rate': float(df['sales'].sum() / df['inventory'].mean()) if all(col in df.columns for col in ['sales', 'inventory']) else 0.0,
                'days_of_inventory': float(df['inventory'].mean() / (df['sales'].mean() / 30)) if all(col in df.columns for col in ['sales', 'inventory']) else 0.0
            },
            'customer_metrics': {
                'satisfaction_score': float(df['customer_satisfaction'].mean()) if 'customer_satisfaction' in df.columns else 0.0,
                'satisfaction_trend': df['customer_satisfaction'].rolling(window=7).mean().to_dict() if 'customer_satisfaction' in df.columns else {}
            }
        }
        return metrics

    def _wholesale_metrics(self, df):
        """
        Calculate wholesale-specific metrics
        """
        metrics = {
            'order_analytics': {},
            'supplier_performance': {},
            'distribution': {}
        }
        
        if 'order_value' in df.columns:
            metrics['order_analytics']['average_order_value'] = float(df['order_value'].mean())
            metrics['order_analytics']['order_value_distribution'] = df['order_value'].quantile([0.25, 0.5, 0.75]).to_dict()
            
        if 'supplier_id' in df.columns and 'delivery_time' in df.columns:
            supplier_performance = df.groupby('supplier_id')['delivery_time'].agg(['mean', 'std']).to_dict()
            metrics['supplier_performance'] = supplier_performance
            
        return metrics
    
    def _supermarket_metrics(self, df):
        """
        Calculate supermarket-specific metrics
        """
        metrics = {
            'category_performance': {},
            'basket_analysis': {},
            'promotion_impact': {}
        }
        
        if 'category' in df.columns and 'sales_amount' in df.columns:
            category_sales = df.groupby('category')['sales_amount'].sum()
            metrics['category_performance']['top_categories'] = category_sales.nlargest(5).to_dict()
            
        if 'transaction_id' in df.columns and 'product_id' in df.columns:
            # Simple basket analysis
            transactions = df.groupby('transaction_id')['product_id'].count()
            metrics['basket_analysis']['average_items_per_transaction'] = float(transactions.mean())
            
        if 'promotion_flag' in df.columns and 'sales_amount' in df.columns:
            promo_impact = df.groupby('promotion_flag')['sales_amount'].mean()
            metrics['promotion_impact']['sales_lift'] = float(
                (promo_impact.get(1, 0) - promo_impact.get(0, 0)) / promo_impact.get(0, 1) * 100
            )
            
        return metrics
    
    def _manufacturing_metrics(self, df):


        """Calculate manufacturing-specific metrics"""
        production_col = 'production_volume' if 'production_volume' in df.columns else 'units_produced'
        metrics = {
            'production_efficiency': {
                'volume': float(df[production_col].mean()),
                'trend': df[production_col].rolling(window=7).mean().to_dict()
            },
            'quality_metrics': {
                'defect_rate': float(df['defect_rate'].mean()) if 'defect_rate' in df.columns else 0.0,
                'quality_trend': df['defect_rate'].rolling(window=7).mean().to_dict() if 'defect_rate' in df.columns else {}
            },
            'quality_control': {
                'defects_per_unit': float(df['defect_rate'].mean()) if 'defect_rate' in df.columns else 0.0,
                'defect_trend': df['defect_rate'].rolling(window=7).mean().to_dict() if 'defect_rate' in df.columns else {}
            },
            'equipment_utilization': {
                'rate': float((df[production_col] / df[production_col].max()).mean() * 100),
                'trend': df[production_col].rolling(window=7).mean().to_dict()
            }
        }
        return metrics
    
    def _healthcare_metrics(self, df):

        """Calculate healthcare-specific metrics"""
        metrics = {
            'patient_outcomes': {
                'satisfaction': float(df['patient_satisfaction'].mean()),
                'treatment_success': float(df['treatment_success_rate'].mean())
            },
            'operational_efficiency': {
                'avg_wait_time': float(df['order_fulfillment_time'].mean()),
                'utilization_rate': float(df['production_volume'].mean() / df['production_volume'].max())
            },
            'quality_of_care': {
                'satisfaction_trend': df['patient_satisfaction'].rolling(window=7).mean().to_dict(),
                'success_rate_trend': df['treatment_success_rate'].rolling(window=7).mean().to_dict()
            }
        }
        return metrics
    
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
            df[date_column] = pd.to_datetime(df[date_column])
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
        



        # Cache the forecast with timestamp to ensure freshness
        timestamp = datetime.now().strftime('%Y%m%d%H')
        cache_key = f"forecast_{date_column}_{value_column}_{timestamp}"
        self.redis_client.set(cache_key, json.dumps(result, cls=CustomJSONEncoder))
        
        return result
    
    def get_cached_forecast(self, date_column, value_column):
        """
        Retrieve cached forecast results
        """
        timestamp = datetime.now().strftime('%Y%m%d%H')
        cache_key = f"forecast_{date_column}_{value_column}_{timestamp}"
        cached = self.redis_client.get(cache_key)
        
        if cached:
            return json.loads(cached)
        return None

    def _analyze_market_dynamics(self, df):
        """
        Analyze market dynamics across industries
        """
        metrics = {
            'market_trends': {},
            'competitive_analysis': {},
            'growth_patterns': {}
        }
        
        if 'revenue' in df.columns and 'date' in df.columns:
            # Trend Analysis
            df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
            monthly_revenue = df.groupby('month')['revenue'].sum()
            
            # Calculate growth rates
            metrics['growth_patterns']['monthly_growth'] = float(
                ((monthly_revenue.iloc[-1] / monthly_revenue.iloc[0]) ** (1/len(monthly_revenue)) - 1) * 100
            )
            
            # Market volatility
            mean_revenue = monthly_revenue.mean()
            if mean_revenue > 0:  # Avoid division by zero
                metrics['market_trends']['volatility'] = float(monthly_revenue.std() / mean_revenue)
            else:
                metrics['market_trends']['volatility'] = 0.0
            
        if 'competitor_price' in df.columns and 'price' in df.columns:

            comp_price_mean = df['competitor_price'].mean()
            if comp_price_mean > 0:  # Avoid division by zero
                metrics['competitive_analysis']['price_position'] = float(
                    (df['price'].mean() / comp_price_mean - 1) * 100
                )
            else:
                metrics['competitive_analysis']['price_position'] = 0.0
            
        return metrics

    def _analyze_supply_chain(self, df):
        """
        Analyze supply chain metrics across industries
        """
        metrics = {
            'efficiency': {},
            'reliability': {},
            'cost_analysis': {}
        }
        
        # Supply Chain Network Analysis
        if 'supplier_id' in df.columns and 'delivery_time' in df.columns:
            supplier_performance = df.groupby('supplier_id').agg({
                'delivery_time': ['mean', 'std'],
                'order_value': ['sum', 'mean']
            }).round(2)
            
            metrics['reliability']['supplier_consistency'] = float(
                1 - (supplier_performance['delivery_time']['std'] / supplier_performance['delivery_time']['mean']).mean()
            )
        
        # Cost and Efficiency Analysis
        if 'transportation_cost' in df.columns and 'order_value' in df.columns:
            metrics['cost_analysis']['logistics_cost_ratio'] = float(
                (df['transportation_cost'].sum() / df['order_value'].sum()) * 100
            )
            
        return metrics

    def _analyze_customer_insights(self, df):
        """
        Cross-industry customer behavior analysis
        """
        insights = {
            'customer_segments': {},
            'behavior_patterns': {},
            'lifetime_value': {}
        }
        
        if 'customer_id' in df.columns and 'transaction_amount' in df.columns:
            # Customer Segmentation using DBSCAN for more natural clustering
            customer_features = df.groupby('customer_id').agg({
                'transaction_amount': ['sum', 'mean', 'count']
            }).values
            
            scaler = MinMaxScaler()
            scaled_features = scaler.fit_transform(customer_features)
            
            # Find optimal eps parameter for DBSCAN
            dbscan = DBSCAN(eps=0.3, min_samples=5)
            clusters = dbscan.fit_predict(scaled_features)
            
            insights['customer_segments']['natural_segments'] = {
                'n_segments': len(np.unique(clusters[clusters >= 0])),
                'segment_sizes': pd.Series(clusters).value_counts().to_dict()
            }
            
        return insights

    def _analyze_operational_efficiency(self, df):
        """
        Cross-industry operational efficiency analysis
        """
        metrics = {
            'process_efficiency': {},
            'resource_utilization': {},
            'bottleneck_analysis': {}
        }
        
        if 'process_time' in df.columns and 'output_quantity' in df.columns:
            # Process Efficiency Analysis
            metrics['process_efficiency']['throughput_rate'] = float(
                df['output_quantity'].sum() / df['process_time'].sum()
            )
            
            # Calculate process stability
            process_stability = 1 - (df['process_time'].std() / df['process_time'].mean())
            metrics['process_efficiency']['stability_score'] = float(process_stability)
            
        return metrics

    def _analyze_risk_patterns(self, df):
        """
        Cross-industry risk pattern analysis
        """
        risk_metrics = {
            'operational_risk': {},
            'market_risk': {},
            'compliance_risk': {}
        }
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            # Use Isolation Forest for risk pattern detection
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            risk_scores = iso_forest.fit_predict(df[numeric_cols])
            
            risk_metrics['operational_risk']['anomaly_percentage'] = float(
                (risk_scores == -1).mean() * 100
            )
            
        return risk_metrics

    def _analyze_sustainability_metrics(self, df):
        """

        Analyze sustainability metrics including environmental impact, resource utilization, and waste management
        """
        if not all(col in df.columns for col in ['energy_consumption', 'water_consumption', 'waste_generated']):
            return {}
            
        results = {
            'environmental_impact': {
                'carbon_footprint_trend': df['carbon_footprint'].rolling(window=7).mean().to_dict() if 'carbon_footprint' in df.columns else {},
                'total_emissions': float(df['energy_consumption'].sum() * 0.5)
            },
            'resource_utilization': {
                'energy_efficiency': float(df['energy_consumption'].mean()),
                'water_efficiency': float(df['water_consumption'].mean())
            },
            'waste_management': {
                'recycling_performance': float(df['recycling_rate'].mean()) if 'recycling_rate' in df.columns else 0.0,
                'waste_reduction_trend': df['waste_generated'].rolling(window=7).mean().to_dict()
            }
        }
        return results

    def prepare_ai_query_interface(self, df):
        """
        Prepare data for natural language analytics queries with enhanced semantic understanding
        """
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
        
            # Map entity relationships and hierarchies
            entity_columns = [col for col in df.columns if any(entity in col.lower() 
                            for entity in ['id', 'category', 'type', 'name', 'class', 'group'])]
            
            for col in entity_columns:
                if df[col].dtype == 'object':
                    value_counts = df[col].value_counts()
                    unique_values = df[col].unique().tolist()
                    
                    # Find potential hierarchical relationships
                    hierarchy = {}
                    if '_' in col or col.lower().endswith('_id'):
                        related_cols = [c for c in df.columns if col.split('_')[0] in c and c != col]
                        for rel_col in related_cols:
                            hierarchy[rel_col] = df.groupby(col)[rel_col].agg(list).to_dict()
                    
                    query_interface['entity_relationships'][col] = {
                        'unique_values': unique_values,
                        'value_counts': value_counts.to_dict(),
                        'hierarchy': hierarchy,
                        'cardinality': len(unique_values)
                    }
        
            # Document available metrics and their relationships
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                stats = df[col].describe()
                query_interface['available_metrics'][col] = {
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
                
                # Analyze metric relationships
                correlations = {}
                for other_col in numeric_cols:
                    if col != other_col:
                        corr = df[col].corr(df[other_col])
                        if abs(corr) > 0.3:  # Only store meaningful correlations
                            correlations[other_col] = float(corr)
                            
                query_interface['metric_relationships'][col] = {
                    'correlations': correlations,
                    'trends': self._analyze_metric_trends(df, col)
                }
            
            # Add temporal context if available
            date_cols = df.select_dtypes(include=['datetime64']).columns
            if len(date_cols) == 0:
                # Try to convert string columns that might contain dates
                for col in df.columns:
                    if df[col].dtype == 'object':
                        try:
                            pd.to_datetime(df[col])
                            date_cols = date_cols.append(col)
                        except:
                            continue
                            
            for date_col in date_cols:
                df[date_col] = pd.to_datetime(df[date_col])
                temporal_stats = {
                    'min_date': df[date_col].min().isoformat(),
                    'max_date': df[date_col].max().isoformat(),
                    'frequency': pd.infer_freq(df[date_col]),
                    'temporal_patterns': {}
                }
                
                # Analyze temporal patterns
                temporal_stats['temporal_patterns'] = {
                    'daily_pattern': df.groupby(df[date_col].dt.dayofweek).size().to_dict(),
                    'monthly_pattern': df.groupby(df[date_col].dt.month).size().to_dict(),
                    'yearly_pattern': df.groupby(df[date_col].dt.year).size().to_dict()
                }
                
                query_interface['temporal_context'][date_col] = temporal_stats
            
            # Identify data patterns and anomalies
            query_interface['data_patterns'] = {
                'missing_patterns': df.isnull().sum().to_dict(),
                'unique_value_counts': df.nunique().to_dict(),
                'distribution_types': self._analyze_distributions(df)
            }
            
            # Generate suggested queries based on data characteristics
            query_interface['suggested_queries'] = self._generate_suggested_queries(df)
            
            # Add metadata about the dataset
            query_interface['metadata'] = {
                'row_count': len(df),
                'column_count': len(df.columns),
                'memory_usage': df.memory_usage(deep=True).sum(),
                'data_types': df.dtypes.astype(str).to_dict()
            }
            
        except Exception as e:
            query_interface['error'] = str(e)
            
        return query_interface
        
    def _analyze_metric_trends(self, df, column):
        """Helper method to analyze trends in numeric columns"""
        trends = {}
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            time_series = df.groupby('date')[column].mean()
            if len(time_series) > 2:
                # Calculate trend
                x = np.arange(len(time_series))
                y = time_series.values
                slope, intercept = np.polyfit(x, y, 1)
                trends['slope'] = float(slope)
                trends['trend_direction'] = 'increasing' if slope > 0 else 'decreasing'
                trends['trend_strength'] = float(abs(slope) / time_series.mean())
        return trends
        
    def _analyze_distributions(self, df):
        """Helper method to analyze value distributions"""
        distributions = {}
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if df[col].nunique() > 5:  # Skip columns with too few unique values
                # Test for normality
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
        """Helper method to generate relevant query suggestions"""
        suggestions = []
        
        # Add time-based queries if temporal data exists
        if 'date' in df.columns:
            suggestions.extend([
                "Show the trend over time",
                "Compare year-over-year growth",
                "Find seasonal patterns"
            ])
            
        # Add metric-based queries
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            suggestions.extend([
                f"Analyze the distribution of {col}" for col in numeric_cols[:3]
            ])
            
        # Add categorical analysis queries
        categorical_cols = df.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            suggestions.extend([
                f"Break down metrics by {col}" for col in categorical_cols[:3]
            ])
            
        return suggestions

    def enhance_cross_industry_correlations(self, df):
        """
        Enhanced analysis of correlations across different industries
        """
        correlations = {
            'metric_correlations': {},
            'industry_patterns': {},
            'shared_trends': {}
        }
        
        if 'industry' in df.columns:
            industries = df['industry'].unique()
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            # Calculate cross-industry metric correlations
            for ind1 in industries:
                for ind2 in industries:
                    if ind1 < ind2:  # Avoid duplicate comparisons
                        ind1_data = df[df['industry'] == ind1][numeric_cols]
                        ind2_data = df[df['industry'] == ind2][numeric_cols]
                        
                        if not ind1_data.empty and not ind2_data.empty:
                            common_metrics = set(ind1_data.columns) & set(ind2_data.columns)
                            for metric in common_metrics:
                                corr, p_value = pearsonr(
                                    ind1_data[metric].fillna(0),
                                    ind2_data[metric].fillna(0)
                                )
                                correlations['metric_correlations'][f"{ind1}_{ind2}_{metric}"] = {
                                    'correlation': float(corr),
                                    'p_value': float(p_value)
                                }
            
            # Identify shared trends
            if 'date' in df.columns:
                for metric in numeric_cols:
                    industry_trends = {}
                    for industry in industries:
                        industry_data = df[df['industry'] == industry]
                        if not industry_data.empty:
                            trend = industry_data.groupby('date')[metric].mean()
                            if len(trend) > 0:
                                industry_trends[industry] = trend.to_dict()
                    
                    correlations['shared_trends'][metric] = industry_trends
        
        return correlations

    def perform_market_basket_analysis(self, df: pd.DataFrame, min_support: float = 0.01, 
                                      min_confidence: float = 0.3, min_lift: float = 1.0) -> dict:
        """
        Perform advanced market basket analysis with support for multiple analytics dimensions.
        
        Args:
            df (pd.DataFrame): Input transaction data with required columns
            min_support (float): Minimum support threshold for frequent itemsets (default: 0.01)
            min_confidence (float): Minimum confidence threshold for rules (default: 0.3)
            min_lift (float): Minimum lift threshold for rules (default: 1.0)
            
        Returns:
            dict: Dictionary containing:
                - product_associations: Support, confidence, and lift metrics for product pairs
                - temporal_baskets: Time-based purchase patterns
                - product_clusters: Product groupings based on purchase behavior
                - customer_segments: Customer segments based on purchase patterns
                - performance_metrics: Key performance indicators
                
        Raises:
            ValueError: If required columns are missing or data validation fails
        """
        try:
            # Validate input data
            required_columns = ['transaction_id', 'product_id']
            if not all(col in df.columns for col in required_columns):
                raise ValueError(f"Missing required columns: {set(required_columns) - set(df.columns)}")
            
            if df.empty:
                raise ValueError("Empty dataframe provided")
                
            # Work with a copy of the dataframe
            df = df.copy()
            
            # Convert to basket format with optimization for large datasets
            baskets = (df.groupby('transaction_id')['product_id']
                      .agg(lambda x: frozenset(x.values))  # Using frozenset for better performance
                      .reset_index())
            
            total_transactions = len(baskets)
            
            # Calculate product frequencies using vectorized operations
            product_freq = df.groupby('product_id').size().to_dict()
            
            # Generate product pairs efficiently
            pairs_data = []
            for products in baskets['product_id']:
                products_list = list(products)  # Convert frozenset to list once
                pairs_data.extend(
                    tuple(sorted([p1, p2]))
                    for i, p1 in enumerate(products_list)
                    for p2 in products_list[i+1:]
                )
            
            pair_freq = pd.Series(pairs_data).value_counts().to_dict()
            
            # Calculate association metrics with validation
            product_associations = {
                'support': {},
                'confidence': {},
                'lift': {},
                'metrics_distribution': {
                    'support': {'min': float('inf'), 'max': 0, 'mean': 0},
                    'confidence': {'min': float('inf'), 'max': 0, 'mean': 0},
                    'lift': {'min': float('inf'), 'max': 0, 'mean': 0}
                }
            }
            
            valid_rules = []
            for pair, freq in pair_freq.items():
                prod1, prod2 = pair
                support = freq / total_transactions
                
                if support >= min_support:
                    confidence_1_2 = freq / product_freq[prod1]
                    confidence_2_1 = freq / product_freq[prod2]
                    max_confidence = max(confidence_1_2, confidence_2_1)
                    
                    if max_confidence >= min_confidence:
                        lift = (freq * total_transactions) / (product_freq[prod1] * product_freq[prod2])
                        
                        if lift >= min_lift:
                            valid_rules.append({
                                'pair': pair,
                                'support': support,
                                'confidence': max_confidence,
                                'lift': lift
                            })
                            
                            # Store metrics with string keys for JSON serialization
                            pair_key = f"({prod1}, {prod2})"
                            product_associations['support'][pair_key] = float(support)
                            product_associations['confidence'][pair_key] = float(max_confidence)
                            product_associations['lift'][pair_key] = float(lift)
                            
                            # Update metrics distribution
                            for metric_type, value in [('support', support), 
                                                     ('confidence', max_confidence), 
                                                     ('lift', lift)]:
                                dist = product_associations['metrics_distribution'][metric_type]
                                dist['min'] = min(dist['min'], value)
                                dist['max'] = max(dist['max'], value)
                                
            # Calculate means for distributions
            for metric_type in ['support', 'confidence', 'lift']:
                values = [rule[metric_type] for rule in valid_rules]
                if values:
                    product_associations['metrics_distribution'][metric_type]['mean'] = float(sum(values) / len(values))
                else:
                    product_associations['metrics_distribution'][metric_type] = {'min': 0, 'max': 0, 'mean': 0}
            
            # Enhanced temporal analysis
            temporal_patterns = self._analyze_temporal_patterns(df) if 'timestamp' in df.columns else {}
            
            # Enhanced product clustering
            product_clusters = self._perform_product_clustering(df) if 'quantity' in df.columns else {}
            
            # Customer segmentation
            customer_segments = self._analyze_customer_segments(df) if 'customer_id' in df.columns else {}
            
            # Performance metrics
            performance_metrics = {
                'total_transactions': total_transactions,
                'unique_products': len(product_freq),
                'avg_basket_size': float(df.groupby('transaction_id')['product_id'].count().mean()),
                'total_rules_found': len(valid_rules),
                'rules_distribution': {
                    'strong_associations': len([r for r in valid_rules if r['lift'] > 2]),
                    'moderate_associations': len([r for r in valid_rules if 1 < r['lift'] <= 2]),
                    'weak_associations': len([r for r in valid_rules if r['lift'] <= 1])
                }
            }
            
            return {
                'product_associations': product_associations,
                'temporal_baskets': temporal_patterns,
                'product_clusters': product_clusters,
                'customer_segments': customer_segments,
                'performance_metrics': performance_metrics
            }
            
        except Exception as e:
            print(f"Error in market basket analysis: {str(e)}")
            raise ValueError(f"Market basket analysis failed: {str(e)}") from e
            
    def _analyze_temporal_patterns(self, df: pd.DataFrame) -> dict:
        """Analyze temporal patterns in purchase behavior"""
        patterns = {
            'daily_patterns': {},
            'weekly_patterns': {},
            'monthly_patterns': {},
            'hourly_patterns': {}
        }
        
        try:
            timestamps = pd.to_datetime(df['timestamp'])
            
            for period, grouper in [
                ('hourly_patterns', timestamps.dt.hour),
                ('daily_patterns', timestamps.dt.day),
                ('weekly_patterns', timestamps.dt.dayofweek),
                ('monthly_patterns', timestamps.dt.month)
            ]:
                pattern_data = df.groupby(grouper).agg({
                    'product_id': ['count', 'nunique'],
                    'transaction_id': 'nunique',
                    'quantity': ['sum', 'mean'] if 'quantity' in df.columns else ['count']
                }).round(2)
                
                patterns[period] = {
                    'transaction_count': pattern_data['transaction_id']['nunique'].to_dict(),
                    'product_count': pattern_data['product_id']['count'].to_dict(),
                    'unique_products': pattern_data['product_id']['nunique'].to_dict(),
                    'total_quantity': pattern_data['quantity']['sum'].to_dict() if 'quantity' in df.columns else {},
                    'avg_quantity': pattern_data['quantity']['mean'].to_dict() if 'quantity' in df.columns else {}
                }
                
        except (ValueError, KeyError) as e:
            print(f"Error in temporal pattern analysis: {str(e)}")
            return patterns
            
        return patterns
        
    def _perform_product_clustering(self, df: pd.DataFrame) -> dict:
        """Perform advanced product clustering analysis"""
        try:
            # Create rich product features
            product_features = df.groupby('product_id').agg({
                'quantity': ['mean', 'std', 'sum', 'count'],
                'transaction_id': 'nunique'
            }).fillna(0)
            
            # Feature engineering
            product_features['quantity_per_transaction'] = (
                product_features['quantity']['sum'] / 
                product_features['transaction_id']['nunique']
            )
            
            # Prepare features for clustering
            features_for_clustering = product_features.copy()
            features_for_clustering.columns = [f"{col[0]}_{col[1]}" if isinstance(col, tuple) else col 
                                            for col in features_for_clustering.columns]
            
            if len(features_for_clustering) > 1:
                # Scale features
                scaler = StandardScaler()
                scaled_features = scaler.fit_transform(features_for_clustering)
                
                # Determine optimal number of clusters
                max_clusters = min(5, len(features_for_clustering) - 1)
                scores = []
                for k in range(2, max_clusters + 1):
                    kmeans = KMeans(n_clusters=k, random_state=42)
                    clusters = kmeans.fit_predict(scaled_features)
                    score = silhouette_score(scaled_features, clusters)
                    scores.append((k, score))
                
                # Use optimal number of clusters
                optimal_k = max(scores, key=lambda x: x[1])[0]
                kmeans = KMeans(n_clusters=optimal_k, random_state=42)
                clusters = kmeans.fit_predict(scaled_features)
                
                # Prepare cluster insights
                cluster_data = {
                    'cluster_assignments': {
                        prod: int(cluster) for prod, cluster in zip(product_features.index, clusters)
                    },
                    'cluster_profiles': {},
                    'evaluation_metrics': {
                        'silhouette_score': float(max(scores, key=lambda x: x[1])[1]),
                        'num_clusters': optimal_k
                    }
                }
                
                # Generate cluster profiles
                for cluster_id in range(optimal_k):
                    cluster_mask = clusters == cluster_id
                    cluster_data['cluster_profiles'][str(cluster_id)] = {
                        'size': int(sum(cluster_mask)),
                        'avg_quantity': float(product_features['quantity']['mean'][cluster_mask].mean()),
                        'avg_transactions': float(product_features['transaction_id']['nunique'][cluster_mask].mean()),
                        'total_quantity': float(product_features['quantity']['sum'][cluster_mask].sum()),
                        'purchase_frequency': float(
                            (product_features['quantity']['count'][cluster_mask].sum() / 
                             product_features['transaction_id']['nunique'][cluster_mask].sum())
                        )
                    }
                
                return cluster_data
                
        except np.linalg.LinAlgError as e:
            print(f"Error in clustering computation: {str(e)}")
            return {}
        except (ValueError, KeyError) as e:
            print(f"Error in product clustering: {str(e)}")
            return {}
            
        return {}
        
    def _analyze_customer_segments(self, df: pd.DataFrame) -> dict:
        """Analyze customer segments based on purchase behavior"""
        try:
            if 'customer_id' not in df.columns:
                return {}
                
            customer_stats = df.groupby('customer_id').agg({
                'transaction_id': 'nunique',
                'product_id': ['nunique', 'count'],
                'quantity': ['sum', 'mean'] if 'quantity' in df.columns else ['count', 'mean']
            })
            
            # Calculate RFM scores
            if 'timestamp' in df.columns:
                current_date = pd.to_datetime(df['timestamp']).max()
                customer_stats['recency'] = df.groupby('customer_id')['timestamp'].max().apply(
                    lambda x: (current_date - pd.to_datetime(x)).days
                )
                
            # Segment customers
            stats_for_clustering = customer_stats.copy()
            stats_for_clustering.columns = [f"{col[0]}_{col[1]}" if isinstance(col, tuple) else col 
                                         for col in stats_for_clustering.columns]
            
            if len(stats_for_clustering) > 1:
                scaler = StandardScaler()
                scaled_features = scaler.fit_transform(stats_for_clustering)
                
                # Use DBSCAN for flexible cluster numbers
                dbscan = DBSCAN(eps=0.5, min_samples=3)
                clusters = dbscan.fit_predict(scaled_features)
                
                return {
                    'customer_segments': {
                        str(cust): int(cluster) for cust, cluster in zip(customer_stats.index, clusters)
                    },
                    'segment_profiles': {
                        str(segment): {
                            'size': int(sum(clusters == segment)),
                            'avg_transactions': float(customer_stats['transaction_id']['nunique'][clusters == segment].mean()),
                            'avg_products': float(customer_stats['product_id']['nunique'][clusters == segment].mean())
                        }
                        for segment in set(clusters) if segment != -1
                    },
                    'segment_statistics': {
                        'num_segments': len(set(clusters) - {-1}),
                        'noise_points': int(sum(clusters == -1))
                    }
                }
                
        except Exception as e:
            print(f"Error in customer segmentation: {str(e)}")
            return {}
    
    def _calculate_correlations(self, df: pd.DataFrame) -> dict:
        """Calculate correlations between numeric columns with detailed statistics"""
        correlations = {}
        
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) < 2:
                return correlations
                
            # Calculate correlation matrix
            corr_matrix = df[numeric_cols].corr()
            
            # Convert correlations to dictionary with additional metadata
            for col1 in numeric_cols:
                correlations[col1] = {}
                for col2 in numeric_cols:
                    if col1 != col2:
                        correlation = corr_matrix.loc[col1, col2]
                        if not np.isnan(correlation):
                            # Calculate p-value using pearsonr
                            coef, p_value = pearsonr(df[col1].fillna(0), df[col2].fillna(0))
                            correlations[col1][col2] = {
                                'coefficient': float(correlation),
                                'p_value': float(p_value),
                                'strength': 'strong' if abs(correlation) > 0.7 
                                          else 'moderate' if abs(correlation) > 0.3 
                                          else 'weak',
                                'direction': 'positive' if correlation > 0 else 'negative',
                                'sample_size': len(df)
                            }
                            
        except Exception as e:
            print(f"Error calculating correlations: {str(e)}")
            return {}
            
        return correlations
