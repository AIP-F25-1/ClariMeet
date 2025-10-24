"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  id: string
  name: string
  email: string
  picture?: string
  given_name?: string
  family_name?: string
  token?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (response: any) => void
  signOut: () => void
  loginWithCredentials: (email: string, password: string) => Promise<boolean>
  signupWithCredentials: (name: string, email: string, password: string) => Promise<boolean>
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
    const savedToken = localStorage.getItem('clariMeet_token')

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        // Handle error silently
        localStorage.removeItem('clariMeet_user')
        localStorage.removeItem('clariMeet_token')
      }
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

    } catch (error) {
      // Handle error silently
    }
  }

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        const userData: User = {
          id: data.user.id,
          name: data.user.name || '',
          email: data.user.email,
          token: data.token
        }

        setUser(userData)
        localStorage.setItem('clariMeet_user', JSON.stringify(userData))
        localStorage.setItem('clariMeet_token', data.token)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const signupWithCredentials = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        const userData: User = {
          id: data.user.id,
          name: data.user.name || '',
          email: data.user.email,
          token: data.token
        }

        setUser(userData)
        localStorage.setItem('clariMeet_user', JSON.stringify(userData))
        localStorage.setItem('clariMeet_token', data.token)
        return true
      }
      return false
    } catch (error) {
      console.error('Signup error:', error)
      return false
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('clariMeet_user')
    localStorage.removeItem('clariMeet_token')
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
    loginWithCredentials,
    signupWithCredentials
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
