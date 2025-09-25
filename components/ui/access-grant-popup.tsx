"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Check, 
  X, 
  Shield, 
  Video, 
  Users, 
  Mic, 
  Camera,
  Sparkles
} from 'lucide-react'

interface AccessGrantPopupProps {
  isOpen: boolean
  onClose: () => void
}

export const AccessGrantPopup: React.FC<AccessGrantPopupProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const router = useRouter()

  const handleEnableAccess = () => {
    // Close popup and navigate to toggle page
    onClose()
    router.push('/meeting-apps')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 transform transition-all duration-300 scale-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full"></div>
            <div className="absolute -top-0 -right-0 w-3 h-3 bg-pink-300 rounded-full"></div>
            <div className="absolute -top-0 -right-2 w-2 h-2 bg-pink-200 rounded-full"></div>
          </div>
          <span className="ml-3 text-2xl font-bold text-purple-600">ClariMeet</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-black text-center mb-4">
          Grant Access
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-8">
          Boost productivity by allowing ClariMeet to transcribe your meetings live:
        </p>

        {/* Features List */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700 font-medium">Google Meet</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">Microsoft Teams</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700 font-medium">Zoom</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-500" />
              <span className="text-gray-700 font-medium">Screen Recording</span>
            </div>
          </div>
        </div>

        {/* Enable Button */}
        <button
          onClick={handleEnableAccess}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 mb-6"
        >
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          ENABLE CLARIMEET
        </button>

        {/* Privacy Statement */}
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
            <Shield className="w-3 h-3 text-gray-400" />
          </div>
          <span>Your meetings are private by default.</span>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400">
          <span>Release 1.0.0 (from ClariMeet)</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-600 transition-colors">My ClariMeet</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Help</a>
          </div>
        </div>
      </div>
    </div>
  )
}
