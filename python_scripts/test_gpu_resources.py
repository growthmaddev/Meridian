#!/usr/bin/env python3
"""
Test GPU Resources for Meridian

This script checks available GPU resources and determines if they meet
the requirements for running Google's Meridian marketing mix model effectively.
"""

import os
import sys
import platform
import subprocess
import multiprocessing
import psutil
import json
from datetime import datetime

print("=" * 80)
print("REPLIT GPU RESOURCES ASSESSMENT FOR MERIDIAN")
print("=" * 80)
print(f"Assessment Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Python Version: {platform.python_version()}")
print(f"OS: {platform.system()} {platform.release()}")
print()

# ==========================================
# SECTION 1: Current Replit Resources
# ==========================================
print("\n" + "=" * 40)
print("CURRENT REPLIT RESOURCES")
print("=" * 40)

# Check CPU resources
cpu_count = multiprocessing.cpu_count()
print(f"CPU Cores: {cpu_count}")

# Check RAM
mem = psutil.virtual_memory()
total_ram_gb = mem.total / (1024 ** 3)
available_ram_gb = mem.available / (1024 ** 3)
print(f"Total RAM: {total_ram_gb:.2f} GB")
print(f"Available RAM: {available_ram_gb:.2f} GB ({(available_ram_gb/total_ram_gb)*100:.1f}%)")

# Check if running in Replit
is_replit = os.environ.get('REPL_ID') is not None
if is_replit:
    print(f"Running in Replit: Yes (ID: {os.environ.get('REPL_ID')})")
    
    # Try to detect if boosted
    try:
        is_boosted = False
        replit_metadata = {}
        
        # Check if Replit provides any metadata about resources/boost status
        for env_var in ['REPL_OWNER', 'REPL_SLUG', 'REPLIT_CLUSTER']:
            if os.environ.get(env_var):
                replit_metadata[env_var] = os.environ.get(env_var)
        
        # Additional check for boost-specific environment variables
        for env_var in os.environ:
            if 'BOOST' in env_var.upper() or 'POWER' in env_var.upper():
                is_boosted = True
                replit_metadata[env_var] = os.environ.get(env_var)
        
        # Heuristic: Boosted Repls typically have more RAM
        if total_ram_gb > 2.0:  # Basic Repls usually have 0.5-2GB RAM
            is_boosted = True
            
        print(f"Replit Boost Status: {'Boosted' if is_boosted else 'Standard'}")
        if replit_metadata:
            print("Replit Metadata:")
            for key, value in replit_metadata.items():
                print(f"  - {key}: {value}")
    except Exception as e:
        print(f"Error determining Replit boost status: {e}")
else:
    print("Running in Replit: No")

# ==========================================
# SECTION 2: GPU Detection for Meridian
# ==========================================
print("\n" + "=" * 40)
print("GPU DETECTION FOR MERIDIAN")
print("=" * 40)

# Initialize variables
has_gpu = False
gpu_info = {}
tf_gpu_available = False
cuda_version = None
cudnn_version = None

# Check if nvidia-smi is available
try:
    nvidia_smi = subprocess.check_output(['nvidia-smi'], 
                                          stderr=subprocess.STDOUT,
                                          universal_newlines=True)
    has_gpu = True
    print("NVIDIA GPU Detected (via nvidia-smi)")
    print("-" * 40)
    print(nvidia_smi.split('\n')[0].strip())  # Print GPU name
    
    # Parse nvidia-smi output for more details
    for line in nvidia_smi.split('\n'):
        if 'CUDA Version' in line:
            cuda_version = line.split('CUDA Version:')[1].strip()
            print(f"CUDA Version: {cuda_version}")
except (subprocess.SubprocessError, FileNotFoundError):
    print("No NVIDIA GPU detected via nvidia-smi")

# Try to get GPU information using TensorFlow
print("\nTesting TensorFlow GPU Support:")
print("-" * 40)
try:
    # Suppress TensorFlow warnings
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
    
    import tensorflow as tf
    print(f"TensorFlow Version: {tf.__version__}")
    
    # Check if TensorFlow can see GPUs
    gpus = tf.config.list_physical_devices('GPU')
    
    if gpus:
        tf_gpu_available = True
        print(f"TensorFlow GPU available: Yes ({len(gpus)} found)")
        
        # Get details about each GPU
        for i, gpu in enumerate(gpus):
            print(f"\nGPU #{i+1}:")
            gpu_details = tf.config.experimental.get_device_details(gpu)
            for key, value in gpu_details.items():
                if key != 'device_name':  # Already shown above
                    print(f"  {key}: {value}")
            
            # Try to allocate a small tensor on GPU to verify it works
            try:
                with tf.device(f'/device:GPU:{i}'):
                    a = tf.constant([[1.0, 2.0], [3.0, 4.0]])
                    b = tf.constant([[5.0, 6.0], [7.0, 8.0]])
                    c = tf.matmul(a, b)
                print(f"  Test tensor allocation: Success")
            except Exception as e:
                print(f"  Test tensor allocation: Failed ({str(e)})")
    else:
        print("TensorFlow GPU available: No")
        
    # Check for cuDNN
    if hasattr(tf.sysconfig, 'get_build_info'):
        build_info = tf.sysconfig.get_build_info()
        if 'cudnn_version' in build_info:
            cudnn_version = build_info['cudnn_version']
            print(f"cuDNN Version: {cudnn_version}")
    elif hasattr(tf, 'version'):
        if hasattr(tf.version, 'CUDNN'):
            cudnn_version = tf.version.CUDNN
            print(f"cuDNN Version: {cudnn_version}")
            
except ImportError:
    print("TensorFlow not installed - skipping TensorFlow GPU detection")
except Exception as e:
    print(f"Error during TensorFlow GPU detection: {str(e)}")

# ==========================================
# SECTION 3: Performance Estimates
# ==========================================
print("\n" + "=" * 40)
print("PERFORMANCE ESTIMATES FOR MERIDIAN")
print("=" * 40)

# Define performance estimates based on hardware
if tf_gpu_available:
    print("GPU is available for Meridian:")
    print("-" * 40)
    
    # Rough performance estimates based on GPU availability
    # These are educated guesses and would need adjustment based on actual testing
    print("Estimated MCMC Sampling Performance:")
    print("  - Small model (1-3 channels): 1-3 minutes")
    print("  - Medium model (4-7 channels): 3-10 minutes")
    print("  - Large model (8+ channels): 10-30 minutes")
    
    print("\nEstimated Prior/Posterior Analysis:")
    print("  - Small datasets (<1000 rows): 0.5-2 minutes")
    print("  - Medium datasets (1000-5000 rows): 2-8 minutes")
    print("  - Large datasets (5000+ rows): 8-20 minutes")
else:
    print("No GPU detected - CPU-only performance estimates:")
    print("-" * 40)
    
    # CPU performance will be much slower
    print("Estimated MCMC Sampling Performance (CPU-only):")
    print("  - Small model (1-3 channels): 5-15 minutes")
    print("  - Medium model (4-7 channels): 15-45 minutes")
    print("  - Large model (8+ channels): 45-120 minutes")
    
    print("\nEstimated Prior/Posterior Analysis (CPU-only):")
    print("  - Small datasets (<1000 rows): 2-8 minutes")
    print("  - Medium datasets (1000-5000 rows): 8-30 minutes")
    print("  - Large datasets (5000+ rows): 30-90 minutes")
    
    print("\nWARNING: CPU-only performance may be significantly slower and")
    print("may impact user experience with larger models or datasets.")

# ==========================================
# SECTION 4: Recommendations
# ==========================================
print("\n" + "=" * 40)
print("RECOMMENDATIONS")
print("=" * 40)

# Provide recommendations based on detected resources
if tf_gpu_available:
    print("✅ GPU resources are available for Meridian")
    print("Recommendations:")
    print("  - Proceed with GPU-accelerated Meridian implementation")
    print("  - Consider using tf.device('/GPU:0') in your TensorFlow code")
    print("  - Monitor GPU memory usage with nvidia-smi during model training")
elif has_gpu and not tf_gpu_available:
    print("⚠️ GPU detected but not available to TensorFlow")
    print("Recommendations:")
    print("  - Check CUDA and cuDNN compatibility with your TensorFlow version")
    print("  - Ensure TensorFlow is installed with GPU support")
    print("  - Check for any GPU memory allocations from other processes")
else:
    print("❌ No GPU resources detected for Meridian")
    print("Recommendations:")
    print("  - Consider upgrading to a GPU-enabled Replit plan")
    print("  - For Meridian, recommended minimum specs:")
    print("    * NVIDIA GPU with at least 4GB VRAM")
    print("    * CUDA 11.2+ and cuDNN 8.1+")
    print("    * 8GB+ system RAM")
    print("  - For CPU-only usage, limit to small models and datasets")
    print("  - Consider simplifying your models to reduce computational load")

# Create a JSON output for the UI component to read
results = {
    "timestamp": datetime.now().isoformat(),
    "cpu_count": cpu_count,
    "total_ram_gb": round(total_ram_gb, 2),
    "available_ram_gb": round(available_ram_gb, 2),
    "has_gpu": has_gpu,
    "tf_gpu_available": tf_gpu_available,
    "cuda_version": cuda_version,
    "cudnn_version": cudnn_version,
    "is_replit": is_replit,
    "suitable_for_meridian": tf_gpu_available,
    "status": "gpu_ready" if tf_gpu_available else ("gpu_detected" if has_gpu else "cpu_only")
}

# Save results to a file
try:
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'gpu_assessment.json'), 'w') as f:
        json.dump(results, f, indent=2)
    print("\nAssessment results saved to gpu_assessment.json")
except Exception as e:
    print(f"\nFailed to save assessment results: {e}")

print("\n" + "=" * 80)
print("ASSESSMENT COMPLETE")
print("=" * 80)