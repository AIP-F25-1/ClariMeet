"use client"

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  picture: string
  given_name?: string
  family_name?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (response: any) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already signed in (from localStorage)
    const savedUser = localStorage.getItem('clariMeet_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('clariMeet_user')
      }
    } else {
      // TEMPORARY: Auto-login for testing dashboard
      const testUser = {
        id: 'test-user-123',
        email: 'demo@clarimeet.com',
        name: 'Demo User',
        picture: '',
        given_name: 'Demo',
        family_name: 'User'
      }
      setUser(testUser)
      localStorage.setItem('clariMeet_user', JSON.stringify(testUser))
    }
    setIsLoading(false)
  }, [])

  const signIn = (response: any) => {
    try {
      const userData: User = {
        id: response.credential,
        name: response.name || '',
        email: response.email || '',
        picture: response.picture || '',
        given_name: response.given_name,
        family_name: response.family_name
      }
      
      setUser(userData)
      localStorage.setItem('clariMeet_user', JSON.stringify(userData))
      
      console.log('User signed in:', userData)
    } catch (error) {
      console.error('Error during sign in:', error)
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('clariMeet_user')
    console.log('User signed out')
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
