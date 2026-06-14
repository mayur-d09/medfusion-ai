import os
import uuid
import datetime
from pymongo import MongoClient
import bcrypt

# Fetch MongoDB URI from environment variables
MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    import sys
    print("\n" + "="*80, file=sys.stderr)
    print("FATAL ERROR: MONGODB_URI environment variable is missing!", file=sys.stderr)
    print("Please set MONGODB_URI in your environment variables to run this application.", file=sys.stderr)
    print("For local development: set MONGODB_URI='mongodb://localhost:27017/'", file=sys.stderr)
    print("For production: set MONGODB_URI to your MongoDB Atlas connection string.", file=sys.stderr)
    print("="*80 + "\n", file=sys.stderr)
    raise ValueError("MONGODB_URI environment variable is missing.")
DB_NAME = os.getenv("MONGODB_DB_NAME", "medfusion")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

def get_db():
    """FastAPI Dependency for MongoDB Database"""
    return db

def generate_uphc():
    """Generate unique patient ID with format UPHC-XXXX"""
    return f"UPHC-{str(uuid.uuid4())[:6].upper()}"

# Setup Indexes and Seeds
def setup_db():
    # Clean up null/missing ID documents to prevent DuplicateKeyError
    db.patients.delete_many({"id": None})
    db.patients.delete_many({"id": {"$exists": False}})
    db.doctors.delete_many({"doctor_id": None})
    db.doctors.delete_many({"doctor_id": {"$exists": False}})

    # 1. Create Patient Indexes
    db.patients.create_index("id", unique=True)
    db.patients.create_index("name")
    
    # 2. Create Doctor Indexes
    db.doctors.create_index("doctor_id", unique=True)
    
    # Seed Doctor Accounts if Empty
    if db.doctors.count_documents({}) == 0:
        salt_doc = bcrypt.gensalt()
        hashed_doc = bcrypt.hashpw(b"123", salt_doc).decode('utf-8')
        
        salt_admin = bcrypt.gensalt()
        hashed_admin = bcrypt.hashpw(b"admin", salt_admin).decode('utf-8')
        
        db.doctors.insert_many([
            {
                "doctor_id": "doc",
                "name": "Dr. Sarah",
                "password_hash": hashed_doc,
                "role": "doctor"
            },
            {
                "doctor_id": "admin",
                "name": "Dr. Admin",
                "password_hash": hashed_admin,
                "role": "admin"
            }
        ])
        print("Doctor seeds created.")

    # Seed Patient UPHC-DEMO01 if Empty
    if db.patients.count_documents({"id": "UPHC-DEMO01"}) == 0:
        demo_patient = {
            "id": "UPHC-DEMO01",
            "name": "Rahul Sharma",
            "age": 34,
            "gender": "Male",
            "blood_type": "B+",
            "allergies": "None",
            "emergency_contact": "+91 98765 43210",
            "created_at": datetime.datetime.utcnow(),
            "visits": [
                {
                    "hospital": "City General",
                    "date": "2024-01-10",
                    "diagnosis": "Hypertension",
                    "notes": "Routine checkup - BP slightly elevated"
                },
                {
                    "hospital": "Apollo Care",
                    "date": "2024-05-12",
                    "diagnosis": "Mild Arrhythmia",
                    "notes": "ECG Performed - Normal results"
                },
                {
                    "hospital": "Fortis",
                    "date": "2024-08-20",
                    "diagnosis": "Annual Checkup",
                    "notes": "All vitals normal"
                }
            ],
            "medications": [
                {
                    "medicine": "Amlodipine",
                    "dosage": "5mg",
                    "duration": "Daily"
                },
                {
                    "medicine": "Atorvastatin",
                    "dosage": "10mg",
                    "duration": "Daily"
                }
            ],
            "surgeries": [
                {
                    "surgery": "Appendectomy",
                    "year": "2018",
                    "notes": "Laparoscopic procedure - No complications"
                }
            ],
            "timelines": [
                {
                    "event_type": "visit",
                    "title": "Hypertension Diagnosis",
                    "description": "Patient diagnosed with mild hypertension",
                    "date": "2024-01-10"
                },
                {
                    "event_type": "lab_test",
                    "title": "ECG Test",
                    "description": "Electrocardiogram performed - Normal",
                    "date": "2024-05-12"
                },
                {
                    "event_type": "checkup",
                    "title": "Annual Physical",
                    "description": "Routine annual checkup - All normal",
                    "date": "2024-08-20"
                }
            ],
            "reports": []
        }
        db.patients.insert_one(demo_patient)
        print("Patient DEMO seed created.")

# Run Setup
setup_db()
