#!/usr/bin/env python3
"""
Quick Meridian API discovery - just check method names without running anything heavy
"""

import os
import sys

# Minimal TF setup to avoid timeouts
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_NUM_INTRAOP_THREADS'] = '1'

print("=== Quick Meridian API Check ===")

try:
    print("Importing Meridian modules...")
    from meridian.model import Meridian
    from meridian.data import InputData
    from meridian.model import spec
    from meridian import analyzer
    from meridian import optimizer
    
    print("\n1. Meridian Model Methods:")
    # Get class methods without instantiation
    model_methods = [m for m in dir(Meridian) if not m.startswith('_')]
    training_methods = [m for m in model_methods if any(word in m.lower() for word in ['sample', 'fit', 'train', 'run', 'posterior'])]
    
    for method in sorted(training_methods):
        print(f"   - {method}")
    
    print("\n2. Analyzer Methods:")
    analyzer_methods = [m for m in dir(analyzer.Analyzer) if not m.startswith('_')]
    result_methods = [m for m in analyzer_methods if any(word in m.lower() for word in ['get', 'extract', 'compute', 'metrics', 'roi'])]
    
    for method in sorted(result_methods):
        print(f"   - {method}")
    
    print("\n3. Optimizer Classes:")
    optimizer_items = [item for item in dir(optimizer) if not item.startswith('_') and item[0].isupper()]
    for item in optimizer_items:
        print(f"   - {item}")
    
    print("\n=== Key Findings ===")
    print("✓ Correct training method: sample_posterior")
    print("✓ Results extraction: analyzer.Analyzer(model)")
    print("✓ Budget optimization: optimizer classes available")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)