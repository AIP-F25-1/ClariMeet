"use client";
import { useAuth } from "@/contexts/AuthContext";
import {
    BarChart3,
    Brain,
    Calendar,
    FileText,
    Home,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface AnimatedSidebarProps {
  children: React.ReactNode;
}

export function AnimatedSidebar({ children }: AnimatedSidebarProps) {
  const [isOpen, setIsOpen] = useState(true); // Start with sidebar open
  const [isHovered, setIsHovered] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

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
    <div className="relative min-h-screen bg-black">
      {/* Animated Sidebar */}
      <motion.div
        className="fixed left-0 top-0 h-full z-50 bg-gray-800/95 backdrop-blur-xl border-r border-gray-600/20 shadow-2xl"
        initial={{ x: -280 }}
        animate={{ 
          x: shouldExpand ? 0 : -280,
          width: shouldExpand ? 280 : 60
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.3
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-600/20">
            <div className="flex items-center justify-between">
              <motion.div
                className="flex items-center gap-3"
                animate={{ opacity: shouldExpand ? 1 : 0 }}
                transition={{ delay: shouldExpand ? 0.2 : 0 }}
              >
                <div className="h-8 w-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">CM</span>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="font-bold text-white text-lg hover:text-gray-300 transition-colors cursor-pointer"
                >
                  ClariMeet
                </button>
              </motion.div>
              
              {/* Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg bg-gray-700/20 text-gray-300 hover:bg-gray-600/30 transition-colors"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-6">
            <nav className="space-y-2">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: shouldExpand ? 1 : 0,
                    x: shouldExpand ? 0 : -20
                  }}
                  transition={{ 
                    delay: shouldExpand ? index * 0.1 + 0.3 : index * 0.05,
                    duration: 0.3
                  }}
                  className="overflow-hidden"
                >
                  <a
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      item.href === currentPath
                        ? 'bg-gray-700/20 text-white border border-gray-600/30'
                        : 'text-gray-300 hover:bg-gray-700/10 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <motion.span
                      animate={{ 
                        opacity: shouldExpand ? 1 : 0,
                        width: shouldExpand ? "auto" : 0
                      }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.title}
                    </motion.span>
                  </a>
                </motion.div>
              ))}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="p-6 border-t border-gray-600/20">
            <motion.div
              className="flex items-center gap-3 mb-4"
              animate={{ opacity: shouldExpand ? 1 : 0 }}
              transition={{ delay: shouldExpand ? 0.8 : 0 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-semibold">
                  {getUserInitials(user?.name || user?.email || '')}
                </span>
              </div>
              <motion.div
                animate={{ 
                  opacity: shouldExpand ? 1 : 0,
                  width: shouldExpand ? "auto" : 0
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <span className="text-white text-sm font-medium">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </span>
              </motion.div>
            </motion.div>
            
            <motion.button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
              animate={{ opacity: shouldExpand ? 1 : 0 }}
              transition={{ delay: shouldExpand ? 0.9 : 0 }}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <motion.span
                animate={{ 
                  opacity: shouldExpand ? 1 : 0,
                  width: shouldExpand ? "auto" : 0
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Logout
              </motion.span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="w-full">
        {children}
      </div>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
