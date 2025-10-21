"use client";
import { BarChart3, FileText, Sparkles, Video } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import React, { Suspense } from "react";

// Dynamically import CanvasRevealEffect to avoid SSR issues
const CanvasRevealEffect = dynamic(
  () => import("@/components/ui/canvas-reveal-effect").then((mod) => ({ default: mod.CanvasRevealEffect })),
  { ssr: false }
);

export function AnimatedDashboardCards() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <AnimatedCard 
          title="My Meetings" 
          description="View all meetings"
          icon={<Video className="h-12 w-12 text-white" />}
          href="/dashboard/meetings"
          colors={[[59, 130, 246], [139, 92, 246]]}
        />
        
        <AnimatedCard 
          title="Transcriptions" 
          description="View transcriptions"
          icon={<FileText className="h-12 w-12 text-white" />}
          href="/dashboard/transcriptions"
          colors={[[34, 197, 94], [16, 185, 129]]}
        />
        
        <AnimatedCard 
          title="Summaries" 
          description="View summaries"
          icon={<BarChart3 className="h-12 w-12 text-white" />}
          href="/dashboard/summaries"
          colors={[[236, 72, 153], [232, 121, 249]]}
        />
        
        <AnimatedCard 
          title="AI Tools" 
          description="AI features"
          icon={<Sparkles className="h-12 w-12 text-white" />}
          href="/dashboard/ai-tools"
          colors={[[6, 182, 212], [14, 165, 233]]}
        />
      </div>
    </div>
  );
}

const AnimatedCard = ({
  title,
  description,
  icon,
  href,
  colors,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  colors: number[][];
}) => {
  const [hovered, setHovered] = React.useState(false);
  
  return (
    <Link href={href} className="block">
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="border border-gray-600/30 group/canvas-card flex items-center justify-center dark:border-white/[0.2] w-full p-6 relative h-[20rem] bg-black rounded-3xl shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 hover:scale-105"
          >
        <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-white" />
        <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-white" />
        <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-white" />
        <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-white" />

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full w-full absolute inset-0 rounded-3xl overflow-hidden"
            >
              <Suspense fallback={<div />}>
                <CanvasRevealEffect
                  animationSpeed={1.8}
                  containerClassName="bg-black"
                  colors={colors}
                  dotSize={5}
                  opacities={[0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
                />
              </Suspense>
              {/* Radial gradient for the cute fade */}
              <div className="absolute inset-0 [mask-image:radial-gradient(400px_at_center,white,transparent)] bg-black/50 dark:bg-black/90" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-20 text-center">
          <div className="text-center group-hover/canvas-card:-translate-y-4 group-hover/canvas-card:opacity-0 transition duration-200 w-full mx-auto flex items-center justify-center">
            {icon}
          </div>
          <h2 className="dark:text-white text-xl opacity-0 group-hover/canvas-card:opacity-100 relative z-10 text-white mt-4 font-bold group-hover/canvas-card:text-white group-hover/canvas-card:-translate-y-2 transition duration-200">
            {title}
          </h2>
          <p className="dark:text-gray-300 text-sm opacity-0 group-hover/canvas-card:opacity-100 relative z-10 text-gray-300 mt-2 group-hover/canvas-card:text-white group-hover/canvas-card:-translate-y-2 transition duration-200">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};
