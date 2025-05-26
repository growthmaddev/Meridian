#!/usr/bin/env python3
"""
Quick Meridian API discovery without TensorFlow loading
"""

import inspect
import sys

try:
    # Try to just inspect the module without instantiation
    import meridian.analysis.analyzer as analyzer_module
    
    print("=== Quick Meridian Analyzer API Discovery ===\n")
    
    # Get the Analyzer class
    Analyzer = analyzer_module.Analyzer
    
    # Get all public methods
    methods = [name for name in dir(Analyzer) if not name.startswith('_')]
    
    print(f"Found {len(methods)} public methods:\n")
    
    # Group methods by likely function
    categories = {
        'ROI & Attribution': [],
        'Control Variables': [],
        'Saturation & Curves': [],
        'Posterior & Sampling': [],
        'Diagnostics': [],
        'Other': []
    }
    
    for method in methods:
        method_lower = method.lower()
        if any(word in method_lower for word in ['roi', 'attribution', 'incremental']):
            categories['ROI & Attribution'].append(method)
        elif any(word in method_lower for word in ['control', 'coef', 'coefficient']):
            categories['Control Variables'].append(method)
        elif any(word in method_lower for word in ['saturation', 'curve', 'hill', 'adstock', 'decay']):
            categories['Saturation & Curves'].append(method)
        elif any(word in method_lower for word in ['posterior', 'sample', 'trace', 'chain']):
            categories['Posterior & Sampling'].append(method)
        elif any(word in method_lower for word in ['rhat', 'diagnostic', 'convergence', 'effective']):
            categories['Diagnostics'].append(method)
        else:
            categories['Other'].append(method)
    
    # Print categorized methods
    for category, method_list in categories.items():
        if method_list:
            print(f"{category}:")
            for method in sorted(method_list):
                print(f"  - {method}")
            print()
    
    # Try to get method signatures for key methods
    print("\nKey Method Signatures:")
    print("-" * 30)
    
    key_methods = ['roi', 'incremental_outcome', 'control_coefficients', 'saturation_parameters']
    
    for method_name in key_methods:
        try:
            if hasattr(Analyzer, method_name):
                method = getattr(Analyzer, method_name)
                sig = inspect.signature(method)
                print(f"{method_name}{sig}")
                
                # Try to get docstring
                if method.__doc__:
                    doc_first_line = method.__doc__.strip().split('\n')[0]
                    print(f"  → {doc_first_line}")
                print()
        except Exception as e:
            print(f"{method_name}: Error getting signature - {e}")
    
    print("✅ API discovery complete!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")