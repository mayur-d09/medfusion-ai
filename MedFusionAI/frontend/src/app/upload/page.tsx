"use client"
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Upload, Image, FileImage, Brain, Activity, 
  AlertCircle, CheckCircle, Loader2, ScanLine, Stethoscope,
  Maximize, Target, X
} from 'lucide-react'
import axios from 'axios'

const imageTypes = [
  { id: 'xray', name: 'X-Ray', icon: Activity, description: 'Chest, Bone, Dental' },
  { id: 'mri', name: 'MRI', icon: Maximize, description: 'Brain, Spine, Joints' },
  { id: 'ct_scan', name: 'CT Scan', icon: Target, description: 'Full Body Scan' },
  { id: 'ultrasound', name: 'Ultrasound', icon: Stethoscope, description: 'Abdominal, Cardiac' },
]

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageType, setImageType] = useState('xray')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || (role !== 'doctor' && role !== 'admin')) {
      router.push('/')
      return
    }
  }, [router])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('image_type', imageType)

      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'
      const res = await axios.post(`${baseUrl}/api/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      })
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze image')
    } finally {
      setLoading(false)
    }
  }

  const clearUpload = () => {
    setSelectedFile(null)
    setPreview('')
    setResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getImageTypeIcon = (type: string) => {
    const found = imageTypes.find(t => t.id === type)
    return found?.icon || Image
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
              <div className="p-2 bg-purple-600/20 rounded-xl">
                <Brain size={24} className="text-purple-400" />
              </div>
              <h1 className="text-2xl font-bold">Medical Image Analysis</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Info Banner */}
        <div className="glass-card p-4 mb-6 border-l-4 border-l-blue-500">
          <p className="text-gray-300">
            <Brain size={18} className="inline mr-2" />
            Upload medical images for AI-powered analysis using deep learning (CNN).
            Supported: X-Ray, MRI, CT Scan, Ultrasound.
          </p>
        </div>

        {!result && !loading && (
          <>
            {/* Image Type Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Select Image Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageTypes.map(type => {
                  const IconComponent = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => setImageType(type.id)}
                      className={`glass-card p-4 text-center transition-all ${
                        imageType === type.id 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'hover:border-gray-600'
                      }`}
                    >
                      <IconComponent size={32} className={`mx-auto mb-2 ${
                        imageType === type.id ? 'text-blue-400' : 'text-gray-400'
                      }`} />
                      <p className="font-semibold">{type.name}</p>
                      <p className="text-xs text-gray-400">{type.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* File Upload */}
            <div className="glass-card p-8 mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              
              {!preview ? (
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center hover:border-blue-500 transition-colors">
                    <Upload size={48} className="mx-auto mb-4 text-gray-500" />
                    <p className="text-xl font-semibold mb-2">Drop medical image here</p>
                    <p className="text-gray-400 mb-4">or click to browse</p>
                    <p className="text-sm text-gray-500">
                      Supported: JPG, PNG, DICOM • Max 10MB
                    </p>
                  </div>
                </label>
              ) : (
                <div className="space-y-6">
                  {/* Preview */}
                  <div className="relative">
                    <img 
                      src={preview} 
                      alt="Medical image preview" 
                      className="max-h-64 mx-auto rounded-xl"
                    />
                    <button
                      onClick={clearUpload}
                      className="absolute top-2 right-2 p-2 bg-red-500/20 rounded-lg hover:bg-red-500/40 transition-colors"
                    >
                      <X size={20} className="text-red-400" />
                    </button>
                  </div>

                  {/* File Info */}
                  <div className="text-center">
                    <p className="text-lg font-semibold">{selectedFile?.name}</p>
                    <p className="text-gray-400 text-sm">
                      {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0'} MB
                    </p>
                  </div>

                  {/* Analyze Button */}
                  <button
                    onClick={handleUpload}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Brain size={20} /> Analyze with AI
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Loading State */}
        {loading && (
          <div className="glass-card p-12 text-center">
            <Loader2 size={64} className="mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-xl font-semibold mb-2">Analyzing Medical Image...</p>
            <p className="text-gray-400">
              Using deep learning models to detect patterns and abnormalities
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass-card p-6 border-red-500/50">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
            <button
              onClick={clearUpload}
              className="mt-4 btn-secondary"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Analysis Result */}
            <div className="glass-card p-6 border-l-4 border-l-green-500">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={24} className="text-green-400" />
                <h3 className="text-xl font-semibold">Analysis Complete</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-lg text-gray-200">{result.analysis}</p>
              </div>

              {/* Confidence */}
              {result.confidence && (
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2">Confidence Score</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xl font-bold text-blue-400">
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Findings */}
              {result.findings && result.findings.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-3">Key Findings</p>
                  <div className="space-y-2">
                    {result.findings.map((finding: string, i: number) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-3 p-3 bg-[#111113] rounded-lg"
                      >
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span>{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={clearUpload}
                  className="btn-secondary flex-1"
                >
                  Analyze Another Image
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-primary flex-1"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>

            {/* Original Image */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Uploaded Image</h3>
              <img 
                src={preview} 
                alt="Original medical image" 
                className="max-h-64 mx-auto rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
