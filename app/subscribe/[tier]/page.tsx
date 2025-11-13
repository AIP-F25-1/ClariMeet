"use client";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import AnimatedBackground from "@/components/ui/animated-background";
import { SimpleTracingBeam } from "@/components/ui/simple-tracing-beam";
import { Check, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const pricingTiers: Record<string, {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
}> = {
  basic: {
    id: "basic",
    name: "Basic",
    price: "$9",
    period: "month",
    description: "Perfect for individuals getting started",
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
  pro: {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "month",
    description: "Best for teams and power users",
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
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    period: "month",
    description: "For organizations with advanced needs",
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
};

export default function SubscribeTierPage() {
  const params = useParams();
  const router = useRouter();
  const tierId = params.tier as string;
  const tier = pricingTiers[tierId];

  if (!tier) {
    return (
      <div className="min-h-screen relative bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Plan Not Found</h1>
          <p className="text-gray-300 mb-6">The subscription plan you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/subscribe">Back to Plans</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    // TODO: Integrate with payment processor (Stripe, PayPal, etc.)
    alert(`Redirecting to payment for ${tier.name} plan...\n\nThis would typically integrate with a payment processor like Stripe.`);
  };

  return (
    <div className="min-h-screen relative bg-black">
      {/* Animated Background Component */}
      <AnimatedBackground />

      {/* Simple Tracing Beam */}
      <SimpleTracingBeam />

      <Header />

      <main className="relative z-20 pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-6">
          {/* Back Button */}
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </Link>

          {/* Checkout Card */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Subscribe to {tier.name}
              </h1>
              <p className="text-xl text-gray-300 mb-6">{tier.description}</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl font-bold text-white">{tier.price}</span>
                <span className="text-gray-400 text-xl">/{tier.period}</span>
              </div>
            </div>

            {/* Features List */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">What's included:</h2>
              <ul className="space-y-4">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment Section */}
            <div className="border-t border-cyan-400/30 pt-8">
              <h2 className="text-2xl font-bold text-white mb-6">Payment Information</h2>
              <div className="bg-black/40 rounded-xl p-6 border border-cyan-400/20 mb-6">
                <p className="text-gray-300 text-sm mb-4">
                  Secure payment processing will be integrated here. This is a placeholder for the payment form.
                </p>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment methods: Credit Card, PayPal, Bank Transfer</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-lg"
              >
                <CreditCard className="w-5 h-5" />
                Proceed to Checkout
              </Button>

              <p className="text-center text-gray-400 text-sm mt-4">
                30-day money-back guarantee • Cancel anytime
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Need help choosing?</h3>
            <p className="text-gray-300 text-sm mb-4">
              Our support team is here to help you find the perfect plan for your needs.
            </p>
            <Link
              href="mailto:support@clarimeet.com"
              className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

