#!/usr/bin/env python3
"""
Train Marketing Mix Model using Google's Meridian
Based on: https://github.com/google/meridian/tree/main/examples
"""

import json
import sys
import pandas as pd
import numpy as np
import os
from typing import Dict, Any

# Set CPU optimization flags before importing TensorFlow
os.environ['TF_NUM_INTEROP_THREADS'] = '8'
os.environ['TF_NUM_INTRAOP_THREADS'] = '8'
os.environ['OMP_NUM_THREADS'] = '8'

# Import Meridian components
try:
    from meridian import InputData
    from meridian import Meridian
    from meridian import spec
    from meridian import optimize
except ImportError:
    # Fallback to alternative import structure
    from meridian.data import InputData
    from meridian.model import Meridian
    from meridian import spec
    from meridian import optimize

def main(data_file: str, config_file: str, output_file: str):
    """Main training function"""
    
    # Progress updates for UI
    print(json.dumps({"status": "loading_data", "progress": 10}))
    
    # Load data and config
    df = pd.read_csv(data_file)
    with open(config_file, 'r') as f:
        config = json.load(f)
    
    # Prepare Meridian InputData
    print(json.dumps({"status": "preparing_data", "progress": 20}))
    
    input_data = InputData(
        df=df,
        date_col=config['date_column'],
        kpi_col=config['target_column'],
        media_cols=config['channel_columns'],
        geo_col=config.get('geo_column', None),  # Optional geo hierarchy
        control_cols=config.get('control_columns', []),
        seasonality=config.get('seasonality', 52),  # Weekly seasonality
    )
    
    # Configure model specification
    print(json.dumps({"status": "configuring_model", "progress": 30}))
    
    model_spec = spec.ModelSpec()
    model_spec.set_media_names(config['channel_columns'])
    
    # Initialize and train model with CPU-optimized parameters
    print(json.dumps({"status": "training_model", "progress": 40}))
    
    model = Meridian(
        input_data=input_data,
        model_spec=model_spec,
        n_chains=2,              # CPU-friendly: 2 chains instead of 4
        n_warmup=500,            # Reduced warmup for faster training
        n_samples=300,           # Reduced samples for initial testing
        seed=123
    )
    
    print(json.dumps({"status": "fitting_model", "progress": 60}))
    
    # Fit the model
    model.fit()
    
    # Extract results
    print(json.dumps({"status": "extracting_results", "progress": 80}))
    
    results = {
        "model_type": "meridian",
        "success": True,
        "metrics": {
            "r_squared": float(model.get_r_squared()),
            "mape": float(model.get_mape()),
        },
        "channel_analysis": extract_channel_results(model, config['channel_columns']),
        "response_curves": extract_response_curves(model, config['channel_columns']),
        "optimization": run_optimization(model, input_data),
    }
    
    # Save results
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(json.dumps({"status": "completed", "progress": 100}))

def extract_channel_results(model: Meridian, channels: list) -> Dict[str, Any]:
    """Extract channel contributions and ROI"""
    
    contributions = model.get_media_contributions()
    roi = model.get_roi()
    
    channel_results = {}
    for i, channel in enumerate(channels):
        channel_results[channel] = {
            "contribution": float(contributions[i]),
            "contribution_percentage": float(contributions[i] / contributions.sum()),
            "roi": float(roi[i]),
            "roi_lower": float(model.get_roi_ci(0.05)[i]),
            "roi_upper": float(model.get_roi_ci(0.95)[i]),
        }
    
    return channel_results

def extract_response_curves(model: Meridian, channels: list) -> Dict[str, Any]:
    """Extract saturation and adstock parameters"""
    
    curves = {}
    for i, channel in enumerate(channels):
        # Get Hill transformation parameters
        saturation_params = model.get_saturation_params(channel)
        adstock_params = model.get_adstock_params(channel)
        
        curves[channel] = {
            "saturation": {
                "ec": float(saturation_params['ec']),  # Half saturation point
                "slope": float(saturation_params['slope']),
            },
            "adstock": {
                "decay": float(adstock_params['decay']),
                "peak": int(adstock_params['peak']),
            }
        }
    
    return curves

def run_optimization(model: Meridian, input_data: InputData) -> Dict[str, Any]:
    """Run budget optimization"""
    
    current_budget = input_data.media_costs.sum()
    
    # Optimize for same budget
    optimal_allocation = optimize_media_mix(
        model=model,
        budget=current_budget,
        objective='revenue',
        constraints=None
    )
    
    return {
        "current_budget": float(current_budget),
        "optimal_allocation": {
            ch: float(val) for ch, val in optimal_allocation.items()
        },
        "expected_lift": float(model.predict_lift(optimal_allocation))
    }

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({
            "error": "Usage: python train_meridian.py <data_file> <config_file> <output_file>"
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
