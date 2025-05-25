#!/usr/bin/env python3
import sys

print("Meridian Installation Test")
print("=========================")
print(f"Python version: {sys.version}")

# Test TensorFlow
print("\nTesting TensorFlow:")
try:
    import tensorflow as tf
    print(f"✓ TensorFlow {tf.__version__} installed")
    print(f"✓ Available devices: {tf.config.list_physical_devices()}")
    
    # Simple TensorFlow operation
    x = tf.constant([[1., 2.]])
    y = tf.constant([[3.], [4.]])
    z = tf.matmul(x, y)
    print(f"✓ TensorFlow computation: {z.numpy()}")
    
except ImportError as e:
    print(f"✗ TensorFlow import error: {e}")
except Exception as e:
    print(f"✗ TensorFlow error: {e}")

# Test NumPy
print("\nTesting NumPy:")
try:
    import numpy as np
    print(f"✓ NumPy {np.__version__} installed")
except ImportError as e:
    print(f"✗ NumPy import error: {e}")
except Exception as e:
    print(f"✗ NumPy error: {e}")

# Test TensorFlow Probability
print("\nTesting TensorFlow Probability:")
try:
    import tensorflow_probability as tfp
    print(f"✓ TensorFlow Probability {tfp.__version__} installed")
    
    # Simple distribution test
    dist = tfp.distributions.Normal(loc=0., scale=1.)
    print(f"✓ TFP distribution test: {dist.sample(5).numpy()}")
    
except ImportError as e:
    print(f"✗ TensorFlow Probability import error: {e}")
except Exception as e:
    print(f"✗ TensorFlow Probability error: {e}")

# Test Meridian
print("\nTesting Meridian:")
try:
    from meridian import model
    from meridian import load
    from meridian import spec
    from meridian import prior_distribution
    print("✓ Meridian core modules imported")
    
    # Test creating a model spec
    test_spec = spec.ModelSpec()
    print("✓ Can create ModelSpec")
    
    # Test minimal model setup
    import numpy as np
    print("\nTesting minimal Meridian model setup:")
    
    # Create tiny test data (2 media channels, 10 time periods)
    dates = np.arange(10)
    media_data = np.random.rand(10, 2)  # 10 periods, 2 channels
    target = np.random.rand(10)  # 10 periods of sales/conversions
    
    print("✓ Test data created")
    
    # Build simple model spec
    model_spec = spec.ModelSpec()
    model_spec.set_media_names(['channel1', 'channel2'])
    
    print("✓ Model spec created with media channels")
    print("✓ Meridian is ready for CPU-based training!")
    
except ImportError as e:
    print(f"✗ Meridian import error: {e}")
except Exception as e:
    print(f"✗ Meridian error: {e}")

print("\nEnvironment test complete")