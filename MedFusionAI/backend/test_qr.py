import sys

libraries = ['cv2', 'pyzbar', 'qrtools', 'zbar']
for lib in libraries:
    try:
        __import__(lib)
        print(f"{lib} is installed")
    except ImportError:
        print(f"{lib} is NOT installed")
