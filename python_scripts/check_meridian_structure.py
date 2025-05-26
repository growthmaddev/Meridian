#!/usr/bin/env python3
import sys

try:
    import meridian
    print("✓ Meridian imported successfully")
    print("Meridian attributes:", dir(meridian))
    
    # Try different import patterns
    try:
        from meridian.model import ModelSpec
        print("✓ Found ModelSpec in meridian.model")
    except Exception as e:
        print(f"✗ ModelSpec in meridian.model: {e}")
        
    try:
        from meridian import model_spec
        print("✓ Found model_spec in meridian")
    except Exception as e:
        print(f"✗ model_spec in meridian: {e}")
        
    try:
        from meridian.model import Model
        print("✓ Found Model in meridian.model")
    except Exception as e:
        print(f"✗ Model in meridian.model: {e}")
        
    try:
        from meridian import spec
        print("✓ Found spec in meridian")
        print("Spec attributes:", dir(meridian.spec))
    except Exception as e:
        print(f"✗ spec in meridian: {e}")

except Exception as e:
    print(f"✗ Cannot import meridian: {e}")
    sys.exit(1)