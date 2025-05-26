#!/usr/bin/env python3
"""
Lightweight Meridian API discovery - avoids heavy TensorFlow operations
"""

import sys
import importlib
import inspect

print("=== Meridian API Discovery (Lightweight) ===\n")

# Step 1: Import without initializing
print("1. Checking Meridian imports...")
try:
    # These imports should be fast
    import meridian
    from meridian import model
    from meridian import data  
    from meridian import analyzer
    from meridian import optimizer
    print("✓ Base imports successful")
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)

# Step 2: Discover model methods without creating instance
print("\n2. Discovering Meridian model methods...")
try:
    # Get the Meridian class without instantiating
    MeridianClass = model.Meridian
    
    print("Public methods on Meridian class:")
    for name, method in inspect.getmembers(MeridianClass, predicate=inspect.isfunction):
        if not name.startswith('_'):
            # Get method signature
            try:
                sig = inspect.signature(method)
                print(f"  - {name}{sig}")
            except:
                print(f"  - {name}()")
    
    # Look specifically for sampling/training methods
    print("\nMethods containing 'sample', 'fit', or 'train':")
    for name in dir(MeridianClass):
        if any(keyword in name.lower() for keyword in ['sample', 'fit', 'train', 'run', 'posterior']):
            print(f"  - {name}")
            
except Exception as e:
    print(f"✗ Error inspecting model: {e}")

# Step 3: Discover analyzer methods
print("\n3. Discovering analyzer methods...")
try:
    if hasattr(analyzer, 'Analyzer'):
        AnalyzerClass = analyzer.Analyzer
        print("Public methods on Analyzer class:")
        for name, method in inspect.getmembers(AnalyzerClass, predicate=inspect.isfunction):
            if not name.startswith('_'):
                print(f"  - {name}")
                
        # Look for result extraction methods
        print("\nMethods containing 'get', 'extract', or 'compute':")
        for name in dir(AnalyzerClass):
            if any(keyword in name.lower() for keyword in ['get', 'extract', 'compute', 'roi', 'metric']):
                print(f"  - {name}")
    else:
        print("✗ analyzer.Analyzer not found")
except Exception as e:
    print(f"✗ Error inspecting analyzer: {e}")

# Step 4: Discover optimizer structure
print("\n4. Discovering optimizer module...")
try:
    print("Contents of optimizer module:")
    for name in dir(optimizer):
        if not name.startswith('_'):
            obj = getattr(optimizer, name)
            print(f"  - {name}: {type(obj).__name__}")
            
    # Check for BudgetOptimizer
    if hasattr(optimizer, 'BudgetOptimizer'):
        print("\n✓ BudgetOptimizer found!")
        BOClass = optimizer.BudgetOptimizer
        print("BudgetOptimizer methods:")
        for name in dir(BOClass):
            if not name.startswith('_') and not name.isupper():
                print(f"    - {name}")
except Exception as e:
    print(f"✗ Error inspecting optimizer: {e}")

# Step 5: Check data module for InputData
print("\n5. Checking InputData structure...")
try:
    if hasattr(data, 'InputData'):
        print("✓ InputData found")
        # Show init signature
        init_sig = inspect.signature(data.InputData.__init__)
        print(f"  InputData.__init__{init_sig}")
    else:
        print("✗ InputData not found in data module")
except Exception as e:
    print(f"✗ Error inspecting InputData: {e}")

# Step 6: Look for example usage in docstrings
print("\n6. Checking for usage examples in docstrings...")
try:
    if hasattr(model.Meridian, '__doc__') and model.Meridian.__doc__:
        print("Meridian class docstring:")
        print(model.Meridian.__doc__[:500] + "..." if len(model.Meridian.__doc__) > 500 else model.Meridian.__doc__)
        
    # Check for sample_posterior docstring
    if hasattr(model.Meridian, 'sample_posterior'):
        if hasattr(model.Meridian.sample_posterior, '__doc__') and model.Meridian.sample_posterior.__doc__:
            print("\nsample_posterior docstring:")
            print(model.Meridian.sample_posterior.__doc__[:300] + "...")
except Exception as e:
    print(f"✗ Error reading docstrings: {e}")

print("\n=== Discovery Complete ===")
print("\nNext steps:")
print("1. If sample_posterior exists, that's the training method")
print("2. Use analyzer.Analyzer for results extraction")
print("3. Avoid instantiating models in Replit due to TF overhead")
print("4. Consider running actual training outside Replit")