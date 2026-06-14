import sqlite3

DB_NAME = "health_v2.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # Doctors Table
    c.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        password TEXT,
        name TEXT
    )
    """)

    # Patients Table
    c.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT,
        age INTEGER,
        gender TEXT
    )
    """)

    # Visits Table
    c.execute("""
    CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT,
        hospital TEXT,
        date TEXT,
        diagnosis TEXT,
        notes TEXT
    )
    """)

    # Medications
    c.execute("""
    CREATE TABLE IF NOT EXISTS medications (
        patient_id TEXT,
        medicine TEXT,
        dosage TEXT,
        duration TEXT
    )
    """)

    # Surgeries
    c.execute("""
    CREATE TABLE IF NOT EXISTS surgeries (
        patient_id TEXT,
        surgery TEXT,
        year TEXT
    )
    """)

    # Insert Dummy Data
    c.execute("INSERT OR IGNORE INTO doctors VALUES ('DOC001', 'password123', 'Dr. Smith')")
    c.execute("INSERT OR IGNORE INTO patients VALUES ('UPHC001', 'Rahul Sharma', 28, 'Male')")
    
    # Avoid duplicate inserts
    c.execute("SELECT COUNT(*) FROM visits WHERE patient_id='UPHC001'")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO visits (patient_id, hospital, date, diagnosis, notes) VALUES ('UPHC001','City General','2024-01-10','Hypertension', 'Regular checkup required')")
        c.execute("INSERT INTO visits (patient_id, hospital, date, diagnosis, notes) VALUES ('UPHC001','Heart Care Center','2024-05-12','Mild Arrhythmia', 'ECG done')")
        c.execute("INSERT INTO medications VALUES ('UPHC001','Amlodipine','5mg','Daily')")
        c.execute("INSERT INTO surgeries VALUES ('UPHC001','Appendectomy','2018')")

    conn.commit()
    conn.close()

def get_doctor(doc_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT * FROM doctors WHERE id=?", (doc_id,))
    doc = c.fetchone()
    conn.close()
    return doc

def get_patient_data(pid):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    c.execute("SELECT * FROM patients WHERE id=?", (pid,))
    patient = c.fetchone()
    
    if not patient:
        conn.close()
        return None
        
    c.execute("SELECT hospital, date, diagnosis, notes FROM visits WHERE patient_id=? ORDER BY date DESC", (pid,))
    visits = c.fetchall()
    
    c.execute("SELECT medicine, dosage, duration FROM medications WHERE patient_id=?", (pid,))
    meds = c.fetchall()
    
    c.execute("SELECT surgery, year FROM surgeries WHERE patient_id=? ORDER BY year DESC", (pid,))
    surgeries = c.fetchall()
    
    conn.close()
    
    return {
        "patient": {"id": patient[0], "name": patient[1], "age": patient[2], "gender": patient[3]},
        "visits": [{"hospital": v[0], "date": v[1], "diagnosis": v[2], "notes": v[3]} for v in visits],
        "medications": [{"medicine": m[0], "dosage": m[1], "duration": m[2]} for m in meds],
        "surgeries": [{"surgery": s[0], "year": s[1]} for s in surgeries]
    }

if __name__ == "__main__":
    init_db()
    print("Database Initialized Successfully.")
