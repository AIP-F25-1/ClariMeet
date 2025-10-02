"use client"

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, User } from 'lucide-react'

export const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth()

  if (!user) {
    return null
  }

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) // Take only first 2 initials
  }

  const initials = user.name ? getInitials(user.name) : 'U'

  return (
    <div className="flex items-center gap-3 bg-black/40 rounded-xl p-3 border border-cyan-400/20">
      {/* User Avatar */}
      <div className="relative">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-10 h-10 rounded-full border-2 border-cyan-400/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center border-2 border-cyan-400/30">
            <span className="text-white text-lg font-bold">
              {initials}
            </span>
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">
          {user.name}
        </p>
        <p className="text-gray-400 text-xs truncate">
          {user.email}
        </p>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={signOut}
        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  )
}

// Compact version for header
export const UserProfileCompact: React.FC = () => {
  const { user, signOut } = useAuth()

  if (!user) {
    return null
  }

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) // Take only first 2 initials
  }

  const initials = user.name ? getInitials(user.name) : 'U'

  return (
    <div className="flex items-center gap-2">
      {/* User Avatar with Initials */}
      <div className="relative group">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full border border-cyan-400/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center border border-cyan-400/30">
            <span className="text-white text-sm font-bold">
              {initials}
            </span>
          </div>
        )}
        
        {/* Online Status Indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
        
        {/* Tooltip on Hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {user.name}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={signOut}
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  )
}
