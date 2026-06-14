import traceback
import sys
from ai_module import generate_pdf_report

patient_data = {
    "id": "UPHC-8BF0E2",
    "name": "Integration Test Patient",
    "age": 45,
    "gender": "Female",
    "blood_type": "A-",
    "visits": [],
    "medications": [],
    "surgeries": []
}
risk = {"level": "Low Risk", "score": 0.01, "factors": ["Healthy profile"]}
chci = {"status": "Stable Care", "hospitals_count": 0}
timeline_insights = ["Healthcare Continuity: 0 visits."]
ai_summary = {"summary": "Integration Test Patient is a 45-year-old patient with 1 recorded clinical encounters across multiple healthcare facilities. Active diagnoses include: Asthma, Hypertension. Currently prescribed 2 medication(s). Surgical history documented: 1 procedure(s). Based on longitudinal data, continued monitoring and preventive care are advised."}

try:
    generate_pdf_report(patient_data, risk, chci, timeline_insights, ai_summary)
    print("PDF generated successfully!")
except Exception as e:
    print("PDF generation failed:")
    traceback.print_exc()
