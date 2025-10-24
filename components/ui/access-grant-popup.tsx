"use client";
import { X } from "lucide-react";
import React from "react";

interface AccessGrantPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessGrantPopup: React.FC<AccessGrantPopupProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-cyan-400/30 shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">CM</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Get Started with ClariMeet
          </h2>
          
          <p className="text-gray-300 mb-6">
            Start your journey with AI-powered meeting insights and transcriptions.
          </p>

          <div className="space-y-3">
            <button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-cyan-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105">
              Sign Up for Free
            </button>
            
            <button className="w-full bg-gray-700/50 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-600/50 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
