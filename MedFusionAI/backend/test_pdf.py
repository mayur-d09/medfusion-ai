import sys

libraries = ['pypdf', 'pdfplumber', 'fitz', 'pdfminer', 'reportlab']
for lib in libraries:
    try:
        __import__(lib)
        print(f"{lib} is installed")
    except ImportError:
        print(f"{lib} is NOT installed")
