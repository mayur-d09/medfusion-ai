import google.generativeai as genai
import sys

GOOGLE_API_KEY = "AIzaSyDVy7c_BVzi2C34ICsVL5wOp8zvqPx-U-Q"
genai.configure(api_key=GOOGLE_API_KEY)

models_to_try = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']

for model_name in models_to_try:
    try:
        print(f"Testing model: {model_name}")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello! Are you working?")
        print(f"SUCCESS with {model_name}:", response.text[:100])
        break
    except Exception as e:
        print(f"FAILED with {model_name}: {e}", file=sys.stderr)
