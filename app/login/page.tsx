"use client"

import AnimatedBackground from '@/components/ui/animated-background'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimpleGoogleSignIn } from '@/components/ui/simple-google-signin'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'


export default function LoginPage() {
  const router = useRouter()
  const { signIn, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || 'Invalid credentials')
        return
      }

      // Persist JWT for authenticated API calls from the dashboard
      localStorage.setItem('token', data.token)

      // Update AuthContext user so dashboard sees you as authenticated
      signIn({
        credential: data.user.id,
        name: data.user.name || '',
        email: data.user.email || '',
        picture: '',
        given_name: data.user.name || '',
        family_name: ''
      })

      // Also persist the user for initial load on dashboard
      localStorage.setItem('clariMeet_user', JSON.stringify({
        id: data.user.id,
        name: data.user.name || '',
        email: data.user.email || '',
        picture: ''
      }))

      router.push('/dashboard')
    } catch (err) {
      alert('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen relative bg-black">
      <AnimatedBackground />
      
      {/* Header */}
      <div className="fixed top-4 left-4 right-4 z-50">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              ClariMeet
            </Link>
            <div className="flex gap-4">
              <Link href="/signup">
                <Button variant="outline" className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-24 pb-12 relative z-20">
        <div className="mx-auto max-w-md px-6">
          <Card className="bg-black/60 backdrop-blur-xl border-cyan-400/30 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
              <CardDescription className="text-gray-300">
                Sign in to your ClariMeet account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Sign In */}
              <div className="space-y-4">
                <SimpleGoogleSignIn 
                  className="w-full"
                  buttonText="Continue with Google"
                />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-gray-400">Or continue with email</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="bg-black/40 border-cyan-400/30 text-white placeholder:text-gray-400 focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="bg-black/40 border-cyan-400/30 text-white placeholder:text-gray-400 focus:border-cyan-400"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-600 bg-black/40 text-cyan-400 focus:ring-cyan-400"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-300">
                      Remember me
                    </Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300">
                    Forgot password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-gray-300">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
