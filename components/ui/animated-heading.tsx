"use client"
import { gsap } from "gsap";
import React, { useEffect, useRef, useState } from "react";

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  delay?: number;
}

const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({
  text,
  className = "",
  delay = 0
}) => {
  const ref = useRef<HTMLHeadingElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && ref.current) {
      const chars = ref.current.textContent?.split("") || [];
      ref.current.innerHTML = chars
        .map((char, index) => `<span style="display: inline-block; opacity: 0; transform: translateY(20px);">${char === " " ? "&nbsp;" : char}</span>`)
        .join("");

      const spans = ref.current.querySelectorAll("span");

      gsap.to(spans, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.05,
        delay: delay
      });
    }
  }, [isVisible, delay]);

  return (
    <h1 ref={ref} className={className}>
      {text}
    </h1>
  );
};

export default AnimatedHeading;
