"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Lock, Shield, Zap, Brain, QrCode } from 'lucide-react'
import axios from 'axios'

export default function Home() {
  const router = useRouter()
  const [doctorId, setDoctorId] = useState('doc')
  const [password, setPassword] = useState('123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const res = await axios.post(`${baseUrl}/api/login`, {
        doctor_id: doctorId,
        password: password
      })
      if (res.data.success) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('docName', res.data.name)
        localStorage.setItem('role', res.data.role)
        localStorage.setItem('loginId', doctorId.toUpperCase())
        
        if (res.data.role === 'patient') {
          router.push(`/patient/${doctorId.toUpperCase()}`)
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials. Use doc / 123')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
            <Activity size={28} className="text-blue-400" />
          </div>
          <span className="text-xl font-bold tracking-tight">MedFusion AI</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <span className="hover:text-white transition-colors cursor-pointer">Features</span>
          <span className="hover:text-white transition-colors cursor-pointer">Security</span>
          <span className="hover:text-white transition-colors cursor-pointer">About</span>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 text-center">
        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 animate-fadeIn">
          <Shield size={14} className="text-green-400" />
          <span className="text-sm text-gray-300">Enterprise Healthcare Platform</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fadeIn">
          <span className="text-gradient">Universal Health</span>
          <br />
          Identity & AI
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mb-12 font-light animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          Transform patient care with QR-based universal health identity, 
          intelligent clinical insights, and Apple-level design.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mb-12 w-full animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card p-6 text-left">
            <div className="p-2 bg-blue-500/20 rounded-lg w-fit mb-4">
              <QrCode size={24} className="text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">QR Identity</h3>
            <p className="text-sm text-gray-400">Universal patient IDs accessible anywhere with instant QR code generation.</p>
          </div>
          <div className="glass-card p-6 text-left">
            <div className="p-2 bg-purple-500/20 rounded-lg w-fit mb-4">
              <Brain size={24} className="text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-400">ML risk prediction, DL image analysis, and GenAI summaries.</p>
          </div>
          <div className="glass-card p-6 text-left">
            <div className="p-2 bg-green-500/20 rounded-lg w-fit mb-4">
              <Zap size={24} className="text-green-400" />
            </div>
            <h3 className="font-semibold mb-2">Smart Query</h3>
            <p className="text-sm text-gray-400">Natural language queries like "Show cardiac history" in seconds.</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <form onSubmit={handleLogin} className="glass-card p-8 space-y-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={20} className="text-gray-400" />
              <h2 className="text-xl font-semibold">Provider Access</h2>
            </div>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Doctor ID</label>
              <input 
                type="text" 
                value={doctorId}
                onChange={e => setDoctorId(e.target.value)}
                className="input-field"
                placeholder="Enter doctor ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter password"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                <>
                  <Shield size={18} />
                  <span>Authenticate</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500">
              Demo: Use doctor ID <code className="bg-white/10 px-2 py-1 rounded">doc</code> and password <code className="bg-white/10 px-2 py-1 rounded">123</code>
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-sm text-gray-500">
        <p>© 2024 MedFusion AI. Secure Healthcare Platform.</p>
      </footer>
    </div>
  )
}
