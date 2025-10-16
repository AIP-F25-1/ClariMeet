'use client'

import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LoadingPopupProps {
  isOpen: boolean
  progress: number
  message: string
  onClose?: () => void
}

export function LoadingPopup({ isOpen, progress, message, onClose }: LoadingPopupProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-600/30 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Sparkles className="w-16 h-16 text-cyan-400 animate-pulse" />
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-ping" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">
              {message}{dots}
            </h3>
            
            <div className="space-y-2">
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">
                {progress}% complete
              </p>
            </div>

            <div className="text-sm text-gray-300 space-y-1">
              <p>✨ Processing your content with AI</p>
              <p>⚡ This may take a few minutes</p>
              <p>🎯 Quality results guaranteed</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
