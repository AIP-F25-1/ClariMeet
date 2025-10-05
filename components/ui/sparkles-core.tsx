"use client";
import React, { useEffect, useRef } from "react";

interface SparklesCoreProps {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  className?: string;
  particleColor?: string;
}

export const SparklesCore: React.FC<SparklesCoreProps> = ({
  id = "sparkles",
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  particleDensity = 100,
  className = "",
  particleColor = "#FFFFFF"
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      let animationFrameId: number;
      const particles: Particle[] = [];

      class Particle {
        x: number;
        y: number;
        size: number;
        opacity: number;
        speed: number;
        direction: number;
        twinkleSpeed: number;
        twinkleDirection: number;

        constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * (maxSize - minSize) + minSize;
          this.opacity = Math.random();
          this.speed = Math.random() * 0.5 + 0.1; // Slower movement
          this.direction = Math.random() * Math.PI * 2; // Random direction
          this.twinkleSpeed = Math.random() * 0.05 + 0.01; // Slower twinkle
          this.twinkleDirection = Math.random() > 0.5 ? 1 : -1;
        }

        update() {
          this.x += Math.cos(this.direction) * this.speed;
          this.y += Math.sin(this.direction) * this.speed;

          // Wrap particles around the screen
          if (this.x < 0) this.x = canvas.width;
          if (this.x > canvas.width) this.x = 0;
          if (this.y < 0) this.y = canvas.height;
          if (this.y > canvas.height) this.y = 0;

          this.opacity += this.twinkleSpeed * this.twinkleDirection;
          if (this.opacity > 1 || this.opacity < 0) {
            this.twinkleDirection *= -1;
          }
        }

        draw() {
          if (!ctx) return;

          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.direction);

          // Draw a cross shape
          ctx.beginPath();
          ctx.moveTo(-this.size, 0);
          ctx.lineTo(this.size, 0);
          ctx.moveTo(0, -this.size);
          ctx.lineTo(0, this.size);
          ctx.strokeStyle = particleColor;
          ctx.lineWidth = 1;
          ctx.globalAlpha = this.opacity;
          ctx.stroke();

          // Draw a small circle in the center
          ctx.beginPath();
          ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = particleColor;
          ctx.globalAlpha = this.opacity;
          ctx.fill();

          ctx.restore();
        }
      }

      const initParticles = () => {
        for (let i = 0; i < particleDensity; i++) {
          particles.push(new Particle());
        }
      };

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Re-initialize particles on resize to distribute them correctly
        particles.length = 0;
        initParticles();
      };

      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();

      const animate = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
          particles[i].update();
          particles[i].draw();
        }

        animationFrameId = requestAnimationFrame(animate);
      };

      initParticles();
      animate();

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [background, minSize, maxSize, particleDensity, particleColor]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ background: background }}
    />
  );
};
