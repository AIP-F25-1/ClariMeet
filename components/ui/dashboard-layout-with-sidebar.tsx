"use client";
import { useAuth } from "@/contexts/AuthContext";
import {
    BarChart3,
    Brain,
    Calendar,
    FileText,
    Home,
    LogOut,
    X
} from "lucide-react";
// animations removed to avoid external motion library
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { SparklesCore } from "./sparkles-core";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayoutWithSidebar({ children }: DashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('clariMeet_user');
    localStorage.removeItem('clariMeet_token');
    router.push('/');
  };

  const navigationItems = [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "Meetings", href: "/dashboard/meetings", icon: Calendar },
    { title: "Transcriptions", href: "/dashboard/transcriptions", icon: FileText },
    { title: "Summaries", href: "/dashboard/summaries", icon: BarChart3 },
    { title: "AI Tools", href: "/dashboard/ai-tools", icon: Brain },
  ];

  // Determine if sidebar should be expanded
  const shouldExpand = isOpen || isHovered;

  return (
    <div className="min-h-screen relative">
      {/* Sparkles Background */}
      <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
        <SparklesCore
          id="dashboard-sparkles"
          background="rgba(0, 0, 0, 1)"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Toggle Button when sidebar closed */}
      {!shouldExpand && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-6 left-4 z-50 bg-gray-900/80 backdrop-blur-xl rounded-lg p-2 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 shadow-2xl"
        >
          <div className="h-8 w-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">CM</span>
          </div>
        </button>
      )}

      {/* Sidebar without animation */}
      {shouldExpand && (
        <div
          className="fixed left-0 top-0 h-full z-40 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/20 shadow-2xl w-[280px]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-700/20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-3 hover:bg-gray-700/20 p-2 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">CM</span>
                  </div>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg bg-gray-700/20 text-gray-300 hover:bg-gray-600/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6">
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.title} className="overflow-hidden">
                    <button
                      onClick={() => {
                        router.push(item.href);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full text-left ${
                        item.href === pathname
                          ? 'bg-gray-700/20 text-gray-300 border border-gray-600/30'
                          : 'text-gray-300 hover:bg-gray-700/10 hover:text-gray-200'
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="whitespace-nowrap">{item.title}</span>
                    </button>
                  </div>
                ))}
              </nav>
            </div>

            <div className="p-6 border-t border-gray-700/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {getUserInitials(user?.name || user?.email || '')}
                  </span>
                </div>
                <span className="text-white text-sm font-medium">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="whitespace-nowrap">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Margin Area - Slightly lighter background */}
      <div className="fixed left-0 top-0 w-20 h-full z-20 bg-gray-900/15" />
      
      {/* Hover Area - Invisible area on left edge to open sidebar */}
      {!shouldExpand && (
        <div 
          className="fixed left-0 top-0 w-4 h-full z-30 cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}

      {/* Main Content */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-6xl pb-24">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

    </div>
  );
}
