from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ==================== AUTHENTICATION ====================
class LoginRequest(BaseModel):
    doctor_id: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    name: Optional[str] = None
    message: Optional[str] = None

# ==================== PATIENT MANAGEMENT ====================
class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None
    created_at: Optional[str] = None

# ==================== MEDICAL RECORDS ====================
class VisitCreate(BaseModel):
    hospital: str
    date: str
    diagnosis: str
    notes: Optional[str] = None

class MedicationCreate(BaseModel):
    medicine: str
    dosage: str
    duration: str

class SurgeryCreate(BaseModel):
    surgery: str
    year: str
    notes: Optional[str] = None

class TimelineEventCreate(BaseModel):
    event_type: str  # visit, medication, surgery, lab_test, checkup
    title: str
    description: str
    date: str

# ==================== SMART QUERY ====================
class QueryRequest(BaseModel):
    query: str

# ==================== IMAGE ANALYSIS ====================
class ImageAnalysisRequest(BaseModel):
    image_type: str  # xray, mri, ct_scan, ultrasound, other

class ImageAnalysisResponse(BaseModel):
    filename: str
    analysis: str
    confidence: Optional[float] = None
    findings: Optional[List[str]] = None

# ==================== QR CODE ====================
class QRCodeResponse(BaseModel):
    patient_id: str
    qr_image: str  # Base64 encoded image

# ==================== RISK ASSESSMENT ====================
class RiskAssessment(BaseModel):
    level: str
    score: float
    color: str
    factors: Optional[List[str]] = None

# ==================== AI SUMMARY ====================
class AISummaryResponse(BaseModel):
    summary: str
    key_insights: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
