#!/usr/bin/env python3
"""
Explore Meridian Analyzer API to find correct method names
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TF warnings

try:
    from meridian.analysis.analyzer import Analyzer
    from meridian.model.model import Meridian
    
    print("=== Meridian Analyzer API Explorer ===\n")
    
    # List all methods and attributes
    print("Available Analyzer methods:")
    print("-" * 40)
    
    # Get all attributes that don't start with underscore
    methods = [attr for attr in dir(Analyzer) if not attr.startswith('_')]
    
    # Group by category
    roi_methods = [m for m in methods if 'roi' in m.lower()]
    control_methods = [m for m in methods if 'control' in m.lower() or 'coef' in m.lower()]
    curve_methods = [m for m in methods if 'curve' in m.lower() or 'saturation' in m.lower() or 'hill' in m.lower()]
    convergence_methods = [m for m in methods if 'rhat' in m.lower() or 'converg' in m.lower() or 'diagnostic' in m.lower()]
    posterior_methods = [m for m in methods if 'posterior' in m.lower() or 'trace' in m.lower()]
    
    print("\nROI/Attribution methods:")
    for m in roi_methods:
        print(f"  - {m}")
        
    print("\nControl/Coefficient methods:")
    for m in control_methods:
        print(f"  - {m}")
        
    print("\nCurve/Saturation methods:")
    for m in curve_methods:
        print(f"  - {m}")
        
    print("\nConvergence/Diagnostic methods:")
    for m in convergence_methods:
        print(f"  - {m}")
        
    print("\nPosterior/Trace methods:")
    for m in posterior_methods:
        print(f"  - {m}")
    
    print("\nAll other methods:")
    other_methods = [m for m in methods if m not in roi_methods + control_methods + curve_methods + convergence_methods + posterior_methods]
    for m in sorted(other_methods):
        print(f"  - {m}")
        
    # Try to get method signatures for key methods
    print("\n\nMethod Signatures:")
    print("-" * 40)
    
    for method_name in ['roi', 'incremental_outcome', 'adstock_decay']:
        try:
            method = getattr(Analyzer, method_name)
            if hasattr(method, '__doc__') and method.__doc__:
                print(f"\n{method_name}():")
                print(f"  {method.__doc__.strip().split('.')[0]}")
        except:
            pass
            
except Exception as e:
    print(f"Error: {e}")

print("\n\nTo run: python python_scripts/meridian_api_explorer.py")