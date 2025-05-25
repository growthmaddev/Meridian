#!/usr/bin/env python3
"""
Simple test to verify Meridian installation
"""

print("Testing Meridian installation...")

try:
    from meridian import model
    from meridian import load  
    from meridian import spec
    from meridian import prior_distribution
    print("✓ Meridian core modules imported successfully!")
    
    # Just create a simple model spec to verify basic functionality
    test_spec = spec.ModelSpec()
    print("✓ Successfully created a ModelSpec object")
    
    print("\nMeridian is installed and ready for use!")
    
except Exception as e:
    print(f"✗ Error: {e}")