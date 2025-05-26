import sys
sys.stderr = open('/dev/null', 'w')  # Suppress TF warnings
import meridian
print("Meridian attributes:")
for attr in dir(meridian):
    if not attr.startswith('_'):
        print(f"  - {attr}")
