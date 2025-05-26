#!/usr/bin/env python3
"""
Minimal API check - just look at what's available without any TF imports
"""

import sys
import os

# Completely disable TensorFlow output
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

print("=== Minimal Meridian Check ===")

try:
    # Check what's in the meridian package without importing TF-heavy modules
    import pkgutil
    import meridian
    
    print("Meridian package contents:")
    for importer, modname, ispkg in pkgutil.iter_modules(meridian.__path__, meridian.__name__ + "."):
        print(f"  - {modname}")
    
    # Try to import just the module definitions without instantiation
    print("\nChecking model module...")
    try:
        from meridian.model.model import Meridian
        print("✓ Meridian class imported")
        
        # Get method names without calling anything
        methods = [name for name in dir(Meridian) if not name.startswith('_')]
        training_methods = [m for m in methods if any(word in m.lower() for word in ['sample', 'fit', 'train', 'posterior'])]
        
        print("Training-related methods found:")
        for method in training_methods:
            print(f"  - {method}")
            
    except Exception as e:
        print(f"Model import failed: {e}")
    
    print("\nChecking analyzer module...")
    try:
        from meridian.analysis.analyzer import Analyzer
        print("✓ Analyzer class imported")
        
        methods = [name for name in dir(Analyzer) if not name.startswith('_')]
        result_methods = [m for m in methods if any(word in m.lower() for word in ['get', 'roi', 'metric', 'posterior'])]
        
        print("Result extraction methods found:")
        for method in result_methods:
            print(f"  - {method}")
            
    except Exception as e:
        print(f"Analyzer import failed: {e}")
        
        # Try alternative import paths
        try:
            from meridian import analyzer
            print("✓ Found analyzer module")
            if hasattr(analyzer, 'Analyzer'):
                print("✓ Analyzer class exists")
                methods = [name for name in dir(analyzer.Analyzer) if not name.startswith('_')]
                result_methods = [m for m in methods if any(word in m.lower() for word in ['get', 'roi', 'metric', 'posterior'])]
                print("Result methods:")
                for method in result_methods:
                    print(f"  - {method}")
        except Exception as e2:
            print(f"Alternative analyzer import also failed: {e2}")
    
except Exception as e:
    print(f"Failed to inspect meridian: {e}")

print("\n=== Based on what we know ===")
print("The correct API should be:")
print("1. model.sample_posterior() instead of model.fit()")
print("2. analyzer.Analyzer(model) for results")
print("3. This explains why our current code fails!")