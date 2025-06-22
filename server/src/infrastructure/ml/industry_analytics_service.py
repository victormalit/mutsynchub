import json
import requests
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import DBSCAN
from scipy.stats import pearsonr
from sklearn.ensemble import IsolationForest
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from .base_analytics_service import BaseAnalyticsService
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
import networkx as nx

def audit_log_event(
    action,
    resource,
    details=None,
    user_id=None,
    org_id=None,
    ip_address=None,
    user_agent=None,
    endpoint="http://localhost:3000/audit-log"  # Update to your actual endpoint
):
    """
    Send an audit log event to the backend. Non-blocking: failures are ignored.
    """
    payload = {
        "userId": user_id,
        "orgId": org_id,
        "action": action,
        "resource": resource,
        "details": details or {},
        "ipAddress": ip_address,
        "userAgent": user_agent,
    }
    try:
        requests.post(endpoint, json=payload, timeout=2)
    except Exception:
        pass

class IndustryAnalyticsService(BaseAnalyticsService):
    def perform_eda(self, data, industry=None, user_id=None, org_id=None, ip_address=None, user_agent=None):
        """
        Perform exploratory data analysis with industry-specific and cross-industry logic.
        Audit log start, success, and failure.
        """
        audit_log_event(
            action="analytics_run_start",
            resource="analytics",
            details={"industry": industry},
            user_id=user_id,
            org_id=org_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        try:
            df = pd.DataFrame(data)
            result = super().perform_eda(data)
            # Add industry-specific metrics if industry is provided
            if industry and industry in self.industry_metrics:
                result['industry_metrics'] = self.industry_metrics[industry](df)
            # Add cross-industry insights if available
            if hasattr(self, 'cross_industry_analyzers'):
                result['cross_industry_insights'] = {
                    k: v(df) for k, v in self.cross_industry_analyzers.items() if callable(v)
                }
            audit_log_event(
                action="analytics_run_success",
                resource="analytics",
                details={"industry": industry, "result_summary": str(result)[:500]},
                user_id=user_id,
                org_id=org_id,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            return result
        except Exception as e:
            audit_log_event(
                action="analytics_run_failure",
                resource="analytics",
                details={"industry": industry, "error": str(e)},
                user_id=user_id,
                org_id=org_id,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            raise
    def _perform_clustering(self, df):
        """Perform clustering analysis on numeric columns using KMeans and return cluster assignments, centroids, and silhouette score."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return {'error': 'Not enough numeric columns for clustering'}
        X = df[numeric_cols].fillna(0)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        # Try 2-5 clusters, pick the best silhouette score
        best_score = -1
        best_k = 2
        best_labels = None
        best_centroids = None
        for k in range(2, min(6, len(X))):
            kmeans = KMeans(n_clusters=k, random_state=42)
            labels = kmeans.fit_predict(X_scaled)
            score = silhouette_score(X_scaled, labels)
            if score > best_score:
                best_score = score
                best_k = k
                best_labels = labels
                best_centroids = kmeans.cluster_centers_
        return {
            'cluster_assignments': best_labels.tolist() if best_labels is not None else [],
            'cluster_centroids': best_centroids.tolist() if best_centroids is not None else [],
            'silhouette_score': float(best_score)
        }

    def _perform_dimensionality_reduction(self, df):
        """Perform PCA for dimensionality reduction on numeric columns."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return {'error': 'Not enough numeric columns for PCA'}
        X = df[numeric_cols].fillna(0)
        pca = PCA(n_components=min(3, len(numeric_cols)))
        reduced = pca.fit_transform(X)
        return {
            'components': pca.components_.tolist(),
            'explained_variance': pca.explained_variance_ratio_.tolist(),
            'reduced_data': reduced.tolist()
        }

    def _detect_anomalies(self, df):
        """Detect anomalies in numeric columns using IsolationForest."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 1:
            return {'error': 'No numeric columns for anomaly detection'}
        X = df[numeric_cols].fillna(0)
        iso = IsolationForest(contamination=0.05, random_state=42)
        scores = iso.fit_predict(X)
        anomaly_scores = iso.decision_function(X)
        threshold = np.percentile(anomaly_scores, 5)
        anomaly_indices = np.where(scores == -1)[0].tolist()
        return {
            'anomaly_indices': anomaly_indices,
            'anomaly_scores': anomaly_scores.tolist(),
            'threshold': float(threshold)
        }
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
                            coef, p_value = pearsonr(df[col1].fillna(0), df[col2].fillna(0))
                            correlations[col1][col2] = {
                                'coefficient': float(correlation),
                                'p_value': float(p_value),
                                'strength': 'strong' if abs(correlation) > 0.7 \
                                          else 'moderate' if abs(correlation) > 0.3 \
                                          else 'weak',
                                'direction': 'positive' if correlation > 0 else 'negative',
                                'sample_size': len(df)
                            }
        except Exception as e:
            print(f"Error calculating correlations: {str(e)}")
            return {}
        return correlations
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
    def _retail_metrics(self, df):
        """
        Calculate retail-specific metrics
        """
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
    def _analyze_sustainability_metrics(self, df):
        """
        Cross-industry: Sustainability metrics
        - Environmental impact
        - Resource utilization
        - Waste management
        """
        results = {}
        # Environmental Impact
        if 'carbon_footprint' in df.columns:
            carbon_trend = df['carbon_footprint'].cumsum().to_dict()
            total_emissions = float(df['carbon_footprint'].sum())
            results['environmental_impact'] = {
                'carbon_footprint_trend': carbon_trend,
                'total_emissions': total_emissions
            }
        else:
            results['environmental_impact'] = {'error': 'carbon_footprint column missing'}

        # Resource Utilization
        if 'energy_consumption' in df.columns and 'water_consumption' in df.columns:
            energy_eff = float(df['energy_consumption'].mean())
            water_eff = float(df['water_consumption'].mean())
            results['resource_utilization'] = {
                'energy_efficiency': energy_eff,
                'water_efficiency': water_eff
            }
        else:
            results['resource_utilization'] = {'error': 'energy_consumption or water_consumption column missing'}

        # Waste Management
        if 'waste_generated' in df.columns and 'recycling_rate' in df.columns:
            recycling_perf = float(df['recycling_rate'].mean())
            waste_trend = df['waste_generated'].cumsum().to_dict()
            results['waste_management'] = {
                'recycling_performance': recycling_perf,
                'waste_reduction_trend': waste_trend
            }
        else:
            results['waste_management'] = {'error': 'waste_generated or recycling_rate column missing'}

        # Energy Metrics (for compatibility with some tests)
        if 'energy_consumption' in df.columns:
            results['energy_metrics'] = {
                'total_energy': float(df['energy_consumption'].sum()),
                'avg_energy': float(df['energy_consumption'].mean())
            }
        else:
            results['energy_metrics'] = {'error': 'energy_consumption column missing'}

        # Water Usage (for compatibility with some tests)
        if 'water_consumption' in df.columns:
            results['water_usage'] = {
                'total_water': float(df['water_consumption'].sum()),
                'avg_water': float(df['water_consumption'].mean())
            }
        else:
            results['water_usage'] = {'error': 'water_consumption column missing'}

        return results
    def _wholesale_metrics(self, df):
        """
        Wholesale-specific analytics including:
        - Order analytics
        - Supplier performance metrics
        - Bulk pricing optimization
        """
        results = {}
        # Order Analytics
        if {'order_id', 'order_amount', 'customer_id'}.issubset(df.columns):
            order_stats = df.groupby('order_id').agg({
                'order_amount': ['sum', 'mean'],
                'customer_id': 'nunique'
            })
            results['order_analytics'] = {
                'total_orders': int(df['order_id'].nunique()),
                'total_order_amount': float(df['order_amount'].sum()),
                'avg_order_amount': float(df['order_amount'].mean()),
                'unique_customers': int(df['customer_id'].nunique()),
                'order_stats': order_stats.to_dict()
            }
        else:
            results['order_analytics'] = {'error': 'order_id, order_amount, or customer_id column missing'}

        # Supplier Performance Metrics
        if {'supplier_id', 'order_id', 'delivery_time'}.issubset(df.columns):
            supplier_perf = df.groupby('supplier_id').agg({
                'order_id': 'count',
                'delivery_time': ['mean', 'std', 'min', 'max']
            })
            results['supplier_performance'] = supplier_perf.to_dict()
        else:
            results['supplier_performance'] = {'error': 'supplier_id, order_id, or delivery_time column missing'}

        # Bulk Pricing Optimization
        if {'product_id', 'quantity', 'unit_price'}.issubset(df.columns):
            bulk_stats = df.groupby('product_id').agg({
                'quantity': 'sum',
                'unit_price': ['mean', 'min', 'max']
            })
            # Identify products with price breaks (min < mean)
            price_breaks = {}
            for pid, row in bulk_stats.iterrows():
                mean_price = row[('unit_price', 'mean')]
                min_price = row[('unit_price', 'min')]
                if min_price < mean_price:
                    price_breaks[pid] = {
                        'mean_price': float(mean_price),
                        'min_price': float(min_price),
                        'max_price': float(row[('unit_price', 'max')]),
                        'total_quantity': int(row[('quantity', 'sum')])
                    }
            results['bulk_pricing_optimization'] = price_breaks
        else:
            results['bulk_pricing_optimization'] = {'error': 'product_id, quantity, or unit_price column missing'}

        return results

    def _analyze_market_dynamics(self, df):
        """
        Cross-industry: Market dynamics analysis
        - Market trends
        - Competitive analysis
        - Growth patterns
        """
        results = {}
        # Market Trends
        if 'date' in df.columns and 'revenue' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            daily_revenue = df.groupby('date')['revenue'].sum()
            results['market_trends'] = {
                'daily_revenue': daily_revenue.to_dict(),
                'trend_direction': 'upward' if daily_revenue.iloc[-1] > daily_revenue.iloc[0] else 'downward'
            }
        else:
            results['market_trends'] = {'error': 'date or revenue column missing'}

        # Competitive Analysis
        if 'competitor_price' in df.columns and 'price' in df.columns:
            price_diff = df['price'] - df['competitor_price']
            results['competitive_analysis'] = {
                'avg_price_diff': float(price_diff.mean()),
                'min_price_diff': float(price_diff.min()),
                'max_price_diff': float(price_diff.max())
            }
        else:
            results['competitive_analysis'] = {'error': 'competitor_price or price column missing'}

        # Growth Patterns
        if 'date' in df.columns and 'revenue' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            monthly_growth = df.groupby(df['date'].dt.to_period('M'))['revenue'].sum().pct_change().fillna(0)
            results['growth_patterns'] = monthly_growth.to_dict()
        else:
            results['growth_patterns'] = {'error': 'date or revenue column missing'}

        return results

    def _analyze_supply_chain(self, df):
        """
        Cross-industry: Supply chain optimization
        - Lead time analysis
        - Inventory turnover
        - Bottleneck identification
        """
        results = {}
        # Lead Time Analysis
        if {'order_id', 'order_date', 'delivery_date'}.issubset(df.columns):
            df['order_date'] = pd.to_datetime(df['order_date'])
            df['delivery_date'] = pd.to_datetime(df['delivery_date'])
            df['lead_time'] = (df['delivery_date'] - df['order_date']).dt.days
            lead_time_stats = df.groupby('order_id')['lead_time'].mean()
            results['lead_time_analysis'] = lead_time_stats.to_dict()
        else:
            results['lead_time_analysis'] = {'error': 'order_id, order_date, or delivery_date column missing'}

        # Inventory Turnover
        if 'inventory' in df.columns and 'sales' in df.columns:
            avg_inventory = df['inventory'].mean()
            total_sales = df['sales'].sum()
            turnover = total_sales / avg_inventory if avg_inventory > 0 else 0
            results['inventory_turnover'] = float(turnover)
        else:
            results['inventory_turnover'] = {'error': 'inventory or sales column missing'}

        # Bottleneck Identification
        if 'process_step' in df.columns and 'duration' in df.columns:
            bottlenecks = df.groupby('process_step')['duration'].mean().sort_values(ascending=False)
            results['bottlenecks'] = bottlenecks.to_dict()
        else:
            results['bottlenecks'] = {'error': 'process_step or duration column missing'}

        return results
    def _supermarket_metrics(self, df):
        """
        Supermarket-specific analytics including:
        - Enhanced basket analysis
        - Promotion impact analysis
        - Store layout optimization
        """
        results = {}
        # Enhanced Basket Analysis
        try:
            basket_analysis = self.perform_market_basket_analysis(df)
            results['basket_analysis'] = basket_analysis
        except Exception as e:
            results['basket_analysis'] = {'error': str(e)}

        # Promotion Impact Analysis
        if 'promotion_flag' in df.columns and 'sales_amount' in df.columns:
            promo_sales = df[df['promotion_flag'] == 1]['sales_amount'].sum()
            nonpromo_sales = df[df['promotion_flag'] == 0]['sales_amount'].sum()
            promo_count = df[df['promotion_flag'] == 1].shape[0]
            nonpromo_count = df[df['promotion_flag'] == 0].shape[0]
            avg_promo = promo_sales / promo_count if promo_count > 0 else 0
            avg_nonpromo = nonpromo_sales / nonpromo_count if nonpromo_count > 0 else 0
            uplift = avg_promo - avg_nonpromo
            results['promotion_impact'] = {
                'promo_sales': float(promo_sales),
                'nonpromo_sales': float(nonpromo_sales),
                'avg_promo': float(avg_promo),
                'avg_nonpromo': float(avg_nonpromo),
                'uplift': float(uplift)
            }
        else:
            results['promotion_impact'] = {'error': 'promotion_flag or sales_amount column missing'}

        # Store Layout Optimization (Product Adjacency)
        if {'transaction_id', 'product_id'}.issubset(df.columns):
            # Build adjacency matrix: how often are products bought together
            baskets = df.groupby('transaction_id')['product_id'].apply(list)
            from collections import Counter, defaultdict
            adjacency = defaultdict(Counter)
            for products in baskets:
                for i, p1 in enumerate(products):
                    for p2 in products[i+1:]:
                        adjacency[p1][p2] += 1
                        adjacency[p2][p1] += 1
            # Convert to dict for output
            adjacency_dict = {k: dict(v) for k, v in adjacency.items()}
            results['store_layout'] = {
                'product_adjacency': adjacency_dict
            }
        else:
            results['store_layout'] = {'error': 'transaction_id or product_id column missing'}

        return results
    
    def __init__(self, redis_host='localhost', redis_port=6379, redis_db=0):
        super().__init__(redis_host=redis_host, redis_port=redis_port, redis_db=redis_db)
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

    def analyze_retail_metrics(self, data):
        """
        Analyze retail-specific metrics like customer lifetime value,
        inventory turnover, sales performance etc.
        """
        df = pd.DataFrame(data)
        if df.empty:
            raise ValueError("Empty dataset provided")
            
        results = {
            'customer_metrics': self._calculate_customer_metrics(df),
            'sales_metrics': self._calculate_sales_metrics(df),
            'inventory_metrics': self._calculate_inventory_metrics(df),
            'store_performance': self._analyze_store_performance(df)
        }
        
        return results
        
    def analyze_financial_metrics(self, data):
        """
        Analyze financial metrics like risk assessment,
        portfolio performance, market trends etc.
        """
        df = pd.DataFrame(data)
        if df.empty:
            raise ValueError("Empty dataset provided")
            
        results = {
            'risk_metrics': self._calculate_risk_metrics(df),
            'portfolio_analysis': self._analyze_portfolio(df),
            'market_trends': self._analyze_market_trends(df),
            'volatility_analysis': self._analyze_volatility(df)
        }
        
        return results
        
    def analyze_healthcare_metrics(self, data):
        """
        Analyze healthcare metrics like patient outcomes,
        treatment efficacy, resource utilization etc.
        """
        df = pd.DataFrame(data)
        if df.empty:
            raise ValueError("Empty dataset provided")
            
        results = {
            'patient_metrics': self._calculate_patient_metrics(df),
            'treatment_analysis': self._analyze_treatment_outcomes(df),
            'resource_utilization': self._analyze_resource_usage(df),
            'quality_metrics': self._calculate_quality_metrics(df)
        }
        
        return results

    def _calculate_customer_metrics(self, df):
        """Calculate customer-specific metrics"""
        metrics = {}
        
        if all(col in df.columns for col in ['customer_id', 'purchase_amount', 'purchase_date']):
            # Customer Lifetime Value (CLV)
            df['purchase_date'] = pd.to_datetime(df['purchase_date'])
            clv = df.groupby('customer_id')['purchase_amount'].sum().mean()
            
            # Purchase Frequency
            total_customers = df['customer_id'].nunique()
            total_purchases = len(df)
            purchase_frequency = total_purchases / total_customers
            
            metrics.update({
                'average_clv': float(clv),
                'purchase_frequency': float(purchase_frequency),
                'customer_segments': self._segment_customers(df)
            })
            
        return metrics
        
    def _calculate_sales_metrics(self, df):
        """Calculate sales-specific metrics"""
        metrics = {}
        
        if 'sales_amount' in df.columns:
            # Basic sales metrics
            metrics['total_sales'] = float(df['sales_amount'].sum())
            metrics['average_transaction_value'] = float(df['sales_amount'].mean())
            
            # Sales trends
            if 'sale_date' in df.columns:
                df['sale_date'] = pd.to_datetime(df['sale_date'])
                daily_sales = df.groupby('sale_date')['sales_amount'].sum()
                metrics['daily_sales_trend'] = daily_sales.to_dict()
                
                # Calculate growth rate
                metrics['sales_growth'] = float(((daily_sales.iloc[-1] / daily_sales.iloc[0]) - 1) * 100)
                
        return metrics
        
    def _calculate_inventory_metrics(self, df):
        """Calculate inventory-specific metrics"""
        metrics = {}
        
        if all(col in df.columns for col in ['stock_level', 'product_id']):
            # Stock metrics
            metrics['total_stock'] = int(df['stock_level'].sum())
            metrics['average_stock'] = float(df['stock_level'].mean())
            
            # Stock turnover if sales data available
            if 'sales_quantity' in df.columns:
                turnover = df['sales_quantity'].sum() / df['stock_level'].mean()
                metrics['inventory_turnover'] = float(turnover)
                
        return metrics
        
    def _analyze_store_performance(self, df):
        """Analyze store performance metrics"""
        performance = {}
        
        if all(col in df.columns for col in ['store_id', 'sales_amount']):
            # Store performance analysis
            store_performance = df.groupby('store_id')['sales_amount'].agg([
                'sum', 'mean', 'count'
            ]).to_dict('index')
            
            performance['store_metrics'] = store_performance
            
            # Top performing stores
            top_stores = df.groupby('store_id')['sales_amount'].sum().nlargest(5)
            performance['top_stores'] = top_stores.to_dict()
            
        return performance
        
    def _calculate_risk_metrics(self, df):
        """Calculate financial risk metrics"""
        metrics = {}
        
        if 'returns' in df.columns:
            returns = df['returns'].values
            metrics.update({
                'volatility': float(np.std(returns)),
                'var_95': float(np.percentile(returns, 5)),
                'sharpe_ratio': float(np.mean(returns) / np.std(returns)) if np.std(returns) != 0 else 0
            })
            
        return metrics
        
    def _analyze_portfolio(self, df):
        """Analyze portfolio performance"""
        analysis = {}
        
        if all(col in df.columns for col in ['asset_id', 'returns', 'weight']):
            # Portfolio return
            portfolio_return = np.sum(df['returns'] * df['weight'])
            
            # Portfolio risk (standard deviation)
            portfolio_risk = np.sqrt(np.sum(df['weight'] * df['returns'].std()))
            
            analysis.update({
                'portfolio_return': float(portfolio_return),
                'portfolio_risk': float(portfolio_risk),
                'asset_allocation': df.groupby('asset_id')['weight'].sum().to_dict()
            })
            
        return analysis
        
    def _analyze_market_trends(self, df):
        """Analyze market trends"""
        trends = {}
        
        if all(col in df.columns for col in ['date', 'price']):
            df['date'] = pd.to_datetime(df['date'])
            
            # Calculate moving averages
            df['MA50'] = df['price'].rolling(window=50).mean()
            df['MA200'] = df['price'].rolling(window=200).mean()
            
            trends.update({
                'moving_averages': {
                    'MA50': df['MA50'].dropna().to_dict(),
                    'MA200': df['MA200'].dropna().to_dict()
                },
                'trend_direction': 'upward' if df['MA50'].iloc[-1] > df['MA200'].iloc[-1] else 'downward'
            })
            
        return trends
        
    def _analyze_volatility(self, df):
        """Analyze market volatility"""
        analysis = {}
        
        if 'returns' in df.columns:
            # Historical volatility
            hist_volatility = np.std(df['returns']) * np.sqrt(252)  # Annualized
            
            # Volatility clustering
            squared_returns = df['returns'] ** 2
            vol_cluster = squared_returns.autocorr()
            
            analysis.update({
                'historical_volatility': float(hist_volatility),
                'volatility_clustering': float(vol_cluster),
                'extreme_events': self._identify_extreme_events(df)
            })
            
        return analysis
        
    def _calculate_patient_metrics(self, df):
        """Calculate patient-specific metrics"""
        metrics = {}
        
        if 'patient_id' in df.columns:
            # Patient volume metrics
            metrics['total_patients'] = df['patient_id'].nunique()
            
            if 'admission_date' in df.columns:
                df['admission_date'] = pd.to_datetime(df['admission_date'])
                daily_admissions = df.groupby('admission_date')['patient_id'].count()
                metrics['admission_trend'] = daily_admissions.to_dict()
                
            if 'length_of_stay' in df.columns:
                metrics['average_los'] = float(df['length_of_stay'].mean())
                
        return metrics
        
    def _analyze_treatment_outcomes(self, df):
        """Analyze treatment outcomes"""
        analysis = {}
        
        if all(col in df.columns for col in ['treatment_id', 'outcome_score']):
            # Treatment effectiveness
            treatment_outcomes = df.groupby('treatment_id')['outcome_score'].agg([
                'mean', 'std', 'count'
            ]).to_dict('index')
            
            analysis['treatment_effectiveness'] = treatment_outcomes
            
            # Success rates
            if 'success' in df.columns:
                success_rates = df.groupby('treatment_id')['success'].mean()
                analysis['success_rates'] = success_rates.to_dict()
                
        return analysis
        
    def _analyze_resource_usage(self, df):
        """Analyze healthcare resource utilization"""
        analysis = {}
        
        if 'resource_id' in df.columns:
            # Resource utilization rates
            resource_usage = df.groupby('resource_id').agg({
                'usage_hours': ['sum', 'mean'],
                'cost': ['sum', 'mean']
            }).to_dict()
            
            analysis['resource_utilization'] = resource_usage
            
            # Peak usage times if timestamp available
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                peak_times = df.groupby(df['timestamp'].dt.hour)['usage_hours'].mean()
                analysis['peak_usage_hours'] = peak_times.to_dict()
                
        return analysis
        
    def _calculate_quality_metrics(self, df):
        """Calculate healthcare quality metrics"""
        metrics = {}
        
        if 'readmission' in df.columns:
            metrics['readmission_rate'] = float(df['readmission'].mean())
            
        if 'satisfaction_score' in df.columns:
            metrics['patient_satisfaction'] = float(df['satisfaction_score'].mean())
            
        if all(col in df.columns for col in ['complication_flag', 'procedure_id']):
            complication_rates = df.groupby('procedure_id')['complication_flag'].mean()
            metrics['complication_rates'] = complication_rates.to_dict()
            
        return metrics
        
    def _segment_customers(self, df):
        """Segment customers based on behavior"""
        segments = {}
        
        if all(col in df.columns for col in ['customer_id', 'purchase_amount']):
            # RFM Segmentation
            today = df['purchase_date'].max()
            
            rfm = df.groupby('customer_id').agg({
                'purchase_date': lambda x: (today - x.max()).days,  # Recency
                'purchase_amount': ['count', 'sum']  # Frequency and Monetary
            })
            
            # Segment based on percentiles
            r_labels = range(4, 0, -1)
            r_quartiles = pd.qcut(rfm['purchase_date'], q=4, labels=r_labels)
            f_labels = range(1, 5)
            f_quartiles = pd.qcut(rfm['purchase_amount']['count'], q=4, labels=f_labels)
            m_quartiles = pd.qcut(rfm['purchase_amount']['sum'], q=4, labels=f_labels)
            
            segments = {
                'high_value': len(r_quartiles[r_quartiles >= 3]),
                'mid_value': len(r_quartiles[(r_quartiles >= 2) & (r_quartiles < 3)]),
                'low_value': len(r_quartiles[r_quartiles < 2])
            }
            
        return segments
        
    def _identify_extreme_events(self, df):
        """Identify extreme market events"""
        events = {}
        
        if 'returns' in df.columns:
            # Define extreme events as beyond 3 standard deviations
            std_dev = np.std(df['returns'])
            threshold = 3 * std_dev
            
            extreme_events = df[abs(df['returns']) > threshold]
            events = {
                'count': len(extreme_events),
                'dates': extreme_events.index.tolist() if isinstance(df.index, pd.DatetimeIndex) else None,
                'values': extreme_events['returns'].to_dict()
            }
            
        return events
    
    def perform_market_basket_analysis(self, df, min_support=0.01, min_confidence=0.3, min_lift=1.0):
        """
        Advanced market basket analysis with multi-dimensional analytics
        """
        try:
            required_columns = ['transaction_id', 'product_id']
            if not all(col in df.columns for col in required_columns):
                raise ValueError(f"Missing required columns")
            baskets = df.groupby('transaction_id')['product_id'].agg(lambda x: frozenset(x.values))
            total_transactions = len(baskets)
            # Calculate product frequencies
            product_freq = df.groupby('product_id').size()
            # Generate product pairs
            pairs_data = []
            for products in baskets:
                products_list = list(products)
                pairs_data.extend(
                    tuple(sorted([p1, p2]))
                    for i, p1 in enumerate(products_list)
                    for p2 in products_list[i+1:]
                )
            pair_freq = pd.Series(pairs_data).value_counts()
            # Calculate association rules
            associations = {
                'support': {},
                'confidence': {},
                'lift': {}
            }
            for pair, freq in pair_freq.items():
                support = freq / total_transactions
                if support >= min_support:
                    prod1, prod2 = pair
                    conf = freq / product_freq[prod1]
                    if conf >= min_confidence:
                        lift = (freq * total_transactions) / (product_freq[prod1] * product_freq[prod2])
                        if lift >= min_lift:
                            key = f"{prod1}->{prod2}"
                            associations['support'][key] = float(support)
                            associations['confidence'][key] = float(conf)
                            associations['lift'][key] = float(lift)
            # Add temporal patterns
            temporal_baskets = {}
            if 'timestamp' in df.columns:
                timestamps = pd.to_datetime(df['timestamp'])
                temporal_baskets['daily_patterns'] = df.groupby(timestamps.dt.date)['transaction_id'].nunique().to_dict()
                temporal_baskets['weekly_patterns'] = df.groupby(timestamps.dt.isocalendar().week)['transaction_id'].nunique().to_dict()
            # Add product clusters
            product_clusters = self._perform_product_clustering(df) if 'quantity' in df.columns else {}
            return {
                'product_associations': associations,
                'temporal_baskets': temporal_baskets,
                'product_clusters': product_clusters
            }
        except Exception as e:
            raise ValueError(f"Market basket analysis failed: {str(e)}")

    def enhance_cross_industry_correlations(self, df):
        """
        Enhanced analysis of correlations across industries
        """
        # Ensure pearsonr is available in all execution contexts
        from scipy.stats import pearsonr
        correlations = {
            'metric_correlations': {},
            'industry_patterns': {},
            'shared_trends': {}
        }
        
        if 'industry' in df.columns:
            industries = df['industry'].unique()
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            # Calculate cross-industry correlations
            for ind1 in industries:
                for ind2 in industries:
                    if ind1 < ind2:
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

    def _perform_product_clustering(self, df):
        """
        Cluster products based on purchase patterns
        """
        # Ensure silhouette_score is available in all execution contexts
        from sklearn.metrics import silhouette_score
        if not {'product_id', 'quantity'}.issubset(df.columns):
            return {}
            
        # Create product feature matrix
        product_features = df.pivot_table(
            index='product_id',
            columns='transaction_id',
            values='quantity',
            fill_value=0
        )
        
        # Normalize features
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(product_features)
        
        # Determine optimal number of clusters
        max_clusters = min(10, len(product_features) // 2)
        silhouette_scores = []
        
        for n_clusters in range(2, max_clusters + 1):
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            cluster_labels = kmeans.fit_predict(scaled_features)
            score = silhouette_score(scaled_features, cluster_labels)
            silhouette_scores.append(score)
            
        optimal_clusters = silhouette_scores.index(max(silhouette_scores)) + 2
        
        # Perform final clustering
        kmeans = KMeans(n_clusters=optimal_clusters, random_state=42)
        clusters = kmeans.fit_predict(scaled_features)
        
        # Prepare results
        cluster_results = {}
        for i in range(optimal_clusters):
            cluster_products = product_features.index[clusters == i].tolist()
            cluster_results[f'cluster_{i}'] = {
                'products': cluster_products,
                'size': len(cluster_products)
            }
            
        return {
            'clusters': cluster_results,
            'optimal_clusters': optimal_clusters,
            'silhouette_scores': dict(enumerate(silhouette_scores, 2))
        }
