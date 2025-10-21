"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const meteors = new Array(number || 20).fill(true);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {meteors.map((el, idx) => {
        const meteorCount = number || 20;
        // Calculate position to evenly distribute meteors across full container width
        const position = (idx / meteorCount) * 100; // Percentage-based positioning

        return (
          <span
            key={"meteor" + idx}
            className={cn(
              "animate-meteor-effect absolute h-0.5 w-0.5 rotate-[45deg] rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10]",
              "before:absolute before:top-1/2 before:h-[1px] before:w-[50px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-[#64748b] before:to-transparent before:content-['']",
              className,
            )}
            style={{
              top: "-40px", // Start above the container
              left: position + "%", // Use percentage for full width coverage
              animationDelay: Math.random() * 8 + "s", // Random delay between 0-8s (slower)
              animationDuration: Math.floor(Math.random() * (15 - 8) + 8) + "s", // Slower duration (8-15s)
            }}
          ></span>
        );
      })}
    </motion.div>
  );
};

