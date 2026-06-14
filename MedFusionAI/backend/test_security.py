import sys

packages = ['jwt', 'jose', 'passlib', 'bcrypt']
for pkg in packages:
    try:
        __import__(pkg)
        print(f"{pkg} is installed")
    except ImportError:
        print(f"{pkg} is NOT installed")
