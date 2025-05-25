#!/usr/bin/env python3
"""
Minimal test to verify Meridian installation
"""

print("Checking if Meridian is installed...")

try:
    import meridian
    print(f"✓ Meridian version {meridian.__version__} is installed successfully!")
    print("✓ Meridian is available for use in your project!")
except ImportError as e:
    print(f"✗ Error importing Meridian: {e}")
except Exception as e:
    print(f"✗ Unexpected error: {e}")