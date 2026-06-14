from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query, status, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from database import get_db, generate_uphc
from models import (
    LoginRequest, PatientCreate, QueryRequest, 
    VisitCreate, MedicationCreate, SurgeryCreate, TimelineEventCreate
)
from ai_module import (
    predict_risk, generate_summary, generate_smart_query, 
    analyze_medical_image, generate_qr_code,
    calculate_chci, analyze_timeline_intelligence, generate_pdf_report,
    decode_qr_image, extract_report_data
)
import os
import jwt
import datetime
import bcrypt
import uuid
import io

app = FastAPI(title="MedFusion AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)# Mount permanent uploads folder
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# JWT Security Configurations
JWT_SECRET = os.getenv("JWT_SECRET", "medfusion-super-secret-key-12345")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login", auto_error=False)

def create_access_token(data: dict, expires_delta: datetime.timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing"
        )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials token"
            )
        return {"sub": username, "role": role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

# ==================== ROOT & HEALTH ====================
@app.get("/")
def read_root():
    return {
        "status": "MedFusion AI Backend is Running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "MedFusion AI"}

# ==================== AUTHENTICATION ====================
@app.post("/api/login")
def login(req: LoginRequest, db = Depends(get_db)):
    """
    Provider and Patient Authentication Endpoint.
    Default credentials: doc / 123
    For patients: UPHC ID (e.g., UPHC-DEMO01), password can be '123' or their ID.
    """
    doctor = db.doctors.find_one({"doctor_id": req.doctor_id})
    if doctor:
        if bcrypt.checkpw(req.password.encode('utf-8'), doctor["password_hash"].encode('utf-8')):
            token = create_access_token(data={"sub": doctor["doctor_id"], "role": doctor["role"]})
            return {"success": True, "token": token, "name": doctor["name"], "role": doctor["role"]}
            
    # Check if Patient Login
    if req.doctor_id.upper().startswith("UPHC-"):
        pid = req.doctor_id.upper()
        patient = db.patients.find_one({"id": pid})
        if patient:
            if req.password == "123" or req.password.upper() == pid:
                token = create_access_token(data={"sub": pid, "role": "patient"})
                return {"success": True, "token": token, "name": patient["name"], "role": "patient"}
                
    raise HTTPException(status_code=401, detail="Invalid Credentials")

# ==================== PATIENT MANAGEMENT ====================
@app.post("/api/patients")
def create_patient(patient: PatientCreate, db = Depends(get_db), current_user = Depends(get_current_user)):
    """Create a new patient with unique UPHC ID. Providers only."""
    if current_user["role"] not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only healthcare providers can register patients")
        
    new_id = generate_uphc()
    new_patient = {
        "id": new_id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "blood_type": patient.blood_type,
        "allergies": patient.allergies,
        "emergency_contact": patient.emergency_contact,
        "created_at": datetime.datetime.utcnow(),
        "visits": [],
        "medications": [],
        "surgeries": [],
        "timelines": [],
        "reports": []
    }
    db.patients.insert_one(new_patient)
    return {"message": "Patient created successfully", "patient_id": new_id}

@app.get("/api/patients")
def list_patients(db = Depends(get_db), current_user = Depends(get_current_user)):
    """List all patients in the registry. Providers only."""
    if current_user["role"] not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Patients cannot list all patients")
        
    patients = list(db.patients.find({}, {"_id": 0, "id": 1, "name": 1, "age": 1, "gender": 1}))
    return {
        "patients": patients,
        "count": len(patients)
    }

@app.get("/api/patients/{pid}")
def get_patient(pid: str, db = Depends(get_db), current_user = Depends(get_current_user)):
    """Get full patient data including AI insights. Role-based check applied."""
    if current_user["role"] == "patient" and current_user["sub"] != pid:
        raise HTTPException(status_code=403, detail="Forbidden: You can only access your own records")
        
    db_patient = db.patients.find_one({"id": pid}, {"_id": 0})
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient Not Found")

    visits = db_patient.get("visits", [])
    medications = db_patient.get("medications", [])
    surgeries = db_patient.get("surgeries", [])
    timelines = db_patient.get("timelines", [])
    reports = db_patient.get("reports", [])
    archive = db_patient.get("archive", [])

    patient_data = {
        "id": db_patient["id"],
        "name": db_patient["name"],
        "age": db_patient["age"],
        "gender": db_patient["gender"],
        "blood_type": db_patient.get("blood_type"),
        "allergies": db_patient.get("allergies"),
        "emergency_contact": db_patient.get("emergency_contact"),
        "visits": visits,
        "medications": medications,
        "surgeries": surgeries,
        "timelines": timelines,
        "reports": reports,
        "archive": archive
    }

    # Recalculate AI layers dynamically
    conditions_count = len(set([v["diagnosis"] for v in visits if v.get("diagnosis")]))
    risk_assessment = predict_risk(db_patient["age"], len(visits), conditions_count)
    ai_summary = generate_summary(patient_data)
    
    chci = calculate_chci(visits)
    timeline_insights = analyze_timeline_intelligence(visits, timelines)

    # Generate Smart Doctor Brief
    recent_findings = []
    if reports:
        # Check last uploaded report vitals
        last_rep = reports[-1]
        sd = last_rep.get("structured_data", {})
        if sd.get("blood_pressure"):
            recent_findings.append(f"Blood Pressure: {sd.get('blood_pressure')}")
        if sd.get("glucose"):
            recent_findings.append(f"Glucose: {sd.get('glucose')} mg/dL")
        if sd.get("cholesterol"):
            recent_findings.append(f"Cholesterol: {sd.get('cholesterol')} mg/dL")
            
    if not recent_findings:
        recent_findings = ["Vitals stable", "No acute abnormal findings documented recently."]
        
    last_admission = "No recorded visits"
    if visits:
        sorted_visits = sorted(visits, key=lambda x: x.get("date", ""), reverse=True)
        last_admission = f"{sorted_visits[0].get('date')} at {sorted_visits[0].get('hospital')}"

    doctor_brief = {
        "major_conditions": list(set([v["diagnosis"] for v in visits if v.get("diagnosis")])),
        "current_medications": medications,
        "allergies": db_patient.get("allergies") or "None",
        "surgeries": surgeries,
        "recent_findings": recent_findings,
        "risk_level": risk_assessment["level"],
        "last_admission": last_admission
    }

    return {
        "patient": patient_data,
        "risk_assessment": risk_assessment,
        "ai_summary": ai_summary,
        "chci": chci,
        "timeline_insights": timeline_insights,
        "doctor_brief": doctor_brief
    }

@app.get("/api/patients/{pid}/report")
def get_patient_report(pid: str, db = Depends(get_db), current_user = Depends(get_current_user)):
    """Generate and return a base64 encoded PDF report."""
    if current_user["role"] == "patient" and current_user["sub"] != pid:
        raise HTTPException(status_code=403, detail="Forbidden: You can only download your own PDF report")
        
    db_patient = db.patients.find_one({"id": pid}, {"_id": 0})
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient Not Found")

    visits = db_patient.get("visits", [])
    medications = db_patient.get("medications", [])
    surgeries = db_patient.get("surgeries", [])
    timelines = db_patient.get("timelines", [])

    patient_data = {
        "id": db_patient["id"],
        "name": db_patient["name"],
        "age": db_patient["age"],
        "gender": db_patient["gender"],
        "blood_type": db_patient.get("blood_type", "N/A"),
        "visits": visits,
        "medications": medications,
        "surgeries": surgeries
    }

    conditions_count = len(set([v["diagnosis"] for v in visits if v.get("diagnosis")]))
    risk = predict_risk(db_patient["age"], len(visits), conditions_count)
    ai_summary = generate_summary(patient_data)
    chci = calculate_chci(visits)
    timeline_insights = analyze_timeline_intelligence(visits, timelines)

    pdf_base64 = generate_pdf_report(patient_data, risk, chci, timeline_insights, ai_summary)
    return {"pdf_content": pdf_base64, "filename": f"MedFusion_Report_{pid}.pdf"}

@app.get("/api/patients/{pid}/qr")
def get_patient_qr(pid: str, db = Depends(get_db), current_user = Depends(get_current_user)):
    """Get QR code for patient ID."""
    if current_user["role"] == "patient" and current_user["sub"] != pid:
        raise HTTPException(status_code=403, detail="Forbidden: You can only request your own QR code")
        
    db_patient = db.patients.find_one({"id": pid})
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient Not Found")
    
    qr_image = generate_qr_code(pid)
    return {"patient_id": pid, "qr_image": qr_image}

# ==================== SMART QUERY ====================
@app.post("/api/patients/{pid}/query")
def smart_query(pid: str, req: QueryRequest, db = Depends(get_db), current_user = Depends(get_current_user)):
    """Natural language query about patient history using real data."""
    if current_user["role"] == "patient" and current_user["sub"] != pid:
        raise HTTPException(status_code=403, detail="Forbidden: You can only query your own history")
        
    db_patient = db.patients.find_one({"id": pid})
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient Not Found")

    visits = db_patient.get("visits", [])
    medications = db_patient.get("medications", [])
    surgeries = db_patient.get("surgeries", [])

    patient_data = {
        "id": db_patient["id"],
        "name": db_patient["name"],
        "age": db_patient["age"],
        "gender": db_patient["gender"],
        "blood_type": db_patient.get("blood_type"),
        "allergies": db_patient.get("allergies"),
        "emergency_contact": db_patient.get("emergency_contact"),
        "visits": visits,
        "medications": medications,
        "surgeries": surgeries,
        "timelines": db_patient.get("timelines", []),
        "reports": db_patient.get("reports", [])
    }

    ai_response = generate_smart_query(patient_data, req.query)
    return {"response": ai_response}

# ==================== CLINICAL REPORT INGESTION ====================
@app.post("/api/patients/{pid}/upload-report")
async def upload_report(
    pid: str,
    file: UploadFile = File(...),
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Accepts PDF, PNG, JPG, JPEG clinical report.
    Performs OCR and NLP to extract diagnostics, medications, surgeries, etc.
    Updates MongoDB Patient record and timeline automatically.
    """
    if current_user["role"] == "patient" and current_user["sub"] != pid:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot upload reports for other patients")
        
    db_patient = db.patients.find_one({"id": pid})
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient Not Found")
        
    # Check extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.png', '.jpg', '.jpeg']:
        raise HTTPException(status_code=400, detail="Invalid file type. Supported formats: PDF, PNG, JPG, JPEG")
        
    file_bytes = await file.read()
    
    try:
        report_data = extract_report_data(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR or NLP Extraction failed: {str(e)}")
        
    raw_text = report_data["raw_text"]
    structured = report_data["structured_data"]
    
    # Store Raw & Structured permanently
    report_record = {
        "filename": file.filename,
        "upload_date": datetime.datetime.utcnow(),
        "raw_text": raw_text,
        "structured_data": structured
    }
    
    # Push to patient's reports
    db.patients.update_one({"id": pid}, {"$push": {"reports": report_record}})
    
    # Update Patient Records based on structured entities
    # 1. Update Diagnoses
    for diag in structured.get("diagnoses", []):
        visit = {
            "hospital": "Automated OCR Ingestion",
            "date": datetime.datetime.utcnow().strftime("%Y-%m-%d"),
            "diagnosis": diag,
            "notes": f"Extracted via clinical report OCR ({file.filename}). Vitals: BP {structured.get('blood_pressure')}, Glucose: {structured.get('glucose')} mg/dL, Cholesterol: {structured.get('cholesterol')} mg/dL."
        }
        db.patients.update_one({"id": pid}, {"$push": {"visits": visit}})
        # Update Timeline
        db.patients.update_one({"id": pid}, {"$push": {"timelines": {
            "event_type": "visit",
            "title": f"Diagnosis: {diag}",
            "description": f"Extracted from report {file.filename}",
            "date": datetime.datetime.utcnow().strftime("%Y-%m-%d")
        }}})
        
    # 2. Update Medications
    for med in structured.get("medications", []):
        db.patients.update_one({"id": pid}, {"$push": {"medications": {
            "medicine": med["medicine"],
            "dosage": med["dosage"],
            "duration": med["duration"]
        }}})
        db.patients.update_one({"id": pid}, {"$push": {"timelines": {
            "event_type": "medication",
            "title": f"Medication: {med['medicine']}",
            "description": f"Dosage: {med['dosage']}, Duration: {med['duration']}",
            "date": datetime.datetime.utcnow().strftime("%Y-%m-%d")
        }}})
        
    # 3. Update Surgeries
    for surg in structured.get("surgeries", []):
        db.patients.update_one({"id": pid}, {"$push": {"surgeries": {
            "surgery": surg["surgery"],
            "year": surg["year"],
            "notes": surg.get("notes", "Extracted Surgery")
        }}})
        db.patients.update_one({"id": pid}, {"$push": {"timelines": {
            "event_type": "surgery",
            "title": f"Surgery: {surg['surgery']}",
            "description": f"Year: {surg['year']}",
            "date": datetime.datetime.utcnow().strftime("%Y-%m-%d")
        }}})
        
    # 4. Update Allergies
    if structured.get("allergies"):
        curr_pat = db.patients.find_one({"id": pid})
        curr_allergies = curr_pat.get("allergies")
        new_allergies_str = ", ".join(structured["allergies"])
        if curr_allergies and curr_allergies.lower() != "none":
            updated_allergies = f"{curr_allergies}, {new_allergies_str}"
        else:
            updated_allergies = new_allergies_str
        db.patients.update_one({"id": pid}, {"$set": {"allergies": updated_allergies}})
        
    # Add ingestion timeline event
    db.patients.update_one({"id": pid}, {"$push": {"timelines": {
        "event_type": "lab_test",
        "title": f"Report Ingested: {file.filename}",
        "description": f"Successfully parsed. Vitals: BP: {structured.get('blood_pressure')}, Sugar: {structured.get('glucose')} mg/dL, Cholesterol: {structured.get('cholesterol')} mg/dL.",
        "date": datetime.datetime.utcnow().strftime("%Y-%m-%d")
    }}})
    
    return {
        "message": "Report uploaded and processed successfully",
        "structured_data": structured
    }

def upload_file_to_storage(file_bytes: bytes, filename: str, pid: str) -> str:
    # 1. Check Cloudinary credentials
    cloudinary_url = os.getenv("CLOUDINARY_URL")
    if cloudinary_url:
        try:
            import cloudinary
            import cloudinary.uploader
            result = cloudinary.uploader.upload(file_bytes, public_id=f"medfusion_{pid}_{str(uuid.uuid4())[:8]}")
            if "secure_url" in result:
                return result["secure_url"]
        except Exception as e:
            print(f"Cloudinary upload failed: {e}. Falling back to local storage.")

    # 2. Check S3 credentials
    s3_bucket = os.getenv("AWS_S3_BUCKET")
    if s3_bucket and os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):
        try:
            import boto3
            s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
            )
            s3_key = f"uploads/{pid}/{uuid.uuid4()}_{filename}"
            s3_client.upload_fileobj(io.BytesIO(file_bytes), s3_bucket, s3_key)
            region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
            return f"https://{s3_bucket}.s3.{region}.amazonaws.com/{s3_key}"
        except Exception as e:
            print(f"S3 upload failed: {e}. Falling back to local storage.")

    # 3. Default Local serving permanent fallback
    pid_dir = os.path.join("uploads", pid)
    os.makedirs(pid_dir, exist_ok=True)
    unique_fn = f"{int(datetime.datetime.utcnow().timestamp())}_{filename}"
    file_path = os.path.join(pid_dir, unique_fn)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return f"/uploads/{pid}/{unique_fn}"

@app.post("/api/patients/{pid}/archive-upload")
async def archive_upload(
    pid: str,
    request: Request,
    file: UploadFile = File(...),
    category: str = Form(...),
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Accepts clinical report or medical image.
    Saves the file permanently in S3, Cloudinary or local uploads directory fallback.
    Performs OCR and NLP to extract raw text and structured entities.
    Inserts archive record under patient's archive array.
    """
    db_patient = db.patients.find_one({"id": pid})
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient Not Found")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.png', '.jpg', '.jpeg']:
        raise HTTPException(status_code=400, detail="Invalid file type. Supported formats: PDF, PNG, JPG, JPEG")
        
    file_bytes = await file.read()
    
    # Extract OCR and NLP structured details
    try:
        report_data = extract_report_data(file_bytes, file.filename)
        raw_text = report_data["raw_text"]
        structured = report_data["structured_data"]
    except Exception as e:
        raw_text = f"OCR extraction failed: {str(e)}"
        structured = {}
        
    # Upload and save file
    stored_path = upload_file_to_storage(file_bytes, file.filename, pid)
    if stored_path.startswith("/uploads"):
        base_url = str(request.base_url)
        if base_url.endswith("/") and stored_path.startswith("/"):
            file_url = base_url + stored_path[1:]
        else:
            file_url = base_url + stored_path
    else:
        file_url = stored_path
        
    archive_record = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "category": category,
        "section": "imaging" if category in ['x_ray', 'mri', 'ct_scan', 'ultrasound'] else "clinical_document",
        "file_url": file_url,
        "upload_date": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "uploader": current_user.get("sub", "unknown"),
        "ocr_text": raw_text,
        "extracted_entities": structured
    }
    
    db.patients.update_one({"id": pid}, {"$push": {"archive": archive_record}})
    
    return {
        "message": "File archived successfully",
        "archive_record": archive_record
    }

# ==================== QR SCANNING ====================
@app.post("/api/patients/scan-qr")
async def scan_qr(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    """Upload and decode a QR code image to resolve patient ID."""
    contents = await file.read()
    try:
        patient_id = decode_qr_image(contents)
        return {"patient_id": patient_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"QR scan failed: {str(e)}")

# ==================== MANUAL MEDICAL RECORD ADDITIONS ====================
@app.post("/api/patients/{pid}/visit")
def add_visit(pid: str, visit: VisitCreate, db = Depends(get_db), current_user = Depends(get_current_user)):
    """Add a visit record to patient."""
    db_patient = db.patients.find_one({"id": pid})
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient Not Found")
    
    db.patients.update_one({"id": pid}, {"$push": {"visits": {
        "hospital": visit.hospital,
        "date": visit.date,
        "diagnosis": visit.diagnosis,
        "notes": visit.notes
    }}})
    db.patients.update_one({"id": pid}, {"$push": {"timelines": {
        "event_type": "visit",
        "title": f"Visit: {visit.diagnosis}",
        "description": f"Hospital: {visit.hospital}. Notes: {visit.notes}",
        "date": visit.date
    }}})
    return {"message": "Visit added successfully"}

@app.post("/api/patients/{pid}/medication")
def add_medication(pid: str, med: MedicationCreate, db = Depends(get_db), current_user = Depends(get_current_user)):
    """Add a medication to patient."""
    db_patient = db.patients.find_one({"id": pid})
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient Not Found")
    
    db.patients.update_one({"id": pid}, {"$push": {"medications": {
        "medicine": med.medicine,
        "dosage": med.dosage,
        "duration": med.duration
    }}})
    db.patients.update_one({"id": pid}, {"$push": {"timelines": {
        "event_type": "medication",
        "title": f"Medication: {med.medicine}",
        "description": f"Dosage: {med.dosage}, Duration: {med.duration}",
        "date": datetime.datetime.utcnow().strftime("%Y-%m-%d")
    }}})
    return {"message": "Medication added successfully"}

@app.post("/api/patients/{pid}/surgery")
def add_surgery(pid: str, surgery: SurgeryCreate, db = Depends(get_db), current_user = Depends(get_current_user)):
    """Add a surgery record to patient."""
    db_patient = db.patients.find_one({"id": pid})
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient Not Found")
    
    db.patients.update_one({"id": pid}, {"$push": {"surgeries": {
        "surgery": surgery.surgery,
        "year": surgery.year,
        "notes": surgery.notes
    }}})
    db.patients.update_one({"id": pid}, {"$push": {"timelines": {
        "event_type": "surgery",
        "title": f"Surgery: {surgery.surgery}",
        "description": surgery.notes or f"Surgery in year {surgery.year}",
        "date": f"{surgery.year}-01-01" if (surgery.year and len(surgery.year) == 4 and surgery.year.isdigit()) else datetime.datetime.utcnow().strftime("%Y-%m-%d")
    }}})
    return {"message": "Surgery added successfully"}

@app.post("/api/patients/{pid}/timeline")
def add_timeline(pid: str, event: TimelineEventCreate, db = Depends(get_db), current_user = Depends(get_current_user)):
    """Add a timeline event to patient."""
    db_patient = db.patients.find_one({"id": pid})
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient Not Found")
    
    db.patients.update_one({"id": pid}, {"$push": {"timelines": {
        "event_type": event.event_type,
        "title": event.title,
        "description": event.description,
        "date": event.date
    }}})
    return {"message": "Timeline event added successfully"}

# ==================== IMAGE ANALYSIS ====================
@app.post("/api/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    image_type: str = Query("xray"),
    current_user = Depends(get_current_user)
):
    """Upload and analyze medical scan images (X-Ray, MRI, etc.) using placeholder CNN."""
    content = await file.read()
    analysis_result = analyze_medical_image(content, image_type)
    return analysis_result
