"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Activity, AlertCircle, Pill, Scissors, MessageSquare, LogOut, Upload, UserPlus, QrCode } from 'lucide-react'
import axios from 'axios'

export default function Dashboard() {
  const router = useRouter()
  const [docName, setDocName] = useState('Doctor')
  const [searchId, setSearchId] = useState('UPHC-DEMO01')
  const [loading, setLoading] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const [patientData, setPatientData] = useState<any>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || (role !== 'doctor' && role !== 'admin')) {
      router.push('/')
      return
    }
    const name = localStorage.getItem('docName')
    if (name) setDocName(name)
  }, [router])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const res = await axios.get(`${baseUrl}/api/patients/${searchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setPatientData(res.data)
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.clear()
        router.push('/')
      } else {
        setError(err.response?.data?.detail || 'Patient not found in registry.')
      }
      setPatientData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSmartQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return
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
      setAiResponse(err.response?.data?.detail || 'Failed to get AI response.')
    } finally {
      setQueryLoading(false)
    }
  }

  const handleQRScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const formData = new FormData()
      formData.append('file', file)
      const resScan = await axios.post(`${baseUrl}/api/patients/scan-qr`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })
      const pid = resScan.data.patient_id
      setSearchId(pid)
      
      const resSearch = await axios.get(`${baseUrl}/api/patients/${pid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setPatientData(resSearch.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to scan QR code')
      setPatientData(null)
    } finally {
      setScanLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const goToCreatePatient = () => router.push('/create-patient')
  const goToQR = () => router.push('/qr')
  const goToUpload = () => router.push('/upload')
  const goToPatient = () => {
    if (patientData) {
      router.push(`/patient/${patientData.patient.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800 bg-[#0a0a0c] p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <Activity className="text-blue-500" size={32} />
            <h2 className="text-xl font-bold tracking-tight">MedFusion</h2>
          </div>
          <div className="space-y-4 text-gray-400">
            <button className="flex items-center gap-3 text-white bg-blue-600/10 w-full p-3 rounded-lg border border-blue-500/20">
              <Search size={20} />
              <span className="font-medium">Patient Lookup</span>
            </button>
            <button onClick={goToCreatePatient} className="flex items-center gap-3 hover:text-white w-full p-3 rounded-lg transition-colors">
              <UserPlus size={20} />
              <span className="font-medium">New Patient</span>
            </button>
            <button onClick={goToUpload} className="flex items-center gap-3 hover:text-white w-full p-3 rounded-lg transition-colors">
              <Upload size={20} />
              <span className="font-medium">Upload Scans</span>
            </button>
            <button onClick={goToQR} className="flex items-center gap-3 hover:text-white w-full p-3 rounded-lg transition-colors">
<QrCode size={20} />
              <span className="font-medium">QR Codes</span>
            </button>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 text-gray-400 hover:text-red-400 p-3 transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold">Welcome, {docName}</h1>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
            {docName.charAt(4) || 'D'}
          </div>
        </header>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder="Enter UPHC ID (e.g. UPHC-DEMO01)"
              className="w-full bg-[#111113] border border-gray-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-colors text-lg"
            />
          </div>
          <button type="submit" disabled={loading} className="bg-white text-black px-8 rounded-2xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50">
            {loading ? 'Searching...' : 'Search'}
          </button>
          <label className="bg-blue-600 text-white px-6 rounded-2xl font-semibold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 cursor-pointer transition-all">
            <QrCode size={20} />
            <span>{scanLoading ? 'Scanning...' : 'Scan QR'}</span>
            <input type="file" accept="image/*" onChange={handleQRScan} className="hidden" />
          </label>
        </form>

        {error && <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 mb-8">{error}</div>}

        {patientData && (
          <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 flex items-center gap-6 cursor-pointer hover:border-blue-500 transition-colors" onClick={goToPatient}>
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold">
                  {patientData.patient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{patientData.patient.name}</h2>
                  <p className="text-gray-400">{patientData.patient.id}</p>
                  <p className="text-gray-400 text-sm">{patientData.patient.age} yrs • {patientData.patient.gender}</p>
                </div>
              </div>

              <div className="glass-card p-6 flex flex-col justify-center">
                <h3 className="text-gray-400 font-medium mb-2 flex items-center gap-2"><Activity size={18} /> Predicted Risk Score</h3>
                <div className="flex items-end gap-3">
                  <span className={`text-4xl font-bold ${
                    patientData.risk_assessment.color === 'red' ? 'text-red-500' : 
                    patientData.risk_assessment.color === 'yellow' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {patientData.risk_assessment.score}%
                  </span>
                  <span className="mb-1 text-gray-300 font-medium">{patientData.risk_assessment.level}</span>
                </div>
              </div>

              <div className="glass-card p-6 flex flex-col justify-center">
                <h3 className="text-gray-400 font-medium mb-2 flex items-center gap-2"><AlertCircle size={18} /> Record Summary</h3>
                <div className="flex gap-4">
                  <div><span className="text-2xl font-bold text-white">{patientData.patient.visits.length}</span> <span className="text-gray-400 text-sm">Visits</span></div>
                  <div><span className="text-2xl font-bold text-white">{patientData.patient.medications.length}</span> <span className="text-gray-400 text-sm">Meds</span></div>
                  <div><span className="text-2xl font-bold text-white">{patientData.patient.surgeries.length}</span> <span className="text-gray-400 text-sm">Surg</span></div>
                </div>
              </div>
            </div>

{/* AI Summary */}
            <div className="glass-card p-6 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-400 p-1 rounded">✨</span> GenAI Clinical Summary
              </h3>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {typeof patientData.ai_summary === 'string' ? patientData.ai_summary : patientData.ai_summary?.summary || 'No summary available'}
              </div>
            </div>

            {/* Smart Query */}
            <div className="glass-card p-6">
               <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-purple-400" /> Smart AI Query
              </h3>
              <form onSubmit={handleSmartQuery} className="flex gap-4 mb-4">
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ask any question about this patient's history..."
                  className="flex-1 bg-[#111113] border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button type="submit" disabled={queryLoading} className="bg-purple-600 text-white px-6 rounded-xl font-medium hover:bg-purple-500 transition-colors disabled:opacity-50">
                  {queryLoading ? 'Thinking...' : 'Ask AI'}
                </button>
              </form>
              {aiResponse && (
                <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl text-gray-200">
                  <strong>AI Response:</strong> <br/>{aiResponse}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
              <button onClick={goToPatient} className="btn-secondary flex items-center gap-2">
                <User size={18} /> Full Profile
              </button>
              <button onClick={() => router.push(`/qr?id=${patientData.patient.id}`)} className="btn-secondary flex items-center gap-2">
<QrCode size={18} /> View QR
              </button>
            </div>

            {/* Timelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Pill size={20} className="text-green-400"/> Active Medications</h3>
                <div className="space-y-4">
                  {patientData.patient.medications.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-[#111113] rounded-xl border border-gray-800">
                      <div>
                        <p className="font-medium text-white">{m.medicine}</p>
                        <p className="text-sm text-gray-400">{m.dosage}</p>
                      </div>
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-md">{m.duration}</span>
                    </div>
                  ))}
                  {patientData.patient.medications.length === 0 && <p className="text-gray-500">No active medications.</p>}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Scissors size={20} className="text-red-400"/> Surgical History</h3>
                <div className="space-y-4">
                  {patientData.patient.surgeries.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-[#111113] rounded-xl border border-gray-800">
                      <p className="font-medium text-white">{s.surgery}</p>
                      <span className="text-gray-400">{s.year}</span>
                    </div>
                  ))}
                  {patientData.patient.surgeries.length === 0 && <p className="text-gray-500">No surgical history.</p>}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
