"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, Activity, AlertCircle, Pill, Scissors, Calendar, 
  Phone, Heart, FileText, MessageSquare, Download, Printer,
  Droplets, AlertTriangle, Clock, User, QrCode, Shield,
  ImageIcon, FolderOpen, UploadCloud, Eye, Archive
} from 'lucide-react'
import axios from 'axios'

export default function PatientProfile() {
  const router = useRouter()
  const params = useParams()
  const [patientData, setPatientData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [query, setQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [userRole, setUserRole] = useState('patient')

  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // New entry states for manual additions
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [visitHospital, setVisitHospital] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [visitDiagnosis, setVisitDiagnosis] = useState('')
  const [visitNotes, setVisitNotes] = useState('')
  const [addVisitLoading, setAddVisitLoading] = useState(false)

  const [showAddMedication, setShowAddMedication] = useState(false)
  const [medName, setMedName] = useState('')
  const [medDosage, setMedDosage] = useState('')
  const [medDuration, setMedDuration] = useState('')
  const [addMedLoading, setAddMedLoading] = useState(false)

  const [showAddSurgery, setShowAddSurgery] = useState(false)
  const [surgName, setSurgName] = useState('')
  const [surgYear, setSurgYear] = useState('')
  const [surgNotes, setSurgNotes] = useState('')
  const [addSurgLoading, setAddSurgLoading] = useState(false)

  const [showAddTimeline, setShowAddTimeline] = useState(false)
  const [timeType, setTimeType] = useState('checkup')
  const [timeTitle, setTimeTitle] = useState('')
  const [timeDesc, setTimeDesc] = useState('')
  const [timeDate, setTimeDate] = useState('')
  const [addTimeLoading, setAddTimeLoading] = useState(false)

  // Archive upload states
  const [archiveFile, setArchiveFile] = useState<File | null>(null)
  const [archiveCategory, setArchiveCategory] = useState('x_ray')
  const [archiveUploading, setArchiveUploading] = useState(false)
  const [archiveSuccess, setArchiveSuccess] = useState(false)
  const [archiveError, setArchiveError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role') || 'patient'
    const loginId = localStorage.getItem('loginId')
    
    if (!token) {
      router.push('/')
      return
    }
    
    setUserRole(role)
    
    // RBAC: Patients can only access their own page
    if (role === 'patient' && params.id && (params.id as string).toUpperCase() !== loginId) {
      router.push(`/patient/${loginId}`)
      return
    }
    
    if (params.id) {
      fetchPatient(params.id as string)
    }
  }, [params.id, router])

  const fetchPatient = async (pid: string) => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const res = await axios.get(`${baseUrl}/api/patients/${pid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setPatientData(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Patient not found')
    } finally {
      setLoading(false)
    }
  }

  const handleSmartQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query || !patientData) return
    setQueryLoading(true)
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const res = await axios.post(`${baseUrl}/api/patients/${patientData.patient.id}/query`, {
        query: query
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setAiResponse(res.data.response)
    } catch (err: any) {
      setAiResponse(err.response?.data?.detail || 'Failed to get AI response')
    } finally {
      setQueryLoading(false)
    }
  }

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !patientData) return
    setUploadLoading(true)
    setUploadSuccess(false)
    setUploadError('')
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const formData = new FormData()
      formData.append('file', file)
      await axios.post(
        `${baseUrl}/api/patients/${patientData.patient.id}/upload-report`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      )
      setUploadSuccess(true)
      await fetchPatient(patientData.patient.id)
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload report')
    } finally {
      setUploadLoading(false)
    }
  }

  const goToQR = () => {
    router.push(`/qr?id=${patientData.patient.id}`)
  }

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!visitHospital || !visitDiagnosis || !visitDate) return
    setAddVisitLoading(true)
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      await axios.post(`${baseUrl}/api/patients/${patientData.patient.id}/visit`, {
        hospital: visitHospital,
        date: visitDate,
        diagnosis: visitDiagnosis,
        notes: visitNotes
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setVisitHospital('')
      setVisitDate('')
      setVisitDiagnosis('')
      setVisitNotes('')
      setShowAddVisit(false)
      await fetchPatient(patientData.patient.id)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add visit')
    } finally {
      setAddVisitLoading(false)
    }
  }

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medName || !medDosage || !medDuration) return
    setAddMedLoading(true)
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      await axios.post(`${baseUrl}/api/patients/${patientData.patient.id}/medication`, {
        medicine: medName,
        dosage: medDosage,
        duration: medDuration
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setMedName('')
      setMedDosage('')
      setMedDuration('')
      setShowAddMedication(false)
      await fetchPatient(patientData.patient.id)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add medication')
    } finally {
      setAddMedLoading(false)
    }
  }

  const handleAddSurgery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!surgName || !surgYear) return
    setAddSurgLoading(true)
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      await axios.post(`${baseUrl}/api/patients/${patientData.patient.id}/surgery`, {
        surgery: surgName,
        year: surgYear,
        notes: surgNotes
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSurgName('')
      setSurgYear('')
      setSurgNotes('')
      setShowAddSurgery(false)
      await fetchPatient(patientData.patient.id)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add surgery')
    } finally {
      setAddSurgLoading(false)
    }
  }

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeTitle || !timeDate) return
    setAddTimeLoading(true)
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      await axios.post(`${baseUrl}/api/patients/${patientData.patient.id}/timeline`, {
        event_type: timeType,
        title: timeTitle,
        description: timeDesc,
        date: timeDate
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setTimeType('checkup')
      setTimeTitle('')
      setTimeDesc('')
      setTimeDate('')
      setShowAddTimeline(false)
      await fetchPatient(patientData.patient.id)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add timeline event')
    } finally {
      setAddTimeLoading(false)
    }
  }

  const handleArchiveUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!archiveFile || !patientData) return
    setArchiveUploading(true)
    setArchiveSuccess(false)
    setArchiveError('')
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const formData = new FormData()
      formData.append('file', archiveFile)
      formData.append('category', archiveCategory)
      await axios.post(
        `${baseUrl}/api/patients/${patientData.patient.id}/archive-upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } }
      )
      setArchiveSuccess(true)
      setArchiveFile(null)
      await fetchPatient(patientData.patient.id)
    } catch (err: any) {
      setArchiveError(err.response?.data?.detail || 'Archive upload failed')
    } finally {
      setArchiveUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading patient data...</div>
      </div>
    )
  }

  if (error || !patientData) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Patient Not Found</h2>
        <p className="text-gray-400 mb-6">{error || 'Unable to load patient data'}</p>
        <button onClick={() => router.push(userRole === 'patient' ? '/' : '/dashboard')} className="btn-primary flex items-center gap-2">
          <ArrowLeft size={20} /> Back
        </button>
      </div>
    )
  }

  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const res = await axios.get(`${baseUrl}/api/patients/${patientData.patient.id}/report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${res.data.pdf_content}`
      link.download = res.data.filename
      link.click()
    } catch (err) {
      alert('Failed to generate report')
    }
  }

  const { patient, risk_assessment, ai_summary, chci, timeline_insights, doctor_brief } = patientData

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0c] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {userRole !== 'patient' && (
              <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold">{patient.name}</h1>
              <p className="text-gray-400 text-sm">{patient.id} • {patient.age} yrs • {patient.gender}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleDownloadReport} className="btn-primary flex items-center gap-2">
              <Download size={18} /> Download Report
            </button>
            {userRole !== 'patient' ? (
              <button onClick={goToQR} className="btn-secondary flex items-center gap-2">
                <QrCode size={18} /> View QR
              </button>
            ) : (
              <button onClick={() => { localStorage.clear(); router.push('/'); }} className="btn-secondary flex items-center gap-2">
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Risk & CHCI Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className={`glass-card p-6 border-l-4 ${
            risk_assessment.color === 'red' ? 'border-l-red-500' :
            risk_assessment.color === 'yellow' ? 'border-l-yellow-500' : 'border-l-green-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Activity size={20} /> Risk Assessment
                </h3>
                <p className="text-gray-400">
                  Level: <span className={
                    risk_assessment.color === 'red' ? 'text-red-400' :
                    risk_assessment.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
                  }>{risk_assessment.level}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">{risk_assessment.score}%</p>
                <p className="text-gray-400 text-sm">Risk Score</p>
              </div>
            </div>
          </div>

          <div className={`glass-card p-6 border-l-4 ${
            chci.color === 'red' ? 'border-l-red-500' :
            chci.color === 'yellow' ? 'border-l-yellow-500' : 'border-l-green-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Shield size={20} /> Continuity Index (CHCI)
                </h3>
                <p className="text-gray-400">
                  Status: <span className={
                    chci.color === 'red' ? 'text-red-400' :
                    chci.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
                  }>{chci.status}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">{chci.score}</p>
                <p className="text-gray-400 text-sm">Unique Hospitals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Intelligence Insights */}
        {timeline_insights && timeline_insights.length > 0 && (
          <div className="glass-card p-6 mb-6 border-l-4 border-l-blue-500">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-400" /> Timeline Intelligence Engine
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timeline_insights.map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                  <div className="mt-1"><AlertCircle size={16} className="text-blue-400" /></div>
                  <p className="text-sm text-gray-300">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 flex items-center gap-4">
            <Droplets size={24} className="text-red-400" />
            <div>
              <p className="text-gray-400 text-sm">Blood Type</p>
              <p className="text-xl font-bold">{patient.blood_type || 'N/A'}</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <AlertTriangle size={24} className="text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">Allergies</p>
              <p className="text-xl font-bold">{patient.allergies || 'None'}</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <Phone size={24} className="text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Emergency</p>
              <p className="text-xl font-bold text-sm">{patient.emergency_contact || 'N/A'}</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <Heart size={24} className="text-pink-400" />
            <div>
              <p className="text-gray-400 text-sm">Conditions</p>
              <p className="text-xl font-bold">{patient.visits.length} Visits</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 overflow-x-auto">
          {['overview', 'visits', 'medications', 'surgeries', 'timeline', 'reports', 'archive'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 font-medium capitalize transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'archive' && <Archive size={15} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Smart Doctor Brief */}
            <div className="glass-card p-6 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-400 p-1 rounded">📋</span> Smart Doctor Brief
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
                <div>
                  <p className="font-semibold text-white mb-1">Major Conditions:</p>
                  <p className="mb-3">{doctor_brief?.major_conditions?.join(', ') || 'None'}</p>
                  
                  <p className="font-semibold text-white mb-1">Current Medications:</p>
                  <p className="mb-3">
                    {doctor_brief?.current_medications?.length > 0 
                      ? doctor_brief.current_medications.map((m: any) => `${m.medicine} (${m.dosage})`).join(', ') 
                      : 'None'}
                  </p>
                  
                  <p className="font-semibold text-white mb-1">Allergies:</p>
                  <p className="mb-3">{doctor_brief?.allergies || 'None'}</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Surgeries:</p>
                  <p className="mb-3">
                    {doctor_brief?.surgeries?.length > 0 
                      ? doctor_brief.surgeries.map((s: any) => `${s.surgery} (${s.year})`).join(', ') 
                      : 'None'}
                  </p>
                  
                  <p className="font-semibold text-white mb-1">Recent Findings:</p>
                  <ul className="list-disc list-inside mb-3 space-y-1">
                    {doctor_brief?.recent_findings?.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    )) || <li>No recent findings</li>}
                  </ul>
                  
                  <p className="font-semibold text-white mb-1">Last Admission/Visit:</p>
                  <p className="mb-3">{doctor_brief?.last_admission || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="glass-card p-6 border-l-4 border-l-purple-500">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="bg-purple-500/20 text-purple-400 p-1 rounded">✨</span> GenAI Clinical Summary
              </h3>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {typeof ai_summary === 'string' ? ai_summary : ai_summary?.summary || 'No summary available'}
              </div>
            </div>

            {/* Smart Query */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-400" /> Smart AI Query
              </h3>
              <form onSubmit={handleSmartQuery} className="flex gap-4 mb-4">
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ask any question about this patient's history..."
                  className="flex-1 bg-[#111113] border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button type="submit" disabled={queryLoading} className="bg-blue-600 text-white px-6 rounded-xl font-medium hover:bg-blue-500 transition-colors disabled:opacity-50">
                  {queryLoading ? 'Thinking...' : 'Ask AI'}
                </button>
              </form>
              {aiResponse && (
                <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl text-gray-200">
                  <strong>AI Response:</strong> <br/>{aiResponse}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar size={20} className="text-blue-400" /> Visit History
              </h3>
              {userRole !== 'patient' && (
                <button 
                  onClick={() => setShowAddVisit(!showAddVisit)} 
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                >
                  {showAddVisit ? 'Cancel' : '+ Add Visit'}
                </button>
              )}
            </div>

            {showAddVisit && (
              <form onSubmit={handleAddVisit} className="mb-6 p-4 bg-white/5 border border-gray-800 rounded-xl space-y-4">
                <h4 className="font-semibold text-white">Add New Visit Record</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Hospital</label>
                    <input 
                      type="text" 
                      value={visitHospital} 
                      onChange={e => setVisitHospital(e.target.value)} 
                      required 
                      placeholder="e.g. City General" 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Diagnosis</label>
                    <input 
                      type="text" 
                      value={visitDiagnosis} 
                      onChange={e => setVisitDiagnosis(e.target.value)} 
                      required 
                      placeholder="e.g. Hypertension" 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Date</label>
                    <input 
                      type="date" 
                      value={visitDate} 
                      onChange={e => setVisitDate(e.target.value)} 
                      required 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Notes</label>
                  <textarea 
                    value={visitNotes} 
                    onChange={e => setVisitNotes(e.target.value)} 
                    placeholder="Enter visit details, vitals, or remarks..." 
                    className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-full h-20"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddVisit(false)} 
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={addVisitLoading} 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {addVisitLoading ? 'Adding...' : 'Save Visit'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {patient.visits && patient.visits.length > 0 ? (
                patient.visits.map((visit: any, i: number) => (
                  <div key={i} className="p-4 bg-[#111113] rounded-xl border border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white">{visit.diagnosis}</h4>
                      <span className="text-gray-400 text-sm">{visit.date}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{visit.hospital}</p>
                    {visit.notes && <p className="text-gray-300 mt-2 text-sm">{visit.notes}</p>}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No visit history available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Pill size={20} className="text-green-400" /> Active Medications
              </h3>
              {userRole !== 'patient' && (
                <button 
                  onClick={() => setShowAddMedication(!showAddMedication)} 
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                >
                  {showAddMedication ? 'Cancel' : '+ Add Medication'}
                </button>
              )}
            </div>

            {showAddMedication && (
              <form onSubmit={handleAddMedication} className="mb-6 p-4 bg-white/5 border border-gray-800 rounded-xl space-y-4">
                <h4 className="font-semibold text-white">Add New Medication</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Medicine Name</label>
                    <input 
                      type="text" 
                      value={medName} 
                      onChange={e => setMedName(e.target.value)} 
                      required 
                      placeholder="e.g. Metformin" 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Dosage</label>
                    <input 
                      type="text" 
                      value={medDosage} 
                      onChange={e => setMedDosage(e.target.value)} 
                      required 
                      placeholder="e.g. 500mg twice daily" 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Duration / Frequency</label>
                    <input 
                      type="text" 
                      value={medDuration} 
                      onChange={e => setMedDuration(e.target.value)} 
                      required 
                      placeholder="e.g. Daily / 3 Months" 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500 w-full"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddMedication(false)} 
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={addMedLoading} 
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {addMedLoading ? 'Adding...' : 'Save Medication'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {patient.medications && patient.medications.length > 0 ? (
                patient.medications.map((med: any, i: number) => (
                  <div key={i} className="p-4 bg-[#111113] rounded-xl border border-gray-800 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-white">{med.medicine}</h4>
                      <p className="text-gray-400 text-sm">{med.dosage}</p>
                    </div>
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">{med.duration}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No active medications</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'surgeries' && (
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Scissors size={20} className="text-red-400" /> Surgical History
              </h3>
              {userRole !== 'patient' && (
                <button 
                  onClick={() => setShowAddSurgery(!showAddSurgery)} 
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                >
                  {showAddSurgery ? 'Cancel' : '+ Add Surgery'}
                </button>
              )}
            </div>

            {showAddSurgery && (
              <form onSubmit={handleAddSurgery} className="mb-6 p-4 bg-white/5 border border-gray-800 rounded-xl space-y-4">
                <h4 className="font-semibold text-white">Add New Surgery Record</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Surgery Name</label>
                    <input 
                      type="text" 
                      value={surgName} 
                      onChange={e => setSurgName(e.target.value)} 
                      required 
                      placeholder="e.g. Appendectomy" 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Year</label>
                    <input 
                      type="text" 
                      value={surgYear} 
                      onChange={e => setSurgYear(e.target.value)} 
                      required 
                      placeholder="e.g. 2021" 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Notes</label>
                  <textarea 
                    value={surgNotes} 
                    onChange={e => setSurgNotes(e.target.value)} 
                    placeholder="Enter details, complications, or findings..." 
                    className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 w-full h-20"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddSurgery(false)} 
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={addSurgLoading} 
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {addSurgLoading ? 'Adding...' : 'Save Surgery'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {patient.surgeries && patient.surgeries.length > 0 ? (
                patient.surgeries.map((surgery: any, i: number) => (
                  <div key={i} className="p-4 bg-[#111113] rounded-xl border border-gray-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">{surgery.surgery}</h4>
                        {surgery.notes && <p className="text-gray-400 text-sm mt-1">{surgery.notes}</p>}
                      </div>
                      <span className="text-gray-400">{surgery.year}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No surgical history</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock size={20} className="text-purple-400" /> Medical Timeline
              </h3>
              {userRole !== 'patient' && (
                <button 
                  onClick={() => setShowAddTimeline(!showAddTimeline)} 
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                >
                  {showAddTimeline ? 'Cancel' : '+ Add Timeline Event'}
                </button>
              )}
            </div>

            {showAddTimeline && (
              <form onSubmit={handleAddTimeline} className="mb-6 p-4 bg-white/5 border border-gray-800 rounded-xl space-y-4">
                <h4 className="font-semibold text-white">Add New Timeline Event</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Event Type</label>
                    <select 
                      value={timeType} 
                      onChange={e => setTimeType(e.target.value)} 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 w-full"
                    >
                      <option value="checkup">Checkup</option>
                      <option value="visit">Visit</option>
                      <option value="medication">Medication</option>
                      <option value="surgery">Surgery</option>
                      <option value="lab_test">Lab Test</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Title</label>
                    <input 
                      type="text" 
                      value={timeTitle} 
                      onChange={e => setTimeTitle(e.target.value)} 
                      required 
                      placeholder="e.g. Hypertension Diagnosis" 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Date</label>
                    <input 
                      type="date" 
                      value={timeDate} 
                      onChange={e => setTimeDate(e.target.value)} 
                      required 
                      className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Description</label>
                  <textarea 
                    value={timeDesc} 
                    onChange={e => setTimeDesc(e.target.value)} 
                    placeholder="Enter event details or description..." 
                    className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 w-full h-20"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddTimeline(false)} 
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={addTimeLoading} 
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {addTimeLoading ? 'Adding...' : 'Save Event'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {patient.timelines && patient.timelines.length > 0 ? (
                patient.timelines.map((event: any, i: number) => (
                  <div key={i} className="flex gap-4 p-4 bg-[#111113] rounded-xl border border-gray-800">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-white">{event.title}</h4>
                        <span className="text-gray-400 text-sm">{event.date}</span>
                      </div>
                      <p className="text-gray-400 text-sm capitalize">{event.event_type}</p>
                      {event.description && <p className="text-gray-300 mt-1">{event.description}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No timeline events</p>
              )}
            </div>
          </div>
        )}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Upload Report Uploader */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="bg-green-500/20 text-green-400 p-1 rounded">📤</span> Ingest Clinical Report
              </h3>
              <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center hover:border-blue-500 transition-colors relative">
                <input 
                  type="file" 
                  accept=".pdf,image/png,image/jpeg,image/jpg" 
                  onChange={handleReportUpload}
                  disabled={uploadLoading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Select or drag clinical report file here</p>
                  <p className="text-xs text-gray-500">Supports: PDF, PNG, JPG, JPEG • Max 10MB</p>
                </div>
              </div>
              {uploadLoading && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 flex items-center gap-2 justify-center">
                  <span className="animate-spin">🌀</span> Ingesting report (running OCR and medical entity extraction)...
                </div>
              )}
              {uploadSuccess && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-center font-medium">
                  Report uploaded and processed successfully! Records and timeline have been updated.
                </div>
              )}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center font-medium">
                  {uploadError}
                </div>
              )}
            </div>

            {/* List of Reports */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Ingested Reports History</h3>
              <div className="space-y-4">
                {patient.reports && patient.reports.length > 0 ? (
                  patient.reports.map((rep: any, idx: number) => (
                    <div key={idx} className="p-4 bg-[#111113] rounded-xl border border-gray-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-white">{rep.filename}</h4>
                        <span className="text-gray-400 text-xs">{new Date(rep.upload_date).toLocaleString()}</span>
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        <p className="font-semibold text-white mb-1">Extracted Vitals & Details:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {rep.structured_data?.blood_pressure && <li>Blood Pressure: {rep.structured_data.blood_pressure}</li>}
                          {rep.structured_data?.glucose && <li>Glucose: {rep.structured_data.glucose} mg/dL</li>}
                          {rep.structured_data?.cholesterol && <li>Cholesterol: {rep.structured_data.cholesterol} mg/dL</li>}
                          {rep.structured_data?.diagnoses?.length > 0 && <li>Extracted Diagnoses: {rep.structured_data.diagnoses.join(', ')}</li>}
                          {rep.structured_data?.medications?.length > 0 && <li>Extracted Medications: {rep.structured_data.medications.map((m: any) => `${m.medicine} (${m.dosage})`).join(', ')}</li>}
                        </ul>
                      </div>

                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium">View Raw Transcribed OCR Text</summary>
                        <div className="mt-2 p-3 bg-black/40 rounded border border-gray-900 font-mono text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {rep.raw_text}
                        </div>
                      </details>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No reports uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================== ARCHIVE TAB ======================== */}
        {activeTab === 'archive' && (() => {
          const archiveItems: any[] = patientData?.patient?.archive || []
          const imagingItems = archiveItems.filter((a: any) => a.section === 'imaging')
          const clinicalItems = archiveItems.filter((a: any) => a.section === 'clinical_document')

          const IMAGING_CATEGORIES = [
            { value: 'x_ray', label: '🩻 X-Ray' },
            { value: 'mri', label: '🧠 MRI' },
            { value: 'ct_scan', label: '🔬 CT Scan' },
            { value: 'ultrasound', label: '📡 Ultrasound' },
          ]
          const CLINICAL_CATEGORIES = [
            { value: 'prescription', label: '💊 Prescription' },
            { value: 'blood_report', label: '🩸 Blood Report' },
            { value: 'lab_report', label: '🧪 Lab Report' },
            { value: 'discharge_summary', label: '📋 Discharge Summary' },
            { value: 'other_report', label: '📄 Other Report' },
          ]
          const ALL_CATEGORIES = [...IMAGING_CATEGORIES, ...CLINICAL_CATEGORIES]

          const getCategoryLabel = (val: string) =>
            ALL_CATEGORIES.find(c => c.value === val)?.label || val

          const ArchiveFileCard = ({ item }: { item: any }) => {
            const isImaging = item.section === 'imaging';
            const ocrFailed = !item.ocr_text || item.ocr_text.trim() === "" || item.ocr_text.toLowerCase().includes("ocr extraction failed");

            if (isImaging) {
              return (
                <div className="p-4 bg-[#111113] rounded-xl border border-gray-800 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white text-sm truncate max-w-xs" title={item.filename}>{item.filename}</p>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full mt-1 inline-block">{getCategoryLabel(item.category)}</span>
                    </div>
                    <span className="text-gray-500 text-xs whitespace-nowrap ml-3">{item.upload_date}</span>
                  </div>
                  {item.uploader && (
                    <p className="text-xs text-gray-400">👤 Uploader: <span className="text-white">{item.uploader}</span></p>
                  )}
                  {!ocrFailed && item.ocr_text && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-purple-400 hover:text-purple-300">View OCR Text</summary>
                      <div className="mt-2 p-2 bg-black/40 rounded border border-gray-900 font-mono text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">{item.ocr_text}</div>
                    </details>
                  )}
                  {item.extracted_entities?.findings && item.extracted_entities.findings.length > 0 ? (
                    <div className="text-xs text-gray-400">
                      <p className="font-semibold text-white mb-1">🔍 Extracted Findings:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                        {item.extracted_entities.findings.map((f: string, i: number) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ) : item.extracted_entities?.diagnoses && item.extracted_entities.diagnoses.length > 0 ? (
                    <div className="text-xs text-gray-400">
                      <p className="font-semibold text-white mb-1">🔍 Extracted Findings:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                        {item.extracted_entities.diagnoses.map((d: string, i: number) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    ocrFailed && (
                      <p className="text-xs text-red-400 italic">No structured findings extracted.</p>
                    )
                  )}
                  <div className="flex gap-2 mt-1">
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye size={13} /> View
                    </a>
                    <a
                      href={item.file_url}
                      download={item.filename}
                      className="flex items-center gap-1 text-xs bg-green-600/20 hover:bg-green-600/40 text-green-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Download size={13} /> Download
                    </a>
                  </div>
                </div>
              );
            }

            return (
              <div className="p-4 bg-[#111113] rounded-xl border border-gray-800 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-white text-sm truncate max-w-xs" title={item.filename}>{item.filename}</p>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full mt-1 inline-block">{getCategoryLabel(item.category)}</span>
                  </div>
                  <span className="text-gray-500 text-xs whitespace-nowrap ml-3">{item.upload_date}</span>
                </div>
                {item.uploader && (
                  <p className="text-xs text-gray-400">👤 Uploader: <span className="text-white">{item.uploader}</span></p>
                )}
                {item.extracted_entities?.blood_pressure && (
                  <p className="text-xs text-gray-400">🩺 BP: <span className="text-white">{item.extracted_entities.blood_pressure}</span></p>
                )}
                {item.extracted_entities?.glucose && (
                  <p className="text-xs text-gray-400">🩸 Glucose: <span className="text-white">{item.extracted_entities.glucose} mg/dL</span></p>
                )}
                {item.ocr_text && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-purple-400 hover:text-purple-300">View OCR Text</summary>
                    <div className="mt-2 p-2 bg-black/40 rounded border border-gray-900 font-mono text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">{item.ocr_text}</div>
                  </details>
                )}
                <div className="flex gap-2 mt-1">
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Eye size={13} /> View
                  </a>
                  <a
                    href={item.file_url}
                    download={item.filename}
                    className="flex items-center gap-1 text-xs bg-green-600/20 hover:bg-green-600/40 text-green-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download size={13} /> Download
                  </a>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {/* Upload Form */}
              <div className="glass-card p-6 border-l-4 border-l-cyan-500">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UploadCloud size={20} className="text-cyan-400" /> Upload to Medical Archive
                </h3>
                <form onSubmit={handleArchiveUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Category *</label>
                      <select
                        value={archiveCategory}
                        onChange={e => setArchiveCategory(e.target.value)}
                        className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500 w-full"
                      >
                        <optgroup label="🩻 Medical Imaging">
                          {IMAGING_CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="📁 Clinical Documents">
                          {CLINICAL_CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">File (PDF, PNG, JPG) *</label>
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg"
                        onChange={e => { setArchiveFile(e.target.files?.[0] || null); setArchiveSuccess(false); setArchiveError('') }}
                        className="bg-[#111113] border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500 w-full file:mr-3 file:bg-cyan-600 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:cursor-pointer"
                      />
                    </div>
                  </div>
                  {archiveFile && (
                    <p className="text-xs text-gray-400">Selected: <span className="text-white">{archiveFile.name}</span> ({(archiveFile.size / 1024).toFixed(1)} KB)</p>
                  )}
                  {archiveSuccess && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm font-medium">
                      ✅ File archived successfully with OCR processing complete.
                    </div>
                  )}
                  {archiveError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      ❌ {archiveError}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={archiveUploading || !archiveFile}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {archiveUploading ? <><span className="animate-spin">🌀</span> Uploading & OCR...</> : <><UploadCloud size={16} /> Upload to Archive</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* Medical Imaging Section */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon size={20} className="text-blue-400" /> Medical Imaging
                  <span className="ml-auto text-sm font-normal text-gray-500">{imagingItems.length} file{imagingItems.length !== 1 ? 's' : ''}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imagingItems.length > 0 ? (
                    imagingItems.map((item: any) => <ArchiveFileCard key={item.id} item={item} />)
                  ) : (
                    <div className="col-span-3 text-center py-10">
                      <ImageIcon size={40} className="text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No imaging files archived yet.</p>
                      <p className="text-gray-600 text-xs mt-1">Upload X-Ray, MRI, CT Scan or Ultrasound files above.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Documents Section */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FolderOpen size={20} className="text-yellow-400" /> Clinical Documents
                  <span className="ml-auto text-sm font-normal text-gray-500">{clinicalItems.length} file{clinicalItems.length !== 1 ? 's' : ''}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clinicalItems.length > 0 ? (
                    clinicalItems.map((item: any) => <ArchiveFileCard key={item.id} item={item} />)
                  ) : (
                    <div className="col-span-3 text-center py-10">
                      <FolderOpen size={40} className="text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No clinical documents archived yet.</p>
                      <p className="text-gray-600 text-xs mt-1">Upload prescriptions, lab reports, discharge summaries, etc.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
