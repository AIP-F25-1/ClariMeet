"use client"

import { useAuth } from '@/contexts/AuthContext'
import React, { useEffect, useState } from 'react'

interface GoogleSignInProps {
  className?: string
  buttonText?: string
  onSuccess?: (user: any) => void
  onError?: (error: any) => void
  useServerVerification?: boolean
}

declare global {
  interface Window {
    google: any
  }
}

export const EnhancedGoogleSignIn: React.FC<GoogleSignInProps> = ({
  className = "",
  buttonText = "Sign in with Google",
  onSuccess,
  onError,
  useServerVerification = true
}) => {
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      if (window.google) {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        if (!clientId || clientId === 'your-google-client-id') {
          console.error('Google Client ID not configured')
          setError('Google Client ID not configured')
          return
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        })
      }
    }

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const handleCredentialResponse = (response: any) => {
    setIsLoading(true)
    setError(null)

    if (useServerVerification) {
      // Server-side verification using promises instead of async/await
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: response.credential
        })
      })
      .then(verifyResponse => {
        if (!verifyResponse.ok) {
          throw new Error('Token verification failed')
        }
        return verifyResponse.json()
      })
      .then(verifyResult => {
        // Use server-verified user data
        const userData = {
          credential: response.credential,
          ...verifyResult.user
        }

        signIn(userData)
        
        if (onSuccess) {
          onSuccess(userData)
        }

        console.log('Server-verified Google Sign-In successful:', userData)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error processing Google Sign-In response:', error)
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
        setError(errorMessage)
        
        if (onError) {
          onError(error)
        }
        setIsLoading(false)
      })
    } else {
      // Client-side only (current behavior)
      try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]))
        
        const userData = {
          credential: response.credential,
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          given_name: payload.given_name,
          family_name: payload.family_name,
          sub: payload.sub
        }

        signIn(userData)
        
        if (onSuccess) {
          onSuccess(userData)
        }

        console.log('Client-side Google Sign-In successful:', userData)
        setIsLoading(false)
      } catch (error) {
        console.error('Error processing Google Sign-In response:', error)
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
        setError(errorMessage)
        
        if (onError) {
          onError(error)
        }
        setIsLoading(false)
      }
    }
  }

  const handleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId || clientId === 'your-google-client-id') {
      setError('Google Client ID not configured')
      return
    }

    if (window.google) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google Sign-In prompt was not displayed or skipped')
          // Fallback: redirect to Google OAuth
          window.location.href = `https://accounts.google.com/oauth/authorize?client_id=${clientId}&redirect_uri=${window.location.origin}&response_type=code&scope=openid%20email%20profile`
        }
      })
    } else {
      setError('Google Sign-In is loading. Please try again in a moment.')
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className={`flex items-center justify-center gap-3 bg-black/60 backdrop-blur-xl hover:bg-black/70 text-white font-medium py-2 px-4 rounded-lg border border-cyan-400/30 transition-all duration-200 hover:border-cyan-400/50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
        {isLoading ? 'Verifying...' : buttonText}
      </button>
      
      {error && (
        <div className="text-red-400 text-sm text-center">
          {error}
        </div>
      )}
      
      {useServerVerification && (
        <div className="text-xs text-gray-400 text-center">
          🔒 Server-verified authentication
        </div>
      )}
    </div>
  )
}
