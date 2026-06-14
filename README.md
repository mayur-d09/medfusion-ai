# MedFusion AI

MedFusion AI is a production-grade, state-of-the-art healthcare registry and patient intelligence system. It leverages advanced OCR and NLP technology via Google Gemini, dynamic patient analytics (CHCI care continuity and custom ML risk scoring models), secure QR-based patient history lookup, and automated PDF report generation.

---

## Features

- **Robust Patient Authentication & RBAC**: Dual-mode login for Healthcare Providers (Doctor/Admin) and Patients with JWT tokens and bcrypt password hashing.
- **Dynamic Patient Profiles & Risk Assessment**: Custom machine learning risk models (RandomForest) and care fragmentation analysis (CHCI index) built on patient visit histories.
- **Advanced OCR & NLP clinical Ingestion**: Automatically extract diagnoses, medications, surgeries, allergies, and vitals from uploaded medical scans (X-Rays, MRIs, PDFs).
- **Secure QR-Based Lookup**: Generate and resolve unique patient QR codes to access records securely on-the-go.
- **AI Smart Query System**: Query comprehensive patient longitudinal data via natural language.
- **Automated PDF Reports**: Generate base64-encoded clinical reports for offline verification and downloads.

---

## Tech Stack

- **Frontend**: Next.js 16 (React 19, TypeScript, Tailwind CSS, Lucide React, Axios)
- **Backend**: FastAPI (Python 3.10+, Uvicorn, Scikit-learn, Pandas, NumPy, Pypdf, Pyzbar, OpenCV)
- **Database**: MongoDB (Local or MongoDB Atlas)
- **AI/LLM**: Google Gemini (gemini-2.0-flash-lite / gemini-2.0-flash)
- **Deployment**: Vercel (Frontend), Render (Backend), MongoDB Atlas (Database)

---

## Project Structure

```
medfusion-ai/
├── MedFusionAI/
│   ├── backend/          # FastAPI backend services
│   ├── frontend/         # Next.js frontend web app
│   └── docker-compose.yml# Container orchestration file
├── .env.example          # Environment variables template
├── .gitignore            # Git exclusion rules
├── render.yaml           # Render blueprint spec
└── README.md             # Project documentation
```

---

## Installation & Local Setup

### Prerequisites
- Node.js v20+
- Python 3.10+
- MongoDB instance running locally (port 27017) or Atlas cloud account

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd MedFusionAI/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables template and configure it:
   ```bash
   cp ../../.env.example .env
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8001 --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd MedFusionAI/frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable Name | Description | Example/Value | Required |
| --- | --- | --- | --- |
| `MONGODB_URI` | MongoDB Connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/medfusion` | Yes |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `your-super-secure-jwt-secret-key` | Yes |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` | Yes |
| `CLOUDINARY_URL` | Cloudinary Storage Connection URL | `cloudinary://<api_key>:<api_secret>@<cloud_name>` | No (Falls back to local storage) |
| `NEXT_PUBLIC_API_URL` | Public backend server URL (Frontend build) | `https://medfusion-backend.onrender.com` | Yes (in production) |

---

## Production Deployment Instructions

### 1. Database Setup (MongoDB Atlas)
- Create a free cluster on MongoDB Atlas.
- Create a database user with read/write access.
- In Network Access, allow access from anywhere (`0.0.0.0/0`) to allow Vercel/Render servers to connect.
- Copy your connection string (`mongodb+srv://...`).

### 2. Backend Deployment (Render)
- Go to [Render](https://render.com) and create a **New Web Service**.
- Connect your GitHub repository (`mayur-d09/medfusion-ai`).
- Set the following configuration details:
  - **Root Directory**: `MedFusionAI/backend`
  - **Runtime**: `Python`
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Under **Advanced**, add the Environment Variables:
  - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
  - `JWT_SECRET`: `<Random security string>`
  - `GEMINI_API_KEY`: `<Your Google Gemini API Key>`
  - `CLOUDINARY_URL`: `<Optional Cloudinary connection string>`
- Click **Deploy Web Service** and note down the generated URL (e.g. `https://medfusion-backend.onrender.com`).

### 3. Frontend Deployment (Vercel)
- Go to [Vercel](https://vercel.com) and import your repository.
- Configure the deployment settings:
  - **Framework Preset**: `Next.js`
  - **Root Directory**: `MedFusionAI/frontend`
- Add the Environment Variables:
  - `NEXT_PUBLIC_API_URL`: `<Your Render Backend Service URL>` (without trailing slash)
- Click **Deploy**. Vercel will build and serve your Next.js application.
