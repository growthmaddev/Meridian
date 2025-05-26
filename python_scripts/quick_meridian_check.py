#!/usr/bin/env python3
"""Quick check of Meridian module structure without full TensorFlow initialization"""

import sys
import importlib.util

try:
    # Quick check if meridian module exists
    spec = importlib.util.find_spec('meridian')
    if spec is None:
        print("✗ Meridian module not found")
        sys.exit(1)
    
    print("✓ Meridian module found")
    
    # Try to import without initializing TensorFlow
    import meridian
    print("✓ Meridian imported successfully")
    
    # Check available attributes
    attrs = [attr for attr in dir(meridian) if not attr.startswith('_')]
    print(f"Available attributes: {attrs}")
    
    # Try common import patterns
    import_patterns = [
        'from meridian import model',
        'from meridian import spec', 
        'from meridian import InputData',
        'from meridian import Meridian',
        'from meridian.model import Model',
        'from meridian.model import ModelSpec'
    ]
    
    for pattern in import_patterns:
        try:
            exec(pattern)
            print(f"✓ {pattern}")
        except Exception as e:
            print(f"✗ {pattern} - {str(e)}")

except Exception as e:
    print(f"✗ Error checking Meridian: {e}")
    sys.exit(1)