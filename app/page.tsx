"use client"

import AnimatedBackground from "@/components/ui/animated-background";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import Shuffle from "@/components/ui/shuffle";
import { SimpleGoogleSignIn } from "@/components/ui/simple-google-signin";
import { UserProfile } from "@/components/ui/user-profile";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen relative bg-black">
      {/* Animated Background Component */}
      <AnimatedBackground />

      <Header />

      <main className="pt-24 pb-12 relative z-20">
        <div className="mx-auto max-w-7xl px-6 space-y-8">
          {/* Hero Section */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 ">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Column - Content */}
              <div className="text-center lg:text-left">
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
                />

                <p className="text-xl text-gray-300 mb-8 text-pretty max-w-2xl leading-relaxed lg:mx-0 mx-auto">
                  Experience seamless video playback with synchronized transcripts, live captions, and intelligent
                  navigation. Perfect for accessibility and enhanced viewing.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live sync enabled
                  </div>
                  <div className="flex items-center gap-2 text-sm text-cyan-400">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    Mock data ready
                  </div>
                </div>

                {/* Authentication Section */}
                <div className="max-w-md mx-auto lg:mx-0">
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="text-center lg:text-left">
                        <p className="text-green-400 text-sm mb-4">
                          Welcome back, {user?.given_name || user?.name}!
                        </p>
                      </div>
                      <UserProfile />

                      {/* Quick Dashboard Access */}
                      <div className="text-center lg:text-left">
                        <button
                          onClick={() => window.location.href = '/dashboard'}
                          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto lg:mx-0"
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
                      <p className="text-gray-300 text-sm mb-4 text-center lg:text-left">
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
                            className="w-full border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-all duration-200 bg-transparent"
                          >
                            Login
                          </Button>
                        </Link>
                        <Link href="/signup" className="flex-1">
                          <Button 
                            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold transition-all duration-200"
                          >
                            Sign Up
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

               {/* Right Column - Animated Logo */}
               <div className="flex justify-center lg:justify-end">
                 <div className="w-full max-w-lg h-96 lg:h-[500px]">
                   <AnimatedLogo className="w-full h-full" />
                 </div>
               </div>
            </div>
          </div>

          {/* Video Player Section - Hidden for Performance */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-6 md:p-8 ">
            <div className="flex justify-center">
              <div className="w-full max-w-7xl">
                <div className="w-full h-96 bg-black/40 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-cyan-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-cyan-400 text-sm font-medium">Video Player</div>
                    <div className="text-gray-400 text-xs mt-1">Available in dashboard</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <section id="features">
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 ">
              <h2 className="text-3xl font-bold text-center text-cyan-400 mb-12">Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div id="live-captions" className="text-center p-8 rounded-2xl bg-black/60 backdrop-blur-lg border border-cyan-400/40 shadow-lg ">
                  <div className="w-12 h-12 bg-cyan-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Live Captions</h3>
                  <p className="text-gray-300 text-sm">
                    Real-time caption overlay with speaker identification and smooth animations.
                  </p>
                </div>

                <div id="transcript-sync" className="text-center p-8 rounded-2xl bg-black/60 backdrop-blur-lg border border-cyan-400/40 shadow-lg ">
                  <div className="w-12 h-12 bg-cyan-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Smart Sync</h3>
                  <p className="text-gray-300 text-sm">
                    Intelligent timestamp matching with smooth highlighting and auto-scroll.
                  </p>
                </div>

                <div id="video-controls" className="text-center p-8 rounded-2xl bg-black/60 backdrop-blur-lg border border-cyan-400/40 shadow-lg ">
                  <div className="w-12 h-12 bg-cyan-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Easy Integration</h3>
                  <p className="text-gray-300 text-sm">
                    Simple API with mock data support and flexible configuration options.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* API Section */}
          <section id="api">
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 ">
              <h2 className="text-3xl font-bold text-center text-cyan-400 mb-12">API Documentation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">REST API</h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                      <code className="text-sm text-cyan-400">GET /api/transcript/&#123;id&#125;</code>
                      <p className="text-sm text-gray-300 mt-1">Retrieve transcript data</p>
                    </div>
                    <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                      <code className="text-sm text-cyan-400">POST /api/transcript</code>
                      <p className="text-sm text-gray-300 mt-1">Upload new transcript</p>
                    </div>
                    <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                      <code className="text-sm text-cyan-400">GET /api/video/&#123;id&#125;</code>
                      <p className="text-sm text-gray-300 mt-1">Get video metadata</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">WebSocket API</h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                      <code className="text-sm text-cyan-400">ws://api/transcript/live</code>
                      <p className="text-sm text-gray-300 mt-1">Live transcript updates</p>
                    </div>
                    <div className="p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                      <code className="text-sm text-cyan-400">ws://api/sync/status</code>
                      <p className="text-sm text-gray-300 mt-1">Sync status updates</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* WebSocket Section */}
          <section id="websocket">
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 ">
              <h2 className="text-3xl font-bold text-center text-cyan-400 mb-12">WebSocket Integration</h2>
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-semibold text-white mb-6">Real-time Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h4 className="font-semibold text-white mb-2">Live Captions</h4>
                    <p className="text-gray-300 text-sm">Receive real-time caption updates as they're generated</p>
                  </div>
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h4 className="font-semibold text-white mb-2">Sync Status</h4>
                    <p className="text-gray-300 text-sm">Monitor video-transcript synchronization status</p>
                  </div>
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h4 className="font-semibold text-white mb-2">User Events</h4>
                    <p className="text-gray-300 text-sm">Track user interactions and playback events</p>
                  </div>
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h4 className="font-semibold text-white mb-2">Error Handling</h4>
                    <p className="text-gray-300 text-sm">Real-time error notifications and recovery</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Mock Data Section */}
          <section id="mock-data">
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 md:p-12 hover:bg-white/25 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
              <h2 className="text-3xl font-bold text-center text-white mb-12">Mock Data</h2>
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-semibold text-white mb-6">Sample Data Available</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h4 className="font-semibold text-white mb-2">Sample Interview</h4>
                    <p className="text-gray-300 text-sm mb-3">Professional interview with timestamps</p>
                    <button className="text-cyan-400 text-sm hover:underline">View Sample</button>
                  </div>
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h4 className="font-semibold text-white mb-2">Meeting Recording</h4>
                    <p className="text-gray-300 text-sm mb-3">Team meeting with multiple speakers</p>
                    <button className="text-cyan-400 text-sm hover:underline">View Sample</button>
                  </div>
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h4 className="font-semibold text-white mb-2">Conference Talk</h4>
                    <p className="text-gray-300 text-sm mb-3">Technical presentation with Q&A</p>
                    <button className="text-cyan-400 text-sm hover:underline">View Sample</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Documentation Section */}
          <section id="docs">
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 md:p-12 hover:bg-white/25 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
              <h2 className="text-3xl font-bold text-center text-white mb-12">Documentation</h2>
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h3 className="text-xl font-semibold text-white mb-4">Getting Started</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Installation guide</li>
                      <li>• Basic configuration</li>
                      <li>• First transcript upload</li>
                      <li>• Video synchronization</li>
                    </ul>
                  </div>
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h3 className="text-xl font-semibold text-white mb-4">Advanced Features</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Custom styling options</li>
                      <li>• WebSocket integration</li>
                      <li>• API customization</li>
                      <li>• Performance optimization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Examples Section */}
          <section id="examples">
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 md:p-12 hover:bg-white/25 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
              <h2 className="text-3xl font-bold text-center text-white mb-12">Examples</h2>
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h3 className="font-semibold text-white mb-2">Basic Implementation</h3>
                    <p className="text-gray-300 text-sm mb-4">Simple video player with transcript</p>
                    <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-cyan-700 transition-colors">
                      View Code
                    </button>
                  </div>
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <h3 className="font-semibold text-white mb-2">Advanced Features</h3>
                    <p className="text-gray-300 text-sm mb-4">Full-featured implementation with all options</p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                      View Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Support Section */}
          <section id="support">
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 md:p-12 hover:bg-white/25 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
              <h2 className="text-3xl font-bold text-center text-white mb-12">Support</h2>
              <div className="max-w-4xl mx-auto text-center">
                <h3 className="text-xl font-semibold text-white mb-6">Get Help</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-white mb-2">FAQ</h4>
                    <p className="text-gray-300 text-sm">Common questions and answers</p>
                  </div>
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-white mb-2">Email Support</h4>
                    <p className="text-gray-300 text-sm">support@clarimeet.com</p>
                  </div>
                  <div className="p-8 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-400/40 shadow-lg ">
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
          </section>
        </div>
      </main>

      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}