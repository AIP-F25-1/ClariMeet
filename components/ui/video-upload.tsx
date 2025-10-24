"use client";

import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface VideoUploadProps {
  onUploadComplete?: (result: any) => void
  className?: string
}

export function VideoUpload({ onUploadComplete, className = '' }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a video file')
        return
      }
      
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB')
        return
      }
      
      setSelectedFile(file)
      setError(null)
      setUploadStatus('idle')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      setError('Please select a file and enter a title')
      return
    }

    setIsUploading(true)
    setUploadStatus('uploading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('title', title)
      formData.append('description', description)

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      setUploadStatus('success')
      setUploadProgress(100)
      
      if (onUploadComplete) {
        onUploadComplete(result)
      }

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFile(null)
        setTitle('')
        setDescription('')
        setUploadStatus('idle')
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 2000)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setError(null)
    setUploadStatus('idle')
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Upload Video</h3>
        <p className="text-gray-300 text-sm">Upload a video file to create a new meeting recording</p>
      </div>

      {/* File Input */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-cyan-400 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">Click to select video file</p>
            <p className="text-gray-500 text-sm">Supports MP4, MOV, AVI, and other video formats</p>
          </button>
        ) : (
          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 transition-colors"
              >
                <X className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Title Input */}
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Meeting Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter meeting title..."
          className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600/30 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Description Input */}
      <div className="mb-6">
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter meeting description..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600/30 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="mb-4 flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          Video uploaded successfully!
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || !title.trim() || isUploading}
        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
          !selectedFile || !title.trim() || isUploading
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white hover:scale-105'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload Video'}
      </button>
    </div>
  )
}
