import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class PythonService {
  private readonly logger = new Logger(PythonService.name);
  private readonly scriptsPath = path.join(process.cwd(), 'src/infrastructure/ml/scripts');

  constructor() {
    this.ensureScriptsDirectory();
  }

  private async ensureScriptsDirectory() {
    try {
      await fs.mkdir(this.scriptsPath, { recursive: true });
    } catch (error) {
      this.logger.error(`Error creating scripts directory: ${(error as any).message}`);
    }
  }

  async runProphetForecast(data: any[], params: any): Promise<any> {
    try {
      const scriptPath = path.join(this.scriptsPath, 'prophet_forecast.py');
      await this.createProphetScript();

      const pythonProcess = spawn('python3', [
        scriptPath,
        JSON.stringify(data),
        JSON.stringify(params)
      ]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      return new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Prophet script failed: ${error}`));
            return;
          }
          try {
            resolve(JSON.parse(result));
          } catch (e) {
            reject(new Error(`Failed to parse Prophet output: ${(e as any).message}`));
          }
        });
      });
    } catch (error) {
      this.logger.error(`Error running Prophet forecast: ${(error as any).message}`);
      throw error;
    }
  }

  private async createProphetScript(): Promise<void> {
    const scriptContent = `
import sys
import json
import pandas as pd
from prophet import Prophet
import numpy as np

def run_prophet_forecast(data, params):
    # Convert input data to DataFrame
    df = pd.DataFrame(data)
    
    # Ensure required columns exist
    if 'ds' not in df.columns or 'y' not in df.columns:
        raise ValueError("Data must contain 'ds' (date) and 'y' (target) columns")
    
    # Initialize and fit Prophet model
    model = Prophet(
        yearly_seasonality=params.get('yearly_seasonality', 'auto'),
        weekly_seasonality=params.get('weekly_seasonality', 'auto'),
        daily_seasonality=params.get('daily_seasonality', 'auto'),
        changepoint_prior_scale=params.get('changepoint_prior_scale', 0.05)
    )
    
    # Add additional regressors if specified
    for regressor in params.get('regressors', []):
        if regressor in df.columns:
            model.add_regressor(regressor)
    
    # Fit the model
    model.fit(df)
    
    # Create future dataframe for forecasting
    future_periods = params.get('periods', 30)
    future = model.make_future_dataframe(
        periods=future_periods,
        freq=params.get('freq', 'D')
    )
    
    # Add regressor values to future dataframe if needed
    for regressor in params.get('regressors', []):
        if regressor in df.columns:
            # Simple forward fill for demo purposes
            future[regressor] = df[regressor].iloc[-1]
    
    # Make forecast
    forecast = model.predict(future)
    
    # Prepare results
    results = {
        'forecast': forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records'),
        'components': {
            'trend': forecast['trend'].tolist(),
            'yearly': forecast['yearly'].tolist() if 'yearly' in forecast else None,
            'weekly': forecast['weekly'].tolist() if 'weekly' in forecast else None,
            'daily': forecast['daily'].tolist() if 'daily' in forecast else None
        },
        'metrics': {
            'mape': calculate_mape(df['y'].values, forecast['yhat'][:len(df)].values),
            'rmse': calculate_rmse(df['y'].values, forecast['yhat'][:len(df)].values)
        }
    }
    
    return results

def calculate_mape(y_true, y_pred):
    mask = y_true != 0
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100

def calculate_rmse(y_true, y_pred):
    return np.sqrt(np.mean((y_true - y_pred) ** 2))

if __name__ == '__main__':
    # Read input data and parameters
    data = json.loads(sys.argv[1])
    params = json.loads(sys.argv[2])
    
    # Run forecast
    results = run_prophet_forecast(data, params)
    
    # Output results as JSON
    print(json.dumps(results))
`;

    const scriptPath = path.join(this.scriptsPath, 'prophet_forecast.py');
    await fs.writeFile(scriptPath, scriptContent);
  }

  async runAutomatedEDA(data: any[], params: any): Promise<any> {
    try {
      const scriptPath = path.join(this.scriptsPath, 'automated_eda.py');
      await this.createEDAScript();

      const pythonProcess = spawn('python3', [
        scriptPath,
        JSON.stringify(data),
        JSON.stringify(params)
      ]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      return new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`EDA script failed: ${error}`));
            return;
          }
          try {
            resolve(JSON.parse(result));
          } catch (e) {
            reject(new Error(`Failed to parse EDA output: ${(e as any).message}`));
          }
        });
      });
    } catch (error) {
      this.logger.error(`Error running automated EDA: ${(error as any).message}`);
      throw error;
    }
  }

  private async createEDAScript(): Promise<void> {
    const scriptContent = `
import sys
import json
import pandas as pd
import numpy as np
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

def run_automated_eda(data, params):
    # Convert input data to DataFrame
    df = pd.DataFrame(data)
    
    results = {
        'summary': get_summary_stats(df),
        'correlations': get_correlations(df),
        'distributions': get_distributions(df),
        'time_patterns': get_time_patterns(df, params),
        'anomalies': detect_anomalies(df),
    }
    
    return results

def get_summary_stats(df):
    # Basic statistics for each column
    summary = {}
    
    for column in df.columns:
        col_stats = {
            'type': str(df[column].dtype),
            'missing': df[column].isnull().sum(),
            'unique_values': df[column].nunique()
        }
        
        if pd.api.types.is_numeric_dtype(df[column]):
            col_stats.update({
                'mean': float(df[column].mean()),
                'std': float(df[column].std()),
                'min': float(df[column].min()),
                'max': float(df[column].max()),
                'quartiles': df[column].quantile([0.25, 0.5, 0.75]).to_dict()
            })
            
        summary[column] = col_stats
    
    return summary

def get_correlations(df):
    # Calculate correlations for numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) > 1:
        corr_matrix = df[numeric_cols].corr().round(3)
        return corr_matrix.to_dict()
    return {}

def get_distributions(df):
    distributions = {}
    
    for column in df.columns:
        if pd.api.types.is_numeric_dtype(df[column]):
            # Basic distribution statistics
            distributions[column] = {
                'histogram': np.histogram(df[column].dropna(), bins='auto')[0].tolist(),
                'skewness': float(stats.skew(df[column].dropna())),
                'kurtosis': float(stats.kurtosis(df[column].dropna()))
            }
        elif pd.api.types.is_categorical_dtype(df[column]) or df[column].dtype == 'object':
            # Value counts for categorical variables
            distributions[column] = df[column].value_counts().head(10).to_dict()
    
    return distributions

def get_time_patterns(df, params):
    time_patterns = {}
    date_columns = params.get('date_columns', [])
    
    for date_col in date_columns:
        if date_col in df.columns:
            df[date_col] = pd.to_datetime(df[date_col])
            patterns = {
                'daily_patterns': df.groupby(df[date_col].dt.hour).size().to_dict(),
                'weekly_patterns': df.groupby(df[date_col].dt.dayofweek).size().to_dict(),
                'monthly_patterns': df.groupby(df[date_col].dt.month).size().to_dict()
            }
            time_patterns[date_col] = patterns
    
    return time_patterns

def detect_anomalies(df):
    anomalies = {}
    
    for column in df.select_dtypes(include=[np.number]).columns:
        data = df[column].dropna()
        if len(data) > 0:
            # Use IQR method for anomaly detection
            Q1 = data.quantile(0.25)
            Q3 = data.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            anomalies[column] = {
                'lower_bound': float(lower_bound),
                'upper_bound': float(upper_bound),
                'num_anomalies': int(((data < lower_bound) | (data > upper_bound)).sum())
            }
    
    return anomalies

if __name__ == '__main__':
    # Read input data and parameters
    data = json.loads(sys.argv[1])
    params = json.loads(sys.argv[2])
    
    # Run EDA
    results = run_automated_eda(data, params)
    
    # Output results as JSON
    print(json.dumps(results))
`;

    const scriptPath = path.join(this.scriptsPath, 'automated_eda.py');
    await fs.writeFile(scriptPath, scriptContent);
  }
}
