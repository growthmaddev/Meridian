#!/usr/bin/env python3
"""
Mock Meridian training script for development
Generates realistic-looking MMM results without requiring the actual Meridian library
"""

import json
import sys
import time
import random
import pandas as pd
import numpy as np
import os

def main(data_file: str, config_file: str, output_file: str):
    """Mock training function that simulates a real training process"""
    
    # Progress updates for UI
    print(json.dumps({"status": "loading_data", "progress": 10}))
    time.sleep(1)  # Simulate processing time
    
    # Load data and config
    if os.path.exists(data_file):
        df = pd.read_csv(data_file)
        print(f"Loaded CSV with {len(df)} rows and {len(df.columns)} columns")
    else:
        print(f"Warning: File {data_file} not found. Using mock data.")
        # Create mock data
        df = pd.DataFrame({
            'date': pd.date_range(start='2022-01-01', periods=52, freq='W'),
            'sales': np.random.normal(100000, 15000, 52),
            'tv_spend': np.random.normal(20000, 5000, 52),
            'radio_spend': np.random.normal(5000, 1000, 52),
            'digital_spend': np.random.normal(15000, 3000, 52),
            'print_spend': np.random.normal(8000, 2000, 52),
            'temperature': np.random.normal(70, 10, 52),
            'holiday': np.random.binomial(1, 0.2, 52)
        })
    
    # Load or create mock config
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            config = json.load(f)
    else:
        print(f"Warning: Config file {config_file} not found. Using default config.")
        config = {
            'date_column': 'date',
            'target_column': 'sales',
            'channel_columns': ['tv_spend', 'radio_spend', 'digital_spend', 'print_spend'],
            'control_columns': ['temperature', 'holiday'],
            'seasonality': 52
        }
    
    # Get actual column names from the data
    actual_columns = list(df.columns)
    
    # Ensure config uses actual column names
    channel_columns = [col for col in config.get('channel_columns', []) if col in actual_columns]
    if not channel_columns and any('spend' in col.lower() for col in actual_columns):
        channel_columns = [col for col in actual_columns if 'spend' in col.lower()]
    
    target_column = config.get('target_column')
    if target_column not in actual_columns:
        possible_targets = [col for col in actual_columns if any(x in col.lower() for x in ['sales', 'revenue', 'conversion', 'kpi'])]
        target_column = possible_targets[0] if possible_targets else actual_columns[0]

    date_column = config.get('date_column')
    if date_column not in actual_columns:
        possible_dates = [col for col in actual_columns if any(x in col.lower() for x in ['date', 'week', 'month', 'day'])]
        date_column = possible_dates[0] if possible_dates else None
    
    print(json.dumps({"status": "preparing_data", "progress": 20}))
    time.sleep(1)  # Simulate processing time
    
    print(json.dumps({"status": "configuring_model", "progress": 30}))
    time.sleep(1)  # Simulate processing time
    
    print(json.dumps({"status": "training_model", "progress": 40}))
    time.sleep(2)  # Simulate longer training time
    
    print(json.dumps({"status": "extracting_results", "progress": 80}))
    time.sleep(1)  # Simulate processing time
    
    # Generate realistic mock results
    total_spend = sum(df[channel].sum() for channel in channel_columns)
    total_revenue = df[target_column].sum() if target_column in df.columns else 1000000
    
    # Mock channel analysis
    channel_analysis = {}
    total_contribution = 0
    for channel in channel_columns:
        channel_spend = df[channel].sum() if channel in df.columns else 10000
        contribution = channel_spend * (0.5 + random.random() * 3)  # ROI between 0.5 and 3.5
        total_contribution += contribution
        
    # Normalize contributions
    channel_analysis = {}
    for channel in channel_columns:
        channel_spend = df[channel].sum() if channel in df.columns else 10000
        contribution = channel_spend * (0.5 + random.random() * 3)
        contribution_pct = contribution / total_contribution
        roi = contribution / channel_spend
        roi_lower = roi * 0.7
        roi_upper = roi * 1.3
        
        channel_analysis[channel] = {
            "contribution": float(contribution),
            "contribution_percentage": float(contribution_pct),
            "roi": float(roi),
            "roi_lower": float(roi_lower),
            "roi_upper": float(roi_upper),
        }
    
    # Mock response curves
    response_curves = {}
    for channel in channel_columns:
        response_curves[channel] = {
            "saturation": {
                "ec": float(random.uniform(0.3, 0.7)),
                "slope": float(random.uniform(1.0, 3.0)),
            },
            "adstock": {
                "decay": float(random.uniform(0.1, 0.9)),
                "peak": int(random.randint(0, 3)),
            }
        }
    
    # Mock optimization
    budget = sum(df[channel].sum() for channel in channel_columns if channel in df.columns)
    optimal_allocation = {}
    for channel in channel_columns:
        channel_spend = df[channel].sum() if channel in df.columns else budget / len(channel_columns)
        optimal_allocation[channel] = float(channel_spend * random.uniform(0.7, 1.3))
    
    # Adjust to match budget
    total_optimal = sum(optimal_allocation.values())
    scaling_factor = budget / total_optimal
    for channel in optimal_allocation:
        optimal_allocation[channel] *= scaling_factor
    
    # Generate final results
    results = {
        "model_type": "meridian_mock",
        "success": True,
        "metrics": {
            "r_squared": float(random.uniform(0.7, 0.95)),
            "mape": float(random.uniform(0.05, 0.15)),
        },
        "channel_analysis": channel_analysis,
        "response_curves": response_curves,
        "optimization": {
            "current_budget": float(budget),
            "optimal_allocation": optimal_allocation,
            "expected_lift": float(random.uniform(0.05, 0.25))
        },
    }
    
    # Save results
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(json.dumps({"status": "completed", "progress": 100}))

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({
            "error": "Usage: python mock_train_meridian.py <data_file> <config_file> <output_file>"
        }))
        sys.exit(1)
    
    try:
        main(sys.argv[1], sys.argv[2], sys.argv[3])
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "status": "failed"
        }))
        sys.exit(1)