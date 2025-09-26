"use client"

import { useAuth } from '@/contexts/AuthContext'
import React, { useState } from 'react'

interface SimpleGoogleSignInProps {
  className?: string
  buttonText?: string
  onSuccess?: (user: any) => void
  onError?: (error: any) => void
}

export const SimpleGoogleSignIn: React.FC<SimpleGoogleSignInProps> = ({
  className = "",
  buttonText = "Sign in with Google",
  onSuccess,
  onError
}) => {
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    console.log('🔐 Google Sign-In button clicked')
    setIsLoading(true)
    setError(null)

    try {
      // Check if Google Client ID is configured
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId || clientId === 'your-google-client-id') {
        throw new Error('Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file')
      }

      // Create proper Google OAuth URL with all required parameters
      const redirectUri = `${window.location.origin}/api/auth/google/callback`
      const scope = 'openid email profile'
      const responseType = 'code'

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=${encodeURIComponent(responseType)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(window.location.origin)}&` +
        `include_granted_scopes=true`

      console.log('🚀 Opening Google OAuth popup:', authUrl)

      // Open popup window
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no'
      )

      if (!popup) {
        console.error('❌ Popup blocked')
        throw new Error('Popup blocked. Please allow popups for this site.')
      }

      console.log('✅ Popup opened successfully')

      // Listen for popup to close or receive message
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageHandler)
          setIsLoading(false)
          setError('Authentication was cancelled or popup was closed')
        }
      }, 1000)

      // Listen for message from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed)
          popup.close()
          window.removeEventListener('message', messageHandler)

          const userData = event.data.user
          signIn(userData)

          if (onSuccess) {
            onSuccess(userData)
          }

          setIsLoading(false)
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed)
          popup.close()
          window.removeEventListener('message', messageHandler)

          throw new Error(event.data.error || 'Authentication failed')
        }
      }

      // Add message listener with better error handling
      window.addEventListener('message', messageHandler)

      // Also listen for popup focus events as backup
      const focusHandler = () => {
        console.log('Parent window focused, checking if popup is still open')
        if (popup && popup.closed) {
          console.log('Popup was closed without sending message')
          clearInterval(checkClosed)
          // clearTimeout(timeoutId)
          window.removeEventListener('message', messageHandler)
          window.removeEventListener('focus', focusHandler)
          setIsLoading(false)
          setError('Authentication was cancelled')
        }
      }

      window.addEventListener('focus', focusHandler)

      // Clean up focus listener when done
      const originalMessageHandler = messageHandler
      const wrappedMessageHandler = (event: MessageEvent) => {
        originalMessageHandler(event)
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS' || event.data.type === 'GOOGLE_AUTH_ERROR') {
          window.removeEventListener('focus', focusHandler)
        }
      }

      window.removeEventListener('message', messageHandler)
      window.addEventListener('message', wrappedMessageHandler)

    } catch (error) {
      console.error('Google Sign-In error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      setError(errorMessage)

      if (onError) {
        onError(error)
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className={`flex items-center justify-center gap-3 bg-black/60 backdrop-blur-xl hover:bg-black/70 text-white font-medium py-3 px-6 rounded-lg border border-cyan-400/30 transition-all duration-200 hover:border-cyan-400/50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {isLoading ? 'Signing in...' : buttonText}
      </button>

      {error && (
        <div className="text-red-400 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  )
}
