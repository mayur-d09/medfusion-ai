"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Calendar, Heart, AlertTriangle, Phone, 
  CheckCircle, Loader2, UserPlus, Shield
} from 'lucide-react'
import axios from 'axios'

export default function CreatePatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [patientId, setPatientId] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    blood_type: '',
    allergies: '',
    emergency_contact: ''
  })

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const genders = ['Male', 'Female', 'Other']

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.age || !formData.gender) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const res = await axios.post(`${baseUrl}/api/patients`, {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        blood_type: formData.blood_type || null,
        allergies: formData.allergies || null,
        emergency_contact: formData.emergency_contact || null
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      setPatientId(res.data.patient_id)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create patient')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnother = () => {
    setSuccess(false)
    setPatientId('')
    setFormData({
      name: '',
      age: '',
      gender: 'Male',
      blood_type: '',
      allergies: '',
      emergency_contact: ''
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-[#0a0a0c] sticky top-0 z-50">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-xl">
                  <UserPlus size={24} className="text-green-400" />
                </div>
                <h1 className="text-2xl font-bold">Create Patient</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto p-6">
          <div className="glass-card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={48} className="text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Patient Created Successfully!</h2>
            <p className="text-gray-400 mb-6">New patient has been registered in the system</p>

            <div className="glass-card p-6 mb-6 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Patient ID</p>
                  <p className="text-2xl font-bold text-green-400">{patientId}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-xl font-semibold">{formData.name}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleCreateAnother}
                className="btn-secondary flex-1"
              >
                Create Another Patient
              </button>
              <button 
                onClick={() => router.push(`/patient/${patientId}`)}
                className="btn-primary flex-1"
              >
                View Patient
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0c] sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-xl">
                <UserPlus size={24} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold">Create Patient</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User size={16} className="inline mr-2" />
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter patient's full name"
              className="input-field"
              required
            />
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Age <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Age"
                min="0"
                max="150"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Heart size={16} className="inline mr-2" />
                Gender <span className="text-red-400">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
                required
              >
                {genders.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Blood Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Heart size={16} className="inline mr-2" />
              Blood Type
            </label>
            <select
              name="blood_type"
              value={formData.blood_type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select blood type</option>
              {bloodTypes.map(bt => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <AlertTriangle size={16} className="inline mr-2" />
              Allergies
            </label>
            <input
              type="text"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="List any known allergies (e.g. Penicillin, Pollen)"
              className="input-field"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Phone size={16} className="inline mr-2" />
              Emergency Contact
            </label>
            <input
              type="tel"
              name="emergency_contact"
              value={formData.emergency_contact}
              onChange={handleChange}
              placeholder="Mobile number (e.g. +91 98765 43210)"
              className="input-field"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Creating Patient...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Create Patient
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-sm text-gray-300">
            <Shield size={16} className="inline mr-2" />
            A unique UPHC ID will be automatically generated for the patient.
          </p>
        </div>
      </div>
    </div>
  )
}
