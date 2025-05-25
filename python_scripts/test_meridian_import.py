#!/usr/bin/env python3
import sys
import pkg_resources

print("Python Environment Test")
print("----------------------")
print(f"Python version: {sys.version}")

# Check installed packages
print("\nInstalled packages:")
installed_packages = [d for d in pkg_resources.working_set]
for package in sorted(installed_packages):
    print(f"- {package}")

# Check TensorFlow availability
print("\nTesting TensorFlow:")
try:
    import tensorflow as tf
    print(f"✓ TensorFlow {tf.__version__}")
    print(f"✓ Available devices: {tf.config.list_physical_devices()}")
    
    # Test simple tensor operation
    x = tf.constant([[1., 2.]])
    y = tf.constant([[3.], [4.]])
    z = tf.matmul(x, y)
    print(f"✓ TensorFlow computation test: {z.numpy()}")
    
except ImportError:
    print("✗ TensorFlow not installed")
except Exception as e:
    print(f"✗ TensorFlow error: {e}")

# Test numpy
print("\nTesting NumPy:")
try:
    import numpy as np
    print(f"✓ NumPy {np.__version__}")
    
    # Create test array
    arr = np.random.randn(5, 2)
    print(f"✓ NumPy test array:\n{arr}")
    
except ImportError:
    print("✗ NumPy not installed")
except Exception as e:
    print(f"✗ NumPy error: {e}")

print("\nEnvironment test complete")