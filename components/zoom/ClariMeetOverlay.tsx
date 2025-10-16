'use client'

import zoomSdk from '@zoom/appssdk'
import { Clock, Home, Mic, MicOff, Play, Square, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Participant {
  id: string
  name: string
  isSpeaking: boolean
  isMuted: boolean
}

function ClariMeetOverlay() {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Kyle Wilner', isSpeaking: true, isMuted: false },
    { id: '2', name: 'Emma Erickson', isSpeaking: false, isMuted: false },
    { id: '3', name: 'John Smith', isSpeaking: false, isMuted: true },
    { id: '4', name: 'Sarah Johnson', isSpeaking: false, isMuted: false }
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [meetingTime, setMeetingTime] = useState('00:00:00')
  const [isClient, setIsClient] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState('Kyle Wilner')

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize Zoom SDK
  useEffect(() => {
    if (!isClient) return
    
    const initializeZoom = async () => {
      try {
        await zoomSdk.config({
          version: '0.16',
          popoutSize: { width: 320, height: 600 }
        })
        console.log('Zoom SDK initialized')
      } catch (error) {
        console.log('Zoom SDK not available (development mode)')
      }
    }
    initializeZoom()
  }, [isClient])

  // Timer logic
  useEffect(() => {
    if (!isClient) return
    
    const interval = setInterval(() => {
      // Update meeting time (mock for now)
      setMeetingTime(prev => {
        const [hours, minutes, seconds] = prev.split(':').map(Number)
        const totalSeconds = hours * 3600 + minutes * 60 + seconds + 1
        const newHours = Math.floor(totalSeconds / 3600)
        const newMinutes = Math.floor((totalSeconds % 3600) / 60)
        const newSeconds = totalSeconds % 60
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isClient])

  const handleRecording = () => {
    setIsRecording(!isRecording)
    // Here you would integrate with your ClariMeet backend
    console.log(isRecording ? 'Stopping recording...' : 'Starting recording...')
  }

  const handleHomeClick = () => {
    window.open('/dashboard', '_blank')
  }

  if (!isClient) {
    return (
      <div className="fixed top-0 right-0 w-80 h-screen bg-gray-900 border-l border-gray-700 z-50 shadow-2xl">
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">CM</span>
              </div>
              <h2 className="text-white font-bold text-lg">ClariMeet</h2>
            </div>
          </div>
        </div>
        <div className="p-4 text-center text-gray-400">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-0 right-0 w-80 h-screen bg-gray-900 border-l border-gray-700 z-50 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">CM</span>
            </div>
            <h2 className="text-white font-bold text-lg">ClariMeet</h2>
          </div>
          <button 
            onClick={handleHomeClick}
            className="p-2 bg-cyan-500/20 rounded-lg hover:bg-cyan-500/30 transition-colors"
            title="Go to ClariMeet Dashboard"
          >
            <Home className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Meeting Timer */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-2 text-white">
          <Clock className="w-5 h-5 text-cyan-400" />
          <span className="font-mono text-xl font-bold">{meetingTime}</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 text-sm font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="p-4 border-b border-gray-700 flex-1">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Participants ({participants.length})
        </h3>
        <div className="space-y-3">
          {participants.map((participant) => (
            <div 
              key={participant.id}
              className={`p-3 rounded-lg flex items-center gap-3 transition-all duration-300 ${
                participant.isSpeaking 
                  ? 'bg-cyan-500/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
                  : 'bg-gray-800/50 border border-gray-600/30'
              }`}
            >
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                participant.isSpeaking 
                  ? 'bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50' 
                  : 'bg-gray-500'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    participant.isSpeaking ? 'text-cyan-300' : 'text-white'
                  }`}>
                    {participant.name}
                  </span>
                  {participant.isSpeaking && (
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
                      Speaking
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {participant.isMuted ? (
                  <MicOff className="w-4 h-4 text-red-400" />
                ) : (
                  <Mic className="w-4 h-4 text-green-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recording Controls */}
      <div className="p-4 bg-gray-800/30">
        <button
          onClick={handleRecording}
          className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
              : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Recording
            </>
          )}
        </button>
        
        {isRecording && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Recording in progress...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClariMeetOverlay
