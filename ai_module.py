import numpy as np
from sklearn.ensemble import RandomForestClassifier
import google.generativeai as genai
import os
import json

# Configure Gemini API key
genai.configure(api_key="AIzaSyCgYx6mxj8xOiWnLDaj0XC5iniNq4LxjLo")

# ML: Risk Prediction
# Training a basic RandomForest with Age, Num_Visits, Num_Conditions
X_train = np.array([
    [25, 1, 0], [40, 2, 1], [65, 4, 3], 
    [30, 0, 0], [75, 5, 4], [55, 3, 2]
])
y_train = np.array([0, 0, 1, 0, 1, 1]) # 0: Low, 1: High
rf_model = RandomForestClassifier(n_estimators=50, random_state=42)
rf_model.fit(X_train, y_train)

def predict_risk(age, visits_count, conditions_count=1):
    risk_prob = rf_model.predict_proba([[age, visits_count, conditions_count]])[0][1]
    score_pct = round(risk_prob * 100, 2)
    
    if risk_prob > 0.6:
        return {"level": "High Risk", "score": f"{score_pct}%", "color": "🔴"}
    elif risk_prob > 0.3:
        return {"level": "Moderate Risk", "score": f"{score_pct}%", "color": "🟡"}
    return {"level": "Low Risk", "score": f"{score_pct}%", "color": "🟢"}

# GenAI: Clinical Summary (Using Gemini)
def generate_summary(data):
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        prompt = f"""
        Summarize the following patient medical history for a doctor:
        - Highlight key risks
        - Mention trends
        - Keep it concise

        Patient Data:
        {json.dumps(data, indent=2)}
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        # Fallback if API key is not set or invalid
        patient = data.get("patient", {})
        return f"**[Gemini API Error]** {str(e)} - Patient {patient.get('name', 'Unknown')} requires evaluation."

def generate_smart_query(data, query):
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        prompt = f"""
        You are an AI medical assistant for doctors. Answer the doctor's query based ONLY on the patient data provided.
        Be professional, accurate, and concise.
        
        Patient Data:
        {json.dumps(data, indent=2)}
        
        Doctor's Query: {query}
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini API Error: {str(e)}"

# DL: Image Analysis Module (Placeholder)
def analyze_scan(image_bytes=None):
    # import tensorflow as tf
    # model = tf.keras.models.load_model('cnn_model.h5')
    return "No abnormalities detected in scan (DL Analysis Simulated)."

def detect_patterns(visits):
    diagnoses = [v['diagnosis'].lower() for v in visits]
    cardiac_terms = ['arrhythmia', 'chest pain', 'heart', 'cardiac']
    
    alerts = []
    if any(any(c in d for c in cardiac_terms) for d in diagnoses):
        alerts.append("⚠️ Cardiac history detected. Advise ECG review.")
    
    if len(diagnoses) > 3:
        alerts.append("⚠️ Frequent recent hospitalizations.")
        
    return alerts if alerts else ["✅ No critical patterns identified."]
