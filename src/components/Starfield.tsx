"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { getTheme } from "@/lib/themes";

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: [number, number, number];
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const themeConfig = getTheme(theme);
    const { colors, density, speed: themeSpeed, glowIntensity } = themeConfig.starfield;
    const isCybernetics = theme === "cybernetics";
    const isLight = theme === "light";
    const isCute = theme === "cute";

    let animationId: number;
    let stars: Star[] = [];
    let time = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initStars();
    }

    function initStars() {
      stars = [];
      const count = Math.floor((canvas!.width * canvas!.height) / density);
      for (let i = 0; i < count; i++) {
        const baseOpacity = isLight
          ? Math.random() * 0.3 + 0.05
          : isCute
            ? Math.random() * 0.4 + 0.2
            : Math.random() * 0.6 + 0.1;
        stars.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          size: isCybernetics
            ? Math.random() * 1.5 + 0.2
            : isCute
              ? Math.random() * 3.5 + 1 // bigger, bubbly particles
              : Math.random() * 2 + 0.3,
          baseOpacity,
          opacity: baseOpacity,
          speed: Math.random() * 0.2 + 0.02,
          twinkleSpeed: Math.random() * 0.03 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    function draw() {
      time += 1;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const star of stars) {
        // Smooth sine-based twinkle
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        star.opacity = star.baseOpacity + twinkle * 0.3;
        star.opacity = Math.max(0.02, Math.min(0.9, star.opacity));

        const [r, g, b] = star.color;

        // Outer glow for brighter stars
        if (star.size > 1.2 && star.opacity > 0.4) {
          const gradient = ctx!.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 3
          );
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${star.opacity * glowIntensity})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx!.beginPath();
          ctx!.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx!.fillStyle = gradient;
          ctx!.fill();
        }

        // Star core
        ctx!.beginPath();
        if (isCybernetics) {
          // Square pixels for cybernetics theme
          ctx!.rect(
            star.x - star.size / 2,
            star.y - star.size / 2,
            star.size,
            star.size
          );
        } else {
          ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        }
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.opacity})`;
        ctx!.fill();

        // Movement
        if (isCybernetics) {
          // Data rain: mostly downward, slight horizontal jitter
          star.y += star.speed * 0.08 * themeSpeed * 3;
          star.x += (Math.random() - 0.5) * 0.1;
        } else if (isCute) {
          // Gentle float upward with wobbly sine drift
          star.y -= star.speed * 0.04 * themeSpeed;
          star.x += Math.sin(time * 0.002 + star.twinklePhase) * 0.15;
        } else {
          // Default: slow drift
          star.y += star.speed * 0.08 * themeSpeed;
          star.x += Math.sin(time * 0.001 + star.twinklePhase) * 0.02;
        }

        if (star.y > canvas!.height + 5) {
          star.y = -5;
          star.x = Math.random() * canvas!.width;
        } else if (isCute && star.y < -5) {
          star.y = canvas!.height + 5;
          star.x = Math.random() * canvas!.width;
        }
      }

      // Cybernetics: occasional scan lines
      if (isCybernetics) {
        const scanY = (time * 1.5) % canvas!.height;
        ctx!.fillStyle = `rgba(0, 232, 123, 0.015)`;
        ctx!.fillRect(0, scanY, canvas!.width, 2);
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}
