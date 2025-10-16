'use client'

import zoomSdk from '@zoom/appssdk'
import { useEffect, useState } from 'react'

interface Participant {
  id: string
  name: string
  isSpeaking: boolean
  isMuted: boolean
}

export function useZoomSDK() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [meetingInfo, setMeetingInfo] = useState<any>(null)

  useEffect(() => {
    const initializeZoom = async () => {
      try {
        // Initialize Zoom SDK
        await zoomSdk.config({
          version: '0.16',
          popoutSize: { width: 320, height: 600 }
        })

        // Get meeting participants
        const participantsData = await zoomSdk.getMeetingParticipants()
        if (participantsData && participantsData.participants) {
          setParticipants(participantsData.participants)
        }

        // Get meeting info
        const meetingData = await zoomSdk.getMeetingInfo()
        if (meetingData) {
          setMeetingInfo(meetingData)
        }

        // Listen for participant changes
        zoomSdk.addEventListener('onParticipantChange', (data: any) => {
          if (data && data.participants) {
            setParticipants(data.participants)
          }
        })

        // Listen for speaking changes
        zoomSdk.addEventListener('onSpeakerChange', (data: any) => {
          console.log('Speaker changed:', data)
          // Update speaking status for participants
        })

        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize Zoom SDK:', error)
        // Fallback to mock data for development
        setParticipants([
          { id: '1', name: 'Kyle Wilner', isSpeaking: true, isMuted: false },
          { id: '2', name: 'Emma Erickson', isSpeaking: false, isMuted: false },
          { id: '3', name: 'John Smith', isSpeaking: false, isMuted: true },
          { id: '4', name: 'Sarah Johnson', isSpeaking: false, isMuted: false }
        ])
        setIsInitialized(true)
      }
    }

    initializeZoom()
  }, [])

  const startRecording = async () => {
    try {
      // This would integrate with your ClariMeet backend
      console.log('Starting recording...')
      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      return false
    }
  }

  const stopRecording = async () => {
    try {
      // This would integrate with your ClariMeet backend
      console.log('Stopping recording...')
      return true
    } catch (error) {
      console.error('Failed to stop recording:', error)
      return false
    }
  }

  return { 
    participants, 
    isInitialized, 
    meetingInfo,
    startRecording,
    stopRecording
  }
}
