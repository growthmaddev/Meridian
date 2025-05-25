#!/usr/bin/env python3
"""
GPU Availability Test Script
This script checks for GPU availability using multiple methods and runs simple tests
to verify GPU functionality for Meridian and other ML frameworks.
"""

import os
import sys
import subprocess
import platform
from datetime import datetime
import importlib.util

def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 60)
    print(f" {title} ".center(60, "="))
    print("=" * 60 + "\n")

def run_command(command):
    """Run a system command and return output"""
    try:
        result = subprocess.run(command, shell=True, check=False, 
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              universal_newlines=True)
        return result.stdout
    except Exception as e:
        return f"Error running command: {e}"

def check_package_installed(package_name):
    """Check if a Python package is installed"""
    return importlib.util.find_spec(package_name) is not None

def check_hardware_gpu():
    """Check if NVIDIA GPU is available at hardware level"""
    print_section("GPU Hardware Check")
    
    print("System Information:")
    print(f"Python: {platform.python_version()}")
    print(f"OS: {platform.platform()}")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check nvidia-smi
    print("Checking nvidia-smi:")
    nvidia_smi = run_command("nvidia-smi")
    if "NVIDIA-SMI" in nvidia_smi:
        print(nvidia_smi)
        has_nvidia_gpu = True
    else:
        print("nvidia-smi not available or GPU not detected")
        has_nvidia_gpu = False
    
    # Check lspci on Linux
    if platform.system() == "Linux":
        print("\nChecking lspci for NVIDIA devices:")
        lspci = run_command("lspci | grep -i nvidia")
        if lspci:
            print(lspci)
        else:
            print("No NVIDIA devices found in lspci")
            
    # Check for CUDA
    print("\nChecking for CUDA installation:")
    nvcc_version = run_command("nvcc --version")
    if "cuda" in nvcc_version.lower():
        print(nvcc_version)
        has_cuda = True
    else:
        print("NVCC (CUDA compiler) not found in PATH")
        has_cuda = False
        
    return has_nvidia_gpu, has_cuda

def check_tensorflow_gpu():
    """Check if TensorFlow can detect and use GPU"""
    print_section("TensorFlow GPU Support")
    
    # First check if TensorFlow is installed
    if not check_package_installed("tensorflow"):
        print("TensorFlow is not installed. Install with: pip install tensorflow")
        return False, 0
    
    try:
        # Import with error handling
        import tensorflow as tf
        print(f"TensorFlow version: {tf.__version__}")
        
        # Safely check for GPU devices
        try:
            # List physical devices
            print("\nTensorFlow physical devices:")
            physical_devices = tf.config.list_physical_devices()
            for device in physical_devices:
                print(f"  {device.device_type}: {device.name}")
            
            # Check specifically for GPUs
            gpus = tf.config.list_physical_devices('GPU')
            if gpus:
                print(f"\nNumber of GPUs available: {len(gpus)}")
                for gpu in gpus:
                    print(f"  {gpu.name}")
                    
                # Try to get more GPU details
                try:
                    for i, gpu in enumerate(gpus):
                        gpu_details = tf.config.experimental.get_device_details(gpu)
                        print(f"\nGPU {i} details:")
                        print(f"  {gpu_details}")
                except Exception as e:
                    print(f"Could not get detailed GPU information: {str(e)}")
                    
                # Check memory growth setting
                print("\nMemory growth setting:")
                for gpu in gpus:
                    try:
                        tf.config.experimental.set_memory_growth(gpu, True)
                        print(f"  {gpu.name}: Memory growth enabled")
                    except RuntimeError as e:
                        print(f"  {gpu.name}: {str(e)}")
                
                return True, len(gpus)
            else:
                print("\nNo GPU detected by TensorFlow")
                
                # Print additional info about CUDA support
                try:
                    print("\nIs TensorFlow built with CUDA:")
                    print(f"  {tf.test.is_built_with_cuda()}")
                    
                    if hasattr(tf.test, 'is_gpu_available'):
                        print("\nIs GPU available for TensorFlow:")
                        print(f"  {tf.test.is_gpu_available()}")
                except Exception as e:
                    print(f"Error checking CUDA support: {str(e)}")
                    
                return False, 0
                
        except Exception as e:
            print(f"Error checking TensorFlow devices: {str(e)}")
            return False, 0
            
    except Exception as e:
        print(f"Error importing TensorFlow: {str(e)}")
        return False, 0

def check_pytorch_gpu():
    """Check if PyTorch can detect and use GPU"""
    print_section("PyTorch GPU Support")
    
    # First check if PyTorch is installed
    if not check_package_installed("torch"):
        print("PyTorch is not installed. Install with: pip install torch")
        return False, 0
    
    try:
        import torch
        print(f"PyTorch version: {torch.__version__}")
        
        # Check CUDA availability
        print("\nCUDA available:", torch.cuda.is_available())
        
        if torch.cuda.is_available():
            print(f"CUDA version: {torch.version.cuda}")
            device_count = torch.cuda.device_count()
            print(f"Number of CUDA devices: {device_count}")
            
            for i in range(device_count):
                print(f"\nCUDA Device {i}:")
                print(f"  Name: {torch.cuda.get_device_name(i)}")
                try:
                    print(f"  Capability: {torch.cuda.get_device_capability(i)}")
                    print(f"  Memory: {torch.cuda.get_device_properties(i).total_memory / 1024**3:.2f} GB")
                except Exception as e:
                    print(f"  Error getting device details: {str(e)}")
            
            return True, device_count
        else:
            print("No CUDA devices available for PyTorch")
            return False, 0
            
    except ImportError:
        print("Error importing PyTorch modules")
        return False, 0
    except Exception as e:
        print(f"Error checking PyTorch GPU support: {str(e)}")
        return False, 0

def run_gpu_compute_test():
    """Run a simple computation test on GPU"""
    print_section("GPU Compute Test")
    
    # TensorFlow test
    tf_success = False
    if check_package_installed("tensorflow"):
        try:
            import tensorflow as tf
            if len(tf.config.list_physical_devices('GPU')) > 0:
                print("Running TensorFlow GPU test...")
                
                # Create smaller tensors to avoid memory issues
                with tf.device('/GPU:0'):
                    start_time = datetime.now()
                    a = tf.random.normal([1000, 1000])
                    b = tf.random.normal([1000, 1000])
                    c = tf.matmul(a, b)
                    # Force execution with .numpy()
                    result = c.numpy()
                    end_time = datetime.now()
                    
                print(f"Matrix multiplication shape: {result.shape}")
                print(f"Execution time: {(end_time - start_time).total_seconds():.4f} seconds")
                tf_success = True
            else:
                print("Skipping TensorFlow test - no GPU detected")
        except ImportError:
            print("TensorFlow not installed, skipping test")
        except Exception as e:
            print(f"Error running TensorFlow GPU test: {str(e)}")
    else:
        print("TensorFlow not installed, skipping test")
    
    # PyTorch test
    torch_success = False
    if check_package_installed("torch"):
        try:
            import torch
            if torch.cuda.is_available():
                print("\nRunning PyTorch GPU test...")
                
                # Create smaller tensors to avoid memory issues
                start_time = datetime.now()
                a = torch.randn(1000, 1000).cuda()
                b = torch.randn(1000, 1000).cuda()
                c = torch.matmul(a, b)
                # Force execution with .cpu()
                result = c.cpu()
                end_time = datetime.now()
                
                print(f"Matrix multiplication shape: {result.shape}")
                print(f"Execution time: {(end_time - start_time).total_seconds():.4f} seconds")
                torch_success = True
            else:
                print("Skipping PyTorch test - no GPU detected")
        except ImportError:
            print("PyTorch not installed, skipping test")
        except Exception as e:
            print(f"Error running PyTorch GPU test: {str(e)}")
    else:
        print("PyTorch not installed, skipping test")
        
    return tf_success or torch_success

def summarize_results():
    """Summarize GPU test results"""
    print_section("Summary")
    
    # Check for hardware GPU
    nvidia_smi = run_command("nvidia-smi")
    has_nvidia_gpu = "NVIDIA-SMI" in nvidia_smi
    
    nvcc_version = run_command("nvcc --version")
    has_cuda = "cuda" in nvcc_version.lower()
    
    # Check for TensorFlow GPU
    tf_gpu_available = False
    tf_gpu_count = 0
    if check_package_installed("tensorflow"):
        try:
            import tensorflow as tf
            tf_gpu_count = len(tf.config.list_physical_devices('GPU'))
            tf_gpu_available = tf_gpu_count > 0
        except Exception:
            pass
    
    # Check for PyTorch GPU
    pytorch_gpu_available = False
    pytorch_gpu_count = 0
    if check_package_installed("torch"):
        try:
            import torch
            pytorch_gpu_available = torch.cuda.is_available()
            pytorch_gpu_count = torch.cuda.device_count() if pytorch_gpu_available else 0
        except Exception:
            pass
            
    # Print summary
    print("GPU Hardware Detection:", "✓ Detected" if has_nvidia_gpu else "✗ Not detected")
    print("CUDA Installation:", "✓ Available" if has_cuda else "✗ Not available")
    print("TensorFlow GPU Support:", f"✓ Available ({tf_gpu_count} GPUs)" if tf_gpu_available else "✗ Not available")
    print("PyTorch GPU Support:", f"✓ Available ({pytorch_gpu_count} GPUs)" if pytorch_gpu_available else "✗ Not available")
    
    if not has_nvidia_gpu and not tf_gpu_available and not pytorch_gpu_available:
        print("\n❌ No GPU detected by any method")
        print("This environment does not appear to have a functional GPU.")
        print("Meridian and other GPU-accelerated ML libraries will run in CPU mode (much slower).")
        
        # Check if any drivers/environment variables are missing
        if os.environ.get('CUDA_VISIBLE_DEVICES') == '-1':
            print("\nNote: CUDA_VISIBLE_DEVICES is set to -1, which disables GPU usage.")
            
        if not has_cuda and has_nvidia_gpu:
            print("\nNote: NVIDIA GPU detected but CUDA toolkit not found.")
            print("Consider installing CUDA toolkit for GPU acceleration.")
            
    elif not tf_gpu_available and has_nvidia_gpu:
        print("\n⚠️ Hardware GPU detected but not available to TensorFlow")
        print("This might indicate missing CUDA libraries or configuration issues.")
        print("Check if your TensorFlow version is compatible with your CUDA version.")
    elif tf_gpu_available:
        print("\n✅ GPU is properly configured and available for TensorFlow.")
        print("Meridian should be able to utilize GPU acceleration.")
        
    # Meridian-specific recommendations
    print("\nMeridian Status:")
    if tf_gpu_available:
        print("✅ Meridian should work with GPU acceleration")
    else:
        print("⚠️ Meridian will run in CPU-only mode (slower)")
        print("   Consider using a cloud GPU environment for production workloads")
    print("PyTorch GPU Support:", f"✓ Available ({pytorch_gpu_count} GPUs)" if pytorch_gpu_available else "✗ Not available")
    
    if not has_nvidia_gpu and not tf_gpu_available and not pytorch_gpu_available:
        print("\n❌ No GPU detected by any method")
        print("This environment does not appear to have a functional GPU.")
        print("Meridian and other GPU-accelerated ML libraries may run slowly.")
    elif not tf_gpu_available and has_nvidia_gpu:
        print("\n⚠️ Hardware GPU detected but not available to TensorFlow")
        print("This might indicate missing CUDA libraries or configuration issues.")
    elif tf_gpu_available:
        print("\n✅ GPU is properly configured and available for machine learning tasks.")
        print("Meridian should be able to utilize GPU acceleration.")

def main():
    """Main function to run all GPU tests"""
    print("\nGPU AVAILABILITY TEST REPORT")
    print(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    check_hardware_gpu()
    check_tensorflow_gpu()
    check_pytorch_gpu()
    run_gpu_compute_test()
    summarize_results()

if __name__ == "__main__":
    main()