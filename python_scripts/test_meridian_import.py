#!/usr/bin/env python3
import sys
print("Testing Meridian installation...")

try:
    from meridian import model
    from meridian import load  
    from meridian import spec
    from meridian import prior_distribution
    print("✓ Meridian core modules imported")
    
    import tensorflow as tf
    print(f"✓ TensorFlow {tf.__version__} (CPU mode)")
    print(f"✓ Available CPUs: {len(tf.config.list_physical_devices('CPU'))}")
    
    # Test creating a simple model spec
    test_spec = spec.ModelSpec()
    print("✓ Can create ModelSpec")
    
    print("\nMeridian is ready for CPU-based training!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)