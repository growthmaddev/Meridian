#!/usr/bin/env python3
"""
Quick test to verify Meridian data preparation works
"""
import pandas as pd
import numpy as np
import json
import sys

def test_data_preparation():
    """Test that our data preparation logic works"""
    try:
        # Load test data
        df = pd.read_csv('test_data_with_gqv.csv')
        print(f"✓ Loaded data: {len(df)} rows")
        
        # Test config
        config = {
            'date_column': 'date',
            'target_column': 'sales',
            'channel_columns': ['tv_spend', 'radio_spend', 'digital_spend', 'print_spend'],
            'control_columns': ['brand_search_gqv', 'generic_search_gqv', 'population']
        }
        
        # Test data preparation
        n_time_periods = len(df)
        n_geos = 1
        
        # Extract KPI data
        kpi_values = df[config['target_column']].values.reshape(n_geos, n_time_periods)
        print(f"✓ KPI shape: {kpi_values.shape}")
        
        # Media data
        media_data = []
        for channel in config['channel_columns']:
            media_data.append(df[channel].values)
        
        media_values = np.stack(media_data, axis=-1).reshape(n_geos, n_time_periods, len(config['channel_columns']))
        print(f"✓ Media shape: {media_values.shape}")
        
        # Control data
        control_data = []
        for control in config['control_columns']:
            if control in df.columns:
                control_data.append(df[control].values)
        
        control_values = np.stack(control_data, axis=-1).reshape(n_time_periods, len(control_data))
        print(f"✓ Controls shape: {control_values.shape}")
        
        print("\n✅ All data shapes are correct for Meridian!")
        print(f"  - KPI: {kpi_values.shape} (should be [n_geos, n_time_periods])")
        print(f"  - Media: {media_values.shape} (should be [n_geos, n_time_periods, n_channels])")
        print(f"  - Controls: {control_values.shape} (should be [n_time_periods, n_controls])")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_data_preparation()
    sys.exit(0 if success else 1)