"use client"

import { useAuth } from "@/contexts/AuthContext"
import {
    BarChart3,
    Brain,
    Calendar,
    FileText,
    Home,
    LogOut
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"
import {
    Sidebar,
    SidebarBody,
    SidebarLink
} from "./sidebar"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Meetings",
    href: "/dashboard/meetings",
    icon: Calendar,
  },
  {
    title: "Transcriptions",
    href: "/dashboard/transcriptions", 
    icon: FileText,
  },
  {
    title: "Summaries",
    href: "/dashboard/summaries",
    icon: BarChart3,
  },
  {
    title: "AI Tools",
    href: "/dashboard/ai-tools",
    icon: Brain,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [open, setOpen] = React.useState(false)

  const getUserInitials = (name: string) => {
    if (!name) return 'U'
    
    const names = name.trim().split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  return (
    <Sidebar open={open} setOpen={setOpen} className="bg-black/90 border-cyan-400/20">
      <SidebarBody className="justify-between gap-10 bg-black/90">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          
          <div className="mt-8 flex flex-col gap-2">
            {navigationItems.map((item, index) => (
              <div
                key={item.title}
                className="animate-fade-in-left"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <SidebarLink
                  link={{
                    label: item.title,
                    href: item.href,
                    icon: <item.icon className="h-5 w-5 shrink-0 text-gray-400" />,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <SidebarLink
            link={{
              label: user?.name || 'User',
              href: "#",
              icon: (
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {getUserInitials(user?.name || user?.email || '')}
                  </span>
                </div>
              ),
            }}
          />
          <div className="mt-2">
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: <LogOut className="h-5 w-5 shrink-0 text-gray-400" />,
              }}
              onClick={signOut}
            />
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  )
}

export const Logo = () => {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-8 w-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
        <span className="text-white text-sm font-bold">CM</span>
      </div>
      <span className="font-medium whitespace-pre text-white animate-fade-in">
        ClariMeet
      </span>
    </Link>
  )
}

export const LogoIcon = () => {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-8 w-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
        <span className="text-white text-sm font-bold">CM</span>
      </div>
    </Link>
  )
}
