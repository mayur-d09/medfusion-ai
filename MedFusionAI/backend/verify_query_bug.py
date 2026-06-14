import httpx
import sys
import os
import io
import datetime
import base64
import time
import threading
import uvicorn
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

# Import FastAPI app and database
from main import app
from database import get_db, db

def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8083, log_level="warning")

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(2) # Give server time to start

client = httpx.Client(base_url="http://127.0.0.1:8083")

def run_tests():
    print("=================== STARTING SMART AI QUERY BUG VERIFICATION TEST ===================")
    
    # Clean up test state
    db.patients.delete_many({"name": "Query Bug Test Patient"})
    
    # 1. Login as doctor
    print("\n1. Logging in as doctor...")
    login_data = {"doctor_id": "doc", "password": "123"}
    res = client.post("/api/login", json=login_data)
    assert res.status_code == 200, f"Login failed: {res.text}"
    doctor_token = res.json()["token"]
    headers = {"Authorization": f"Bearer {doctor_token}"}
    
    # 2. Create Patient
    print("2. Creating test patient...")
    new_patient_data = {
        "name": "Query Bug Test Patient",
        "age": 52,
        "gender": "Male",
        "blood_type": "O+",
        "allergies": "Penicillin",
        "emergency_contact": "+1 555-0199"
    }
    res_create = client.post("/api/patients", json=new_patient_data, headers=headers)
    assert res_create.status_code == 200, f"Creation failed: {res_create.text}"
    pid = res_create.json()["patient_id"]
    print(f"   Created patient with ID: {pid}")
    
    # 3. Create PDF Report with target data
    print("3. Generating PDF Report containing target vitals and MRI findings...")
    pdf_buffer = io.BytesIO()
    p = canvas.Canvas(pdf_buffer, pagesize=letter)
    p.drawString(100, 750, "CLINICAL OBSERVATION REPORT")
    p.drawString(100, 730, f"Patient Name: Query Bug Test Patient")
    p.drawString(100, 710, "Blood Pressure: 168/102 mmHg")
    p.drawString(100, 690, "Blood Glucose: 212 mg/dL")
    p.drawString(100, 670, "Active Medications: Metformin 500mg, Amlodipine 5mg, Atorvastatin 10mg")
    p.drawString(100, 650, "MRI Findings: Mild L4-L5 disc bulge")
    p.showPage()
    p.save()
    pdf_bytes = pdf_buffer.getvalue()
    
    # 4. Upload Report
    print("4. Uploading clinical report PDF...")
    files = {"file": ("report_query_test.pdf", pdf_bytes, "application/pdf")}
    res_upload = client.post(f"/api/patients/{pid}/upload-report", files=files, headers=headers)
    assert res_upload.status_code == 200, f"Upload failed: {res_upload.text}"
    print("   Upload succeeded.")
    
    # 5. Run queries and verify responses
    print("\n5. Running Smart AI Queries and verifying output...")
    
    test_cases = [
        {
            "query": "recent blood pressure",
            "expected": "168/102 mmHg"
        },
        {
            "query": "current glucose",
            "expected": "212 mg/dL"
        },
        {
            "query": "current medications",
            "expected": "Metformin\nAmlodipine\nAtorvastatin"
        },
        {
            "query": "recent MRI findings",
            "expected": "L4-L5 disc bulge"
        }
    ]
    
    for case in test_cases:
        query_text = case["query"]
        expected_text = case["expected"]
        print(f"\n   Query: '{query_text}'")
        res_query = client.post(f"/api/patients/{pid}/query", json={"query": query_text}, headers=headers)
        assert res_query.status_code == 200, f"Query failed: {res_query.text}"
        response_text = res_query.json()["response"]
        print(f"   Actual:   {repr(response_text)}")
        print(f"   Expected: {repr(expected_text)}")
        assert response_text == expected_text, f"Assertion failed! Expected: '{expected_text}', got: '{response_text}'"
        print("   Status:   PASS")
        
    # Clean up database records
    db.patients.delete_many({"name": "Query Bug Test Patient"})
    print("\n=================== ALL BUG VERIFICATION TESTS PASSED SUCCESSFULLY! ===================")

if __name__ == "__main__":
    run_tests()
