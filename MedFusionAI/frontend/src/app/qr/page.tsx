"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, QrCode, Download, Printer, Share2, Copy, Check, RefreshCw, Search } from 'lucide-react'
import axios from 'axios'

function QRPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [patientId, setPatientId] = useState(searchParams.get('id') || '')
  const [qrImage, setQrImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [patientData, setPatientData] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || (role !== 'doctor' && role !== 'admin')) {
      router.push('/')
      return
    }
    if (patientId) {
      fetchQR()
      fetchPatient()
    }
  }, [patientId, router])

  const fetchPatient = async () => {
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const res = await axios.get(`${baseUrl}/api/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setPatientData(res.data.patient)
    } catch (err) {
      console.error('Failed to fetch patient data')
    }
  }

  const fetchQR = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const res = await axios.get(`${baseUrl}/api/patients/${patientId}/qr`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setQrImage(res.data.qr_image)
    } catch (err) {
      setError('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (patientId) {
      await fetchQR()
      await fetchPatient()
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(patientId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = () => {
    if (qrImage) {
      const link = document.createElement('a')
      link.href = qrImage
      link.download = `${patientId}-qr.png`
      link.click()
    }
  }

  const printQR = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0c] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-xl">
<QrCode size={24} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold">QR Code</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              value={patientId}
              onChange={e => setPatientId(e.target.value.toUpperCase())}
              placeholder="Enter UPHC ID (e.g. UPHC-DEMO01)"
              className="w-full bg-[#111113] border border-gray-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-colors text-lg"
            />
          </div>
          <button type="submit" disabled={loading} className="bg-white text-black px-8 rounded-2xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {error && (
          <div className="glass-card p-4 border-red-500/50 text-red-400 mb-6">
            {error}
          </div>
        )}

        {/* QR Display */}
        {patientData && (
          <div className="glass-card p-8 mb-6">
            {/* Patient Info */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{patientData.name}</h2>
              <p className="text-gray-400">{patientData.age} years • {patientData.gender}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-8">
              {loading ? (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-900 rounded-2xl">
                  <RefreshCw size={48} className="animate-spin text-blue-500" />
                </div>
              ) : qrImage ? (
                <div className="p-8 bg-white rounded-2xl">
                  <img src={qrImage} alt="Patient QR Code" className="w-64 h-64" />
                </div>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-900 rounded-2xl text-gray-500">
                  No QR Generated
                </div>
              )}
            </div>

            {/* Patient ID */}
            <div className="text-center mb-8">
              <p className="text-gray-400 text-sm mb-2">Patient ID</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-mono font-bold text-blue-400">{patientId}</p>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} className="text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button 
                onClick={downloadQR}
                disabled={!qrImage}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <Download size={18} /> Download
              </button>
              <button 
                onClick={printQR}
                disabled={!qrImage}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <Printer size={18} /> Print
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">How to Use QR Code</h3>
          <div className="space-y-3 text-gray-400">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">1</span>
              <p>Enter or search for patient UPHC ID above</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">2</span>
              <p>Generate QR code for the patient</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">3</span>
              <p>Download or print the QR code for patient records</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">4</span>
              <p>Scan with any QR reader to quickly access patient data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QRPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-blue-500" size={48} />
          <p className="text-gray-400">Loading QR System...</p>
        </div>
      </div>
    }>
      <QRPageContent />
    </Suspense>
  )
}
