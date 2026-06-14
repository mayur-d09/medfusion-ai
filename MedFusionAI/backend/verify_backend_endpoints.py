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
from ai_module import decode_qr_image

# Start uvicorn server in a background thread
def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8082, log_level="warning")

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(2) # Give server time to start

client = httpx.Client(base_url="http://127.0.0.1:8082")

def run_tests():
    print("=================== STARTING MEDFUSION AI QA INTEGRATION TEST ===================")
    
    # Clean up patients collection database state for testing
    db.patients.delete_many({"name": "Integration Test Patient"})
    
    # ------------------ TEST 1: JWT & Password Hashing ------------------
    print("\n--- Test 1: Provider Login & Authentication ---")
    login_data = {"doctor_id": "doc", "password": "123"}
    res = client.post("/api/login", json=login_data)
    assert res.status_code == 200, f"Login failed: {res.text}"
    auth_resp = res.json()
    assert auth_resp["success"] is True
    assert "token" in auth_resp
    assert auth_resp["role"] == "doctor"
    doctor_token = auth_resp["token"]
    print("Success: Doctor login authenticated, JWT token retrieved.")
    
    # Invalid Credentials
    bad_login = {"doctor_id": "doc", "password": "wrongpassword"}
    res_bad = client.post("/api/login", json=bad_login)
    assert res_bad.status_code == 401
    print("Success: Invalid login blocked with 401.")
    
    # ------------------ TEST 2: Role-Based Access Control (RBAC) ------------------
    print("\n--- Test 2: Role-Based Access Control ---")
    # Access patient without token
    res_no_auth = client.get("/api/patients/UPHC-DEMO01")
    assert res_no_auth.status_code == 401
    print("Success: Access without token blocked with 401.")
    
    # Access patient with doctor token
    headers = {"Authorization": f"Bearer {doctor_token}"}
    res_auth = client.get("/api/patients/UPHC-DEMO01", headers=headers)
    assert res_auth.status_code == 200, f"Failed to get patient: {res_auth.text}"
    demo_patient = res_auth.json()
    assert demo_patient["patient"]["id"] == "UPHC-DEMO01"
    print("Success: Doctor token authorized to access patient record.")
    
    # Create a new patient
    new_patient_data = {
        "name": "Integration Test Patient",
        "age": 45,
        "gender": "Female",
        "blood_type": "A-",
        "allergies": "None",
        "emergency_contact": "+91 99999 88888"
    }
    res_create = client.post("/api/patients", json=new_patient_data, headers=headers)
    assert res_create.status_code == 200
    create_resp = res_create.json()
    new_pid = create_resp["patient_id"]
    print(f"Success: New patient registered. ID: {new_pid}")
    
    # Login as Patient
    pat_login = {"doctor_id": new_pid, "password": "123"}
    res_pat_login = client.post("/api/login", json=pat_login)
    assert res_pat_login.status_code == 200
    pat_token = res_pat_login.json()["token"]
    print(f"Success: Patient login authenticated with UPHC ID, token retrieved.")
    
    # Patient tries to access own page
    pat_headers = {"Authorization": f"Bearer {pat_token}"}
    res_own = client.get(f"/api/patients/{new_pid}", headers=pat_headers)
    assert res_own.status_code == 200
    print("Success: Patient authorized to access own records.")
    
    # Patient tries to access DEMO patient page (Forbidden)
    res_forbidden = client.get("/api/patients/UPHC-DEMO01", headers=pat_headers)
    assert res_forbidden.status_code == 403
    print("Success: Patient blocked from accessing another patient's records with 403.")
    
    # ------------------ TEST 3: Report Ingestion, OCR & NLP Pipeline ------------------
    print("\n--- Test 3: Report Upload, OCR & NLP Ingestion ---")
    
    # Generate a simple PDF using reportlab
    pdf_buffer = io.BytesIO()
    p = canvas.Canvas(pdf_buffer, pagesize=letter)
    p.drawString(100, 750, "CLINICAL VISIT SUMMARY")
    p.drawString(100, 730, "Patient Name: Integration Test Patient")
    p.drawString(100, 710, "Vitals: Blood Pressure: 130/85, Glucose Level: 105 mg/dL, Total Cholesterol: 195")
    p.drawString(100, 690, "Active Diagnoses: Asthma, Hypertension")
    p.drawString(100, 670, "Medications: Metformin 500mg daily, Amlodipine 5mg daily")
    p.drawString(100, 650, "Surgical History: Appendectomy in 2020")
    p.drawString(100, 630, "Allergies: Penicillin")
    p.drawString(100, 610, "Doctor Recommendations: Limit sugar intake. Patient should avoid dust. Follow up in 3 months.")
    p.showPage()
    p.save()
    pdf_bytes = pdf_buffer.getvalue()
    
    files = {"file": ("report.pdf", pdf_bytes, "application/pdf")}
    res_upload = client.post(f"/api/patients/{new_pid}/upload-report", files=files, headers=headers)
    assert res_upload.status_code == 200, f"Upload failed: {res_upload.text}"
    upload_resp = res_upload.json()
    assert "structured_data" in upload_resp
    print("Success: PDF Report uploaded and processed successfully.")
    
    # ------------------ TEST 4: Verification of Updated Records & Smart Doctor Brief ------------------
    print("\n--- Test 4: Verify Patient History & Smart Doctor Brief ---")
    res_updated = client.get(f"/api/patients/{new_pid}", headers=headers)
    assert res_updated.status_code == 200
    updated_data = res_updated.json()
    
    # Check that OCR extracted entities are in patient records
    med_names = [m["medicine"] for m in updated_data["patient"]["medications"]]
    assert "Metformin" in med_names or "Metformin 500mg daily" in med_names or any("metformin" in n.lower() for n in med_names)
    print("Success: Medication (Metformin) added to patient history.")
    
    diagnoses_names = [v["diagnosis"] for v in updated_data["patient"]["visits"]]
    assert "Asthma" in diagnoses_names or any("asthma" in d.lower() for d in diagnoses_names)
    print("Success: Diagnosis (Asthma) added to patient history.")
    
    surgeries_names = [s["surgery"] for s in updated_data["patient"]["surgeries"]]
    assert "Appendectomy" in surgeries_names or any("appendectomy" in s.lower() for s in surgeries_names)
    print("Success: Surgery (Appendectomy) added to patient history.")
    
    # Verify Smart Doctor Brief updates
    brief = updated_data["doctor_brief"]
    assert "Asthma" in brief["major_conditions"] or any("asthma" in m.lower() for m in brief["major_conditions"])
    assert "Penicillin" in brief["allergies"]
    assert any("130/85" in f or "blood pressure" in f.lower() for f in brief["recent_findings"])
    assert any("105" in f or "glucose" in f.lower() for f in brief["recent_findings"])
    print("Success: Smart Doctor Brief dynamically updated with diagnoses, medications, allergies, and recent vitals.")
    
    # ------------------ TEST 5: QR Code System ------------------
    print("\n--- Test 5: Verify QR Code generation and resolution ---")
    res_qr = client.get(f"/api/patients/{new_pid}/qr", headers=headers)
    assert res_qr.status_code == 200
    qr_resp = res_qr.json()
    assert qr_resp["patient_id"] == new_pid
    qr_b64 = qr_resp["qr_image"].split(",")[1]
    qr_png_bytes = base64.b64decode(qr_b64)
    
    # Decode QR code image using backend module
    decoded_pid = decode_qr_image(qr_png_bytes)
    assert decoded_pid == new_pid
    print(f"Success: QR generated uniquely and decoded back to Patient ID: {decoded_pid}")
    
    # Test POST QR scan endpoint
    scan_files = {"file": ("qr.png", qr_png_bytes, "image/png")}
    res_scan = client.post("/api/patients/scan-qr", files=scan_files, headers=headers)
    assert res_scan.status_code == 200
    assert res_scan.json()["patient_id"] == new_pid
    print("Success: Backend scan-qr endpoint successfully decoded QR image.")
    
    # ------------------ TEST 6: AI Natural Language Query ------------------
    print("\n--- Test 6: AI Natural Language Query System ---")
    query_data = {"query": "List medications for the patient"}
    res_query = client.post(f"/api/patients/{new_pid}/query", json=query_data, headers=headers)
    assert res_query.status_code == 200
    query_resp = res_query.json()
    assert "response" in query_resp
    assert "metformin" in query_resp["response"].lower() or "medicine" in query_resp["response"].lower() or "amlodipine" in query_resp["response"].lower()
    print("Success: AI query returned patient-specific medication details: ", query_resp["response"])
    
    # ------------------ TEST 7: PDF Health Summary ------------------
    print("\n--- Test 7: Verify PDF Health Summary Generation ---")
    res_pdf = client.get(f"/api/patients/{new_pid}/report", headers=headers)
    assert res_pdf.status_code == 200
    pdf_resp = res_pdf.json()
    assert "pdf_content" in pdf_resp
    
    try:
        pdf_raw = base64.b64decode(pdf_resp["pdf_content"])
        assert pdf_raw.startswith(b"%PDF")
        print("Success: PDF Report generated, starts with %PDF prefix.")
    except Exception as e:
        print("Failed: PDF content invalid: ", e, file=sys.stderr)
        sys.exit(1)
        
    # ------------------ TEST 8: Failure Testing & Edge Cases ------------------
    print("\n--- Test 8: Failure & Validation Testing ---")
    # Invalid file format upload
    bad_files = {"file": ("report.txt", b"Hello", "text/plain")}
    res_bad_upload = client.post(f"/api/patients/{new_pid}/upload-report", files=bad_files, headers=headers)
    assert res_bad_upload.status_code == 400
    print("Success: Invalid upload blocked with 400.")
    
    # Expired/Invalid Token access
    bad_headers = {"Authorization": "Bearer invalidtoken123"}
    res_bad_auth = client.get(f"/api/patients/{new_pid}", headers=bad_headers)
    assert res_bad_auth.status_code == 401
    print("Success: Invalid JWT token access blocked with 401.")
    
    # Non-existent Patient query
    res_missing = client.get("/api/patients/UPHC-NONEXISTENT", headers=headers)
    assert res_missing.status_code == 404
    print("Success: Query of non-existent patient returns 404.")
    
    # Clean up test database records
    db.patients.delete_many({"name": "Integration Test Patient"})
    print("\n=================== ALL BACKEND WORKFLOWS PASSED ===================")

if __name__ == "__main__":
    run_tests()
