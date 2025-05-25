#!/usr/bin/env python3
"""
Simple mock training script for development
Generates basic MMM results without requiring external libraries
"""

import json
import sys
import time
import random
import os

def main(data_file: str, config_file: str, output_file: str):
    """Mock training function that simulates a real training process"""
    
    # Progress updates for UI
    print(json.dumps({"status": "loading_data", "progress": 10}))
    time.sleep(1)  # Simulate processing time
    
    # Load config
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
            print(json.dumps({"status": "config_loaded", "config": config}))
    except Exception as e:
        print(json.dumps({"error": f"Failed to load config: {str(e)}"}))
        config = {
            "date_column": "date",
            "target_column": "sales",
            "channel_columns": ["tv_spend", "radio_spend", "digital_spend", "print_spend"]
        }
    
    print(json.dumps({"status": "preparing_data", "progress": 20}))
    time.sleep(1)  # Simulate processing time

    # Extract channel names from config
    channel_columns = config.get("channel_columns", [])
    if not channel_columns:
        channel_columns = ["tv_spend", "radio_spend", "digital_spend", "print_spend"]
        
    print(json.dumps({"status": "training_model", "progress": 40}))
    time.sleep(2)  # Simulate longer training time
    
    print(json.dumps({"status": "extracting_results", "progress": 80}))
    time.sleep(1)  # Simulate processing time
    
    # Generate mock metrics
    r_squared = random.uniform(0.7, 0.95)
    mape = random.uniform(0.05, 0.15)
    
    # Generate mock channel results
    channel_analysis = {}
    for channel in channel_columns:
        contribution = random.uniform(100000, 1000000)
        roi = random.uniform(1.5, 4.5)
        channel_analysis[channel] = {
            "contribution": contribution,
            "contribution_percentage": random.uniform(0.1, 0.4),
            "roi": roi,
            "roi_lower": roi * 0.7,
            "roi_upper": roi * 1.3
        }
    
    # Generate mock response curves
    response_curves = {}
    for channel in channel_columns:
        response_curves[channel] = {
            "saturation": {
                "ec": random.uniform(2.0, 5.0),  # Larger EC values for better visualization
                "slope": random.uniform(1.8, 3.5)  # Steeper slopes for more pronounced curves
            },
            "adstock": {
                "decay": random.uniform(0.3, 0.8),  # Moderate decay rates
                "peak": random.randint(0, 3)  # Peak week
            }
        }
    
    # Generate mock optimization
    optimization = {
        "current_budget": sum(random.uniform(50000, 200000) for _ in channel_columns),
        "optimal_allocation": {
            channel: random.uniform(50000, 200000) for channel in channel_columns
        },
        "expected_lift": random.uniform(0.05, 0.25)
    }
    
    # Create final results
    results = {
        "model_type": "meridian_mock",
        "success": True,
        "metrics": {
            "r_squared": r_squared,
            "mape": mape
        },
        "channel_analysis": channel_analysis,
        "response_curves": response_curves,
        "optimization": optimization
    }
    
    # Save results
    try:
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(json.dumps({"status": "completed", "progress": 100}))
    except Exception as e:
        print(json.dumps({"error": f"Failed to save results: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({
            "error": "Usage: python simple_mock_train.py <data_file> <config_file> <output_file>"
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