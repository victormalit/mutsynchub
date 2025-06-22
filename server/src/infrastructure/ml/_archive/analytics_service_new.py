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
            key_parts.append(json.dumps(params, sort_keys=True, cls=CustomJSONEncoder))
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
