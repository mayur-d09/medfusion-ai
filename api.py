from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import get_patient_data, get_doctor
from ai_module import predict_risk, generate_summary, detect_patterns, generate_smart_query

app = FastAPI(title="UPHC Backend API")

class LoginRequest(BaseModel):
    doctor_id: str
    password: str

@app.post("/login")
def login(req: LoginRequest):
    doc = get_doctor(req.doctor_id)
    if doc and doc[1] == req.password:
        return {"success": True, "name": doc[2]}
    raise HTTPException(status_code=401, detail="Invalid Credentials")

@app.get("/patient/{pid}")
def fetch_patient(pid: str):
    data = get_patient_data(pid)
    if not data:
        raise HTTPException(status_code=404, detail="Patient Not Found")
        
    patient = data["patient"]
    
    # Inject AI layers
    data["ai_summary"] = generate_summary(data)
    
    # Calculate number of conditions based on diagnoses
    conditions_count = len(set([v["diagnosis"] for v in data.get("visits", [])]))
    data["risk_assessment"] = predict_risk(patient["age"], len(data.get("visits", [])), conditions_count)
    
    data["alerts"] = detect_patterns(data["visits"])
    
    return data

class QueryRequest(BaseModel):
    query: str

@app.post("/patient/{pid}/query")
def smart_query(pid: str, req: QueryRequest):
    data = get_patient_data(pid)
    if not data:
        raise HTTPException(status_code=404, detail="Patient Not Found")
    
    response = generate_smart_query(data, req.query)
    return {"response": response}
