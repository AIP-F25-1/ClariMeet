'use client'

import { FileVideo, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'

interface UploadMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, meetingName: string) => Promise<void>
}

export function UploadMeetingModal({ isOpen, onClose, onUpload }: UploadMeetingModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [meetingName, setMeetingName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (selectedFile.size > maxSize) {
        setError('File too large. Maximum size is 100MB. Please compress your video or try a smaller file.')
        return
      }
      
      // Check file type
      if (!selectedFile.type.startsWith('video/')) {
        setError('Please select a video file.')
        return
      }
      
      setFile(selectedFile)
      setError(null) // Clear any previous errors
      if (!meetingName) {
        setMeetingName(selectedFile.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (droppedFile.size > maxSize) {
        setError('File too large. Maximum size is 100MB. Please compress your video or try a smaller file.')
        return
      }
      
      // Check file type
      if (!droppedFile.type.startsWith('video/')) {
        setError('Please select a video file.')
        return
      }
      
      setFile(droppedFile)
      setError(null) // Clear any previous errors
      if (!meetingName) {
        setMeetingName(droppedFile.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !meetingName.trim()) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 1000)
    
    try {
      await onUpload(file, meetingName.trim())
      setUploadProgress(100)
      // Success - reset and close
      setFile(null)
      setMeetingName('')
      setError(null)
      setTimeout(() => onClose(), 500) // Small delay to show completion
    } catch (error) {
      console.error('Upload failed:', error)
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.')
    } finally {
      clearInterval(progressInterval)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setFile(null)
      setMeetingName('')
      setError(null)
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isUploading) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isUploading])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-gray-900/95 backdrop-blur-xl border border-gray-600/30 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            Upload Meeting
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="meeting-name" className="text-gray-300">
              Meeting Name
            </Label>
            <Input
              id="meeting-name"
              type="text"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              placeholder="Enter meeting name"
              className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Video File</Label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-gray-600/50 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <FileVideo className="w-12 h-12 text-cyan-400 mx-auto" />
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFile(null)}
                    className="mt-2 border-gray-600/50 text-gray-300 hover:bg-gray-800/50"
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-gray-300">Drop your video file here</p>
                  <p className="text-gray-400 text-sm">or click to browse</p>
                </div>
              )}
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 border-gray-600/50 text-gray-300 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || !meetingName.trim() || isUploading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : (
                'Upload Meeting'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
