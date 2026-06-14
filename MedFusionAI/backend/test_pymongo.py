import sys

try:
    import pymongo
    print("pymongo is installed")
except ImportError:
    print("pymongo is NOT installed", file=sys.stderr)
