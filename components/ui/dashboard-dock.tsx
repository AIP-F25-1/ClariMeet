'use client'

import {
    BarChart3,
    FileText,
    Home,
    Sparkles,
    Video,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

const dockItems = [
  {
    title: 'Home',
    icon: (
      <Home className='h-full w-full text-neutral-600 dark:text-neutral-300' />
    ),
    href: '/dashboard',
  },
  {
    title: 'Meetings',
    icon: (
      <Video className='h-full w-full text-neutral-600 dark:text-neutral-300' />
    ),
    href: '/dashboard/meetings',
  },
  {
    title: 'Transcriptions',
    icon: (
      <FileText className='h-full w-full text-neutral-600 dark:text-neutral-300' />
    ),
    href: '/dashboard/transcriptions',
  },
  {
    title: 'Summaries',
  icon: (
    <BarChart3 className='h-full w-full text-neutral-600 dark:text-neutral-300' />
  ),
  href: '/dashboard/summaries',
},
{
  title: 'AI Tools',
  icon: (
    <Sparkles className='h-full w-full text-neutral-600 dark:text-neutral-300' />
  ),
  href: '/dashboard/ai-tools',
},
]

export function DashboardDock() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className='fixed bottom-4 left-1/2 max-w-full -translate-x-1/2 z-50'>
      <div className='flex items-end gap-2 p-3 bg-gray-900/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 dark:border-gray-700/50 rounded-2xl shadow-2xl'>
        {dockItems.map((item, idx) => (
          <div
            key={idx}
            className={`group relative aspect-square w-12 h-12 rounded-full bg-gray-800/80 dark:bg-gray-700/80 hover:bg-gray-700/90 dark:hover:bg-gray-600/90 hover:scale-110 transition-transform duration-100 ease-out cursor-pointer flex items-center justify-center ${
              pathname === item.href
                ? 'ring-2 ring-cyan-500 dark:ring-cyan-400 bg-cyan-500/30 dark:bg-cyan-400/30'
                : ''
            }`}
            onClick={() => router.push(item.href)}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-100 whitespace-nowrap pointer-events-none">
              {item.title}
            </div>
            <div className="flex items-center justify-center">
              {item.icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
