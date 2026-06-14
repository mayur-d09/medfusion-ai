import streamlit as st
import requests
from pyzbar.pyzbar import decode
from PIL import Image
import pandas as pd

API_URL = "http://127.0.0.1:8000"

st.set_page_config(page_title="UPHC Dashboard", layout="wide", initial_sidebar_state="collapsed")

# Custom Apple-like CSS
st.markdown("""
<style>
body {
    background: #0b0f19;
    color: #ffffff;
}

.metric-card {
    background: rgba(255,255,255,0.05);
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 4px 30px rgba(0,0,0,0.3);
    backdrop-filter: blur(10px);
    transition: 0.3s;
}

.metric-card:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 40px rgba(0,0,0,0.5);
}

h1, h2, h3 {
    font-weight: 600;
    letter-spacing: -0.5px;
}
</style>
""", unsafe_allow_html=True)

# Session State for Login
if 'logged_in' not in st.session_state:
    st.session_state['logged_in'] = False

def login_screen():
    st.markdown("<h1 style='text-align: center;'>🏥 UPHC Provider Portal</h1>", unsafe_allow_html=True)
    col1, col2, col3 = st.columns([1,2,1])
    with col2:
        st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
        doc_id = st.text_input("Doctor ID", "DOC001")
        pwd = st.text_input("Password", "password123", type="password")
        if st.button("Login"):
            res = requests.post(f"{API_URL}/login", json={"doctor_id": doc_id, "password": pwd})
            if res.status_code == 200:
                st.session_state['logged_in'] = True
                st.session_state['doc_name'] = res.json()['name']
                st.rerun()
            else:
                st.error("Invalid Credentials")
        st.markdown("</div>", unsafe_allow_html=True)

def dashboard():
    st.title(f"Welcome, {st.session_state['doc_name']}")
    
    col_search, col_qr = st.columns([3, 1])
    with col_search:
        pid_input = st.text_input("🔍 Search Patient by UPHC ID")
    with col_qr:
        qr_file = st.file_uploader("📷 Scan QR", type=['png', 'jpg'])
    
    pid = None
    if qr_file:
        img = Image.open(qr_file)
        decoded = decode(img)
        if decoded:
            pid = decoded[0].data.decode("utf-8")
            st.success(f"QR Scanned: {pid}")
    elif pid_input:
        pid = pid_input

    if pid:
        with st.spinner("Fetching patient records..."):
            res = requests.get(f"{API_URL}/patient/{pid}")
            
        if res.status_code != 200:
            st.error("Patient not found in national registry.")
            return
            
        data = res.json()
        patient = data["patient"]
        
        # --- TOP HEADER ---
        st.markdown("---")
        colA, colB, colC = st.columns(3)
        colA.metric("Patient", patient["name"], f"{patient['age']} yrs • {patient['gender']}")
        colB.metric("UPHC ID", patient["id"])
        
        risk = data["risk_assessment"]
        colC.markdown(f"### {risk['color']} {risk['level']} ({risk['score']})")
        
        # --- AI SUMMARY ---
        st.markdown("<br>", unsafe_allow_html=True)
        st.info(data["ai_summary"], icon="🧠")
        
        # --- ALERTS ---
        for alert in data["alerts"]:
            if "⚠️" in alert:
                st.error(alert)
            else:
                st.success(alert)
                
        # --- TABS FOR TIMELINE ---
        st.markdown("<br>", unsafe_allow_html=True)
        tab1, tab2, tab3 = st.tabs(["📍 Visit Timeline", "💊 Medications", "🔪 Surgeries"])
        
        with tab1:
            if data["visits"]:
                df_visits = pd.DataFrame(data["visits"])
                st.dataframe(df_visits, use_container_width=True, hide_index=True)
            else:
                st.write("No recorded visits.")
                
        with tab2:
            if data["medications"]:
                for m in data["medications"]:
                    st.markdown(f"- **{m['medicine']}** - {m['dosage']} ({m['duration']})")
            else:
                st.write("No active medications.")
                
        with tab3:
            if data["surgeries"]:
                for s in data["surgeries"]:
                    st.markdown(f"- **{s['surgery']}** ({s['year']})")
            else:
                st.write("No surgical history.")

        # --- SMART QUERY ---
        st.markdown("<br><h3>🤖 Smart AI Query</h3>", unsafe_allow_html=True)
        query = st.text_input("Ask about patient history (e.g., 'What are the main risks?')")
        if query:
            with st.spinner("AI is thinking..."):
                res_q = requests.post(f"{API_URL}/patient/{pid}/query", json={"query": query})
                if res_q.status_code == 200:
                    st.write("**AI Response:**")
                    st.info(res_q.json().get("response", "No response"), icon="✨")
                else:
                    st.error("Error communicating with AI.")

if not st.session_state['logged_in']:
    login_screen()
else:
    if st.sidebar.button("Logout"):
        st.session_state['logged_in'] = False
        st.rerun()
    dashboard()
