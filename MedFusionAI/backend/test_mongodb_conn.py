from pymongo import MongoClient
import sys

try:
    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
    client.server_info() # trigger connection
    print("MongoDB is running on localhost:27017!")
except Exception as e:
    print("MongoDB is NOT running on localhost:27017:", e, file=sys.stderr)
    sys.exit(1)
