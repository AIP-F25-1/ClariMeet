"use client";
import { useRouter } from "next/navigation";
import React from "react";

interface CardNavProps {
  className?: string;
}

const CardNav: React.FC<CardNavProps> = ({ className = "" }) => {
  const router = useRouter();

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "📊",
      description: "Overview and analytics"
    },
    {
      title: "Meetings",
      href: "/dashboard/meetings",
      icon: "🎥",
      description: "Manage your meetings"
    },
    {
      title: "Transcripts",
      href: "/dashboard/transcriptions",
      icon: "📝",
      description: "View transcripts"
    },
    {
      title: "Summaries",
      href: "/dashboard/summaries",
      icon: "📋",
      description: "AI-generated summaries"
    }
  ];

  return (
    <nav className={`space-y-2 ${className}`}>
      {navigationItems.map((item) => (
        <button
          key={item.href}
          onClick={() => router.push(item.href)}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-600/20 hover:border-cyan-400/40 hover:bg-gray-700/40 transition-all duration-300 text-left group"
        >
          <span className="text-2xl">{item.icon}</span>
          <div className="flex-1">
            <h3 className="text-white font-medium group-hover:text-cyan-400 transition-colors">
              {item.title}
            </h3>
            <p className="text-gray-400 text-sm">{item.description}</p>
          </div>
        </button>
      ))}
    </nav>
  );
};

export default CardNav;
