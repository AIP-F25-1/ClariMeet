"use client";

import AnimatedBackground from "@/components/ui/animated-background";
import { Button } from "@/components/ui/button";
import CardSwap, { Card } from "@/components/ui/card-swap";
import { ContainerScroll } from "@/components/ui/container-scroll";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import Shuffle from "@/components/ui/shuffle";
import { SimpleGoogleSignIn } from "@/components/ui/simple-google-signin";
import { SimpleTracingBeam } from "@/components/ui/simple-tracing-beam";
import { UserProfile } from "@/components/ui/user-profile";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen relative bg-black">
      {/* Animated Background Component */}
      <AnimatedBackground />

      {/* Simple Tracing Beam */}
      <SimpleTracingBeam />

      <Header />

      <main className="relative z-20">
        {/* Hero Section - Seamless Container */}
        <div className="relative h-[80vh] flex items-center pt-32 overflow-hidden">
          <div className="w-full h-full flex">
          {/* Card Stack Animation - Right Side */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1/2 z-10 flex justify-center pt-16">
            <CardSwap
              width={400}
              height={300}
              cardDistance={40}
              verticalDistance={50}
              delay={4000}
              pauseOnHover={true}
              skewAmount={4}
              easing="elastic"
            >
              <Card customClass="dashboard-preview">
                <div className="card-content">
                  <div className="card-header">
                    <div className="card-icon">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="card-title">Dashboard Overview</h3>
                  </div>
                  <p className="card-description">
                    Manage your meetings, view transcripts, and access AI-powered summaries all in one place.
                  </p>
                  <div className="card-stats">
                    <div className="stat">
                      <span className="stat-value">12</span>
                      <span className="stat-label">Meetings</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">8</span>
                      <span className="stat-label">Summaries</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card customClass="meetings-preview">
                <div className="card-content">
                  <div className="card-header">
                    <div className="card-icon">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="card-title">Video Meetings</h3>
                  </div>
                  <p className="card-description">
                    Upload and manage your meeting recordings with synchronized transcripts and live captions.
                  </p>
                  <div className="card-stats">
                    <div className="stat">
                      <span className="stat-value">5</span>
                      <span className="stat-label">Recent</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">2.5h</span>
                      <span className="stat-label">Total</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card customClass="transcripts-preview">
                <div className="card-content">
                  <div className="card-header">
                    <div className="card-icon">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="card-title">Transcripts</h3>
                  </div>
                  <p className="card-description">
                    View and search through detailed transcripts with speaker identification and timestamps.
                  </p>
                  <div className="card-stats">
                    <div className="stat">
                      <span className="stat-value">24</span>
                      <span className="stat-label">Pages</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">98%</span>
                      <span className="stat-label">Accuracy</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card customClass="summaries-preview">
                <div className="card-content">
                  <div className="card-header">
                    <div className="card-icon">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="card-title">AI Summaries</h3>
                  </div>
                  <p className="card-description">
                    Get intelligent summaries, key points, and action items generated by our AI system.
                  </p>
                  <div className="card-stats">
                    <div className="stat">
                      <span className="stat-value">8</span>
                      <span className="stat-label">Generated</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">15</span>
                      <span className="stat-label">Actions</span>
                    </div>
                  </div>
                </div>
              </Card>
            </CardSwap>
          </div>

            {/* Content Overlay - Left Side */}
            <div className="relative z-20 w-1/2 flex items-center justify-center">
              <div className="max-w-lg">
                <div className="flex flex-col items-start justify-center text-left">
                  {/* Content */}
                  <div className="text-left">
                  <Shuffle
                    text="ClariMeet"
                    className="text-5xl md:text-6xl font-bold text-white mb-8 text-balance leading-tight"
                    tag="h1"
                    duration={0.8}
                    stagger={0.1}
                    shuffleTimes={3}
                    scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
                    colorFrom="#ffffff"
                    colorTo="#ffffff"
                    triggerOnce={true}
                    triggerOnHover={true}
                    onShuffleComplete={() => {}}
                  />

                  <p className="text-xl text-gray-300 mb-8 text-pretty max-w-2xl leading-relaxed">
                    Experience seamless video playback with synchronized transcripts, live captions, and intelligent
                    navigation. Perfect for accessibility and enhanced viewing.
                  </p>


                    {/* Authentication Section */}
                    <div className="w-full">
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        <div className="text-left">
                          <p className="text-green-400 text-sm mb-4">
                            Welcome back, {user?.given_name || user?.name}!
                          </p>
                        </div>
                        <UserProfile />

                        {/* Quick Dashboard Access */}
                        <div className="text-left">
                          <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Go to Dashboard
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-300 text-sm mb-4 text-left">
                          Sign in to get started with ClariMeet
                        </p>
                        <SimpleGoogleSignIn
                          className="w-full"
                          buttonText="Sign in with Google"
                        />
                        
                        {/* Login and Sign Up buttons below Google sign-in */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                          <Link href="/login" className="flex-1">
                            <Button 
                              variant="outline" 
                              className="w-full border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/20 transition-all duration-200 bg-transparent border-2"
                            >
                              Login
                            </Button>
                          </Link>
                          <Link href="/signup" className="flex-1">
                            <Button 
                              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold transition-all duration-200 border-0"
                            >
                              Sign Up
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of Content - Regular Container */}
        <div className="mx-auto max-w-7xl px-6 space-y-8 pt-8">
          {/* Container 1: Features & API */}
          <ContainerScroll
            titleComponent={
              <div className="text-center">
                <h2 className="text-4xl font-bold text-cyan-400 mb-4">Features & API</h2>
                <p className="text-xl text-gray-300">Powerful features and comprehensive API documentation</p>
              </div>
            }
          >
            <div className="p-8 space-y-8">
              {/* Features Section */}
              <div>
                <h3 className="text-2xl font-bold text-cyan-400 mb-6">Core Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-2xl bg-black/60 backdrop-blur-lg border border-cyan-400/40 shadow-lg">
                    <div className="w-12 h-12 bg-cyan-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Live Captions</h4>
                    <p className="text-gray-300 text-sm">Real-time caption overlay with speaker identification</p>
                  </div>

                  <div className="text-center p-6 rounded-2xl bg-black/60 backdrop-blur-lg border border-cyan-400/40 shadow-lg">
                    <div className="w-12 h-12 bg-cyan-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Smart Sync</h4>
                    <p className="text-gray-300 text-sm">Intelligent timestamp matching with auto-scroll</p>
                  </div>

                  <div className="text-center p-6 rounded-2xl bg-black/60 backdrop-blur-lg border border-cyan-400/40 shadow-lg">
                    <div className="w-12 h-12 bg-cyan-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Easy Integration</h4>
                    <p className="text-gray-300 text-sm">Simple API with flexible configuration</p>
                  </div>
                </div>
              </div>

              {/* API Documentation */}
              <div>
                <h3 className="text-2xl font-bold text-cyan-400 mb-6">API Documentation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">REST API</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg">
                        <code className="text-sm text-cyan-400">GET /api/transcript/&#123;id&#125;</code>
                        <p className="text-sm text-gray-300 mt-1">Retrieve transcript data</p>
                      </div>
                      <div className="p-4 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg">
                        <code className="text-sm text-cyan-400">POST /api/transcript</code>
                        <p className="text-sm text-gray-300 mt-1">Upload new transcript</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">WebSocket API</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg">
                        <code className="text-sm text-cyan-400">ws://api/transcript/live</code>
                        <p className="text-sm text-gray-300 mt-1">Live transcript updates</p>
                      </div>
                      <div className="p-4 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg">
                        <code className="text-sm text-cyan-400">ws://api/sync/status</code>
                        <p className="text-sm text-gray-300 mt-1">Sync status updates</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ContainerScroll>

          {/* Container 2: Resources & Support */}
          <ContainerScroll
            titleComponent={
              <div className="text-center">
                <h2 className="text-4xl font-bold text-cyan-400 mb-4">Resources & Support</h2>
                <p className="text-xl text-gray-300">Everything you need to get started and get help</p>
              </div>
            }
          >
            <div className="p-8 space-y-8">
              {/* Mock Data & Examples */}
              <div>
                <h3 className="text-2xl font-bold text-cyan-400 mb-6">Sample Data & Examples</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg">
                    <h4 className="font-semibold text-white mb-2">Sample Interview</h4>
                    <p className="text-gray-300 text-sm mb-3">Professional interview with timestamps</p>
                    <button className="text-cyan-400 text-sm hover:underline">View Sample</button>
                  </div>
                  <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg">
                    <h4 className="font-semibold text-white mb-2">Meeting Recording</h4>
                    <p className="text-gray-300 text-sm mb-3">Team meeting with multiple speakers</p>
                    <button className="text-cyan-400 text-sm hover:underline">View Sample</button>
                  </div>
                  <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg">
                    <h4 className="font-semibold text-white mb-2">Conference Talk</h4>
                    <p className="text-gray-300 text-sm mb-3">Technical presentation with Q&A</p>
                    <button className="text-cyan-400 text-sm hover:underline">View Sample</button>
                  </div>
                </div>
              </div>

              {/* Documentation & Support */}
              <div>
                <h3 className="text-2xl font-bold text-cyan-400 mb-6">Documentation & Support</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg">
                    <h4 className="text-lg font-semibold text-white mb-4">Getting Started</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Installation guide</li>
                      <li>• Basic configuration</li>
                      <li>• First transcript upload</li>
                      <li>• Video synchronization</li>
                    </ul>
                  </div>
                  <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg">
                    <h4 className="text-lg font-semibold text-white mb-4">Advanced Features</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Custom styling options</li>
                      <li>• WebSocket integration</li>
                      <li>• API customization</li>
                      <li>• Performance optimization</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Support Options */}
              <div>
                <h3 className="text-2xl font-bold text-cyan-400 mb-6">Get Help</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-white mb-2">FAQ</h4>
                    <p className="text-gray-300 text-sm">Common questions and answers</p>
                  </div>
                  <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-white mb-2">Email Support</h4>
                    <p className="text-gray-300 text-sm">support@clarimeet.com</p>
                  </div>
                  <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-white mb-2">Documentation</h4>
                    <p className="text-gray-300 text-sm">Comprehensive guides</p>
                  </div>
                </div>
              </div>
            </div>
          </ContainerScroll>
        </div>
      </main>

      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}