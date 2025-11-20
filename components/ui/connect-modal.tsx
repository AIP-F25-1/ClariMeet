"use client";

import { X, ChevronLeft, ChevronRight, Video, Link2, Check } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const meetingPlatforms = [
  { id: "google-meet", name: "Google Meet", icon: "📹", enabled: false },
  { id: "zoom", name: "Zoom", icon: "🔗", enabled: false },
  { id: "teams", name: "Microsoft Teams", icon: "👥", enabled: false },
];

const integrations = [
  { id: "trello", name: "Trello", icon: "📋", enabled: false },
  { id: "slack", name: "Slack", icon: "💬", enabled: false },
  { id: "jira", name: "Jira", icon: "🎯", enabled: false },
];

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentScreen, setCurrentScreen] = useState<"meetings" | "integrations">("meetings");
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<string>>(new Set());
  const [enabledIntegrations, setEnabledIntegrations] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const togglePlatform = (id: string) => {
    setEnabledPlatforms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleIntegration = (id: string) => {
    setEnabledIntegrations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    if (currentScreen === "meetings") {
      setCurrentScreen("integrations");
    }
  };

  const handlePrev = () => {
    if (currentScreen === "integrations") {
      setCurrentScreen("meetings");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-black/90 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl max-w-2xl w-full p-8 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {currentScreen === "meetings" ? (
              <Video className="w-8 h-8 text-white" />
            ) : (
              <Link2 className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {currentScreen === "meetings" ? "Connect Meeting Platforms" : "Connect Integrations"}
          </h2>
          <p className="text-gray-300">
            {currentScreen === "meetings"
              ? "Enable ClariMeet for your favorite meeting platforms"
              : "Integrate with your favorite productivity tools"}
          </p>
        </div>

        {/* Content */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {currentScreen === "meetings" ? (
              <motion.div
                key="meetings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {meetingPlatforms.map((platform) => (
                  <div
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-center justify-between p-5 bg-black/40 rounded-xl border cursor-pointer transition-all duration-300 ${
                      enabledPlatforms.has(platform.id)
                        ? "border-cyan-400/60 bg-cyan-400/10"
                        : "border-cyan-400/20 hover:border-cyan-400/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{platform.icon}</span>
                      <div>
                        <h3 className="text-white font-semibold text-lg">{platform.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {platform.id === "google-meet" && "Record meetings and capture audio"}
                          {platform.id === "zoom" && "Integrate with Zoom SDK (Work in Progress)"}
                          {platform.id === "teams" && "Connect with Microsoft Teams"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        enabledPlatforms.has(platform.id)
                          ? "bg-cyan-400 border-cyan-400"
                          : "border-gray-500"
                      }`}
                    >
                      {enabledPlatforms.has(platform.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="integrations"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    onClick={() => toggleIntegration(integration.id)}
                    className={`flex items-center justify-between p-5 bg-black/40 rounded-xl border cursor-pointer transition-all duration-300 ${
                      enabledIntegrations.has(integration.id)
                        ? "border-cyan-400/60 bg-cyan-400/10"
                        : "border-cyan-400/20 hover:border-cyan-400/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{integration.icon}</span>
                      <div>
                        <h3 className="text-white font-semibold text-lg">{integration.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {integration.id === "trello" && "Sync action items to Trello boards"}
                          {integration.id === "slack" && "Send summaries to Slack channels"}
                          {integration.id === "jira" && "Create Jira issues from action items"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        enabledIntegrations.has(integration.id)
                          ? "bg-cyan-400 border-cyan-400"
                          : "border-gray-500"
                      }`}
                    >
                      {enabledIntegrations.has(integration.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-cyan-400/20">
          <button
            onClick={handlePrev}
            disabled={currentScreen === "meetings"}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              currentScreen === "meetings"
                ? "opacity-50 cursor-not-allowed text-gray-500"
                : "text-cyan-400 hover:text-white hover:bg-cyan-400/10"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex gap-2">
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                currentScreen === "meetings" ? "bg-cyan-400" : "bg-gray-600"
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                currentScreen === "integrations" ? "bg-cyan-400" : "bg-gray-600"
              }`}
            />
          </div>

          <button
            onClick={handleNext}
            disabled={currentScreen === "integrations"}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              currentScreen === "integrations"
                ? "opacity-50 cursor-not-allowed text-gray-500"
                : "text-cyan-400 hover:text-white hover:bg-cyan-400/10"
            }`}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Done Button (only on integrations screen) */}
        {currentScreen === "integrations" && (
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

