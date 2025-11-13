"use client";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import AnimatedBackground from "@/components/ui/animated-background";
import { SimpleTracingBeam } from "@/components/ui/simple-tracing-beam";
import { Check, Zap, Crown, Building2 } from "lucide-react";
import Link from "next/link";

const pricingTiers = [
  {
    id: "basic",
    name: "Basic",
    price: "$9",
    period: "month",
    description: "Perfect for individuals getting started",
    icon: Zap,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-400/40",
    popular: false,
    features: [
      "Up to 10 meetings per month",
      "Basic transcript generation",
      "Standard video playback",
      "Speaker identification",
      "Search within transcripts",
      "Email support",
      "5 AI summaries per month",
      "Basic action items tracking",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "month",
    description: "Best for teams and power users",
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-400/40",
    popular: true,
    features: [
      "Up to 100 meetings per month",
      "Advanced transcript generation",
      "Live captions & synchronization",
      "AI-powered summaries",
      "Action items extraction",
      "Decisions tracking",
      "Priority email support",
      "50 AI summaries per month",
      "Advanced search & filters",
      "Video upload & management",
      "Custom meeting tags",
      "Export transcripts (PDF, DOCX)",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    period: "month",
    description: "For organizations with advanced needs",
    icon: Building2,
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-400/40",
    popular: false,
    features: [
      "Unlimited meetings",
      "Advanced AI transcript generation",
      "Real-time live captions",
      "Unlimited AI summaries",
      "Advanced action items & decisions",
      "Team collaboration features",
      "Priority 24/7 support",
      "Advanced analytics & insights",
      "Custom integrations (API access)",
      "White-label options",
      "SSO & advanced security",
      "Dedicated account manager",
      "Custom AI model training",
      "Bulk operations",
      "Advanced reporting",
    ],
  },
];

export default function SubscribePage() {
  return (
    <div className="min-h-screen relative bg-black">
      {/* Animated Background Component */}
      <AnimatedBackground />

      {/* Simple Tracing Beam */}
      <SimpleTracingBeam />

      <Header />

      <main className="relative z-20 pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Select the perfect plan for your meeting transcription and AI analysis needs
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {pricingTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.id}
                  className={`relative bg-black/60 backdrop-blur-xl rounded-3xl border ${tier.borderColor} shadow-2xl p-8 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] ${
                    tier.popular ? "ring-2 ring-purple-400/50" : ""
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div className={`${tier.bgColor} p-4 rounded-2xl inline-block mb-4`}>
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${tier.color}`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                    <p className="text-gray-400 text-sm mb-6">{tier.description}</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-white">{tier.price}</span>
                      <span className="text-gray-400">/{tier.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`w-full bg-gradient-to-r ${tier.color} hover:opacity-90 text-white font-semibold py-6 rounded-xl transition-all duration-300 transform hover:scale-105`}
                  >
                    <Link href={`/subscribe/${tier.id}`}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">
                  Can I change my plan later?
                </h3>
                <p className="text-gray-300 text-sm">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">
                  What happens if I exceed my limit?
                </h3>
                <p className="text-gray-300 text-sm">
                  We'll notify you when you're approaching your limit. You can upgrade or purchase additional credits.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-300 text-sm">
                  Yes, we offer a 30-day money-back guarantee for all plans. No questions asked.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">
                  Is my data secure?
                </h3>
                <p className="text-gray-300 text-sm">
                  Absolutely. We use enterprise-grade encryption and comply with GDPR and SOC 2 standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}

