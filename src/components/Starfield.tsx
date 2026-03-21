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
  driftAngle: number;
  color: [number, number, number];
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: [number, number, number];
}

interface CuteFloater {
  x: number;
  y: number;
  emoji: string;
  size: number;
  life: number;
  maxLife: number;
  wobblePhase: number;
  wobbleSpeed: number;
  floatSpeed: number;
  rotation: number;
  rotationSpeed: number;
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
    let shootingStars: ShootingStar[] = [];
    let cuteFloaters: CuteFloater[] = [];
    let time = 0;
    const isStarfield = theme === "starfield";
    const cuteEmojis = ["\uD83D\uDC3B", "\uD83D\uDC30", "\uD83C\uDF1F", "\uD83C\uDF38", "\uD83C\uDF6D", "\uD83E\uDDE1", "\uD83C\uDF80", "\uD83D\uDC31", "\uD83C\uDF3C", "\uD83E\uDD8B", "\u2B50", "\uD83C\uDF40", "\uD83D\uDC3E", "\uD83C\uDF37"];

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
              ? Math.random() * 3.5 + 1
              : isStarfield
                ? Math.random() * 2.5 + 0.3
                : Math.random() * 2 + 0.3,
          baseOpacity,
          opacity: baseOpacity,
          speed: isStarfield
            ? Math.random() * 0.4 + 0.08
            : Math.random() * 0.2 + 0.02,
          twinkleSpeed: isStarfield
            ? Math.random() * 0.05 + 0.01
            : Math.random() * 0.03 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          driftAngle: Math.random() * Math.PI * 2,
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
        } else if (isStarfield) {
          // Lively drift: each star floats in its own direction with gentle wandering
          const driftX = Math.cos(star.driftAngle) * star.speed * 0.3 * themeSpeed;
          const driftY = Math.sin(star.driftAngle) * star.speed * 0.3 * themeSpeed;
          // Add a slow sine weave on top
          star.x += driftX + Math.sin(time * 0.003 + star.twinklePhase) * 0.12;
          star.y += driftY + Math.cos(time * 0.002 + star.twinklePhase * 1.3) * 0.08;
          // Slowly rotate drift angle for organic wandering
          star.driftAngle += (Math.sin(time * 0.0005 + star.twinklePhase) * 0.002);
        } else {
          // Light/default: slow drift
          star.y += star.speed * 0.08 * themeSpeed;
          star.x += Math.sin(time * 0.001 + star.twinklePhase) * 0.02;
        }

        // Wrap around edges
        if (star.x > canvas!.width + 5) star.x = -5;
        if (star.x < -5) star.x = canvas!.width + 5;
        if (star.y > canvas!.height + 5) {
          star.y = -5;
          if (!isStarfield) star.x = Math.random() * canvas!.width;
        }
        if (star.y < -5) {
          star.y = canvas!.height + 5;
          if (!isStarfield) star.x = Math.random() * canvas!.width;
        }
      }

      // Starfield: shooting stars
      if (isStarfield) {
        // Spawn occasionally
        if (Math.random() < 0.008) {
          const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.2; // mostly diagonal
          const spd = 4 + Math.random() * 6;
          shootingStars.push({
            x: Math.random() * canvas!.width * 0.8,
            y: Math.random() * canvas!.height * 0.3,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0,
            maxLife: 30 + Math.random() * 30,
            size: 1.5 + Math.random() * 1.5,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }

        // Draw and update shooting stars
        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const ss = shootingStars[i];
          ss.life++;
          ss.x += ss.vx;
          ss.y += ss.vy;

          const progress = ss.life / ss.maxLife;
          const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
          const [sr, sg, sb] = ss.color;

          // Trail
          const tailLen = 6;
          for (let t = 0; t < tailLen; t++) {
            const tAlpha = alpha * (1 - t / tailLen) * 0.5;
            ctx!.beginPath();
            ctx!.arc(ss.x - ss.vx * t * 0.4, ss.y - ss.vy * t * 0.4, ss.size * (1 - t / tailLen * 0.5), 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${tAlpha})`;
            ctx!.fill();
          }

          // Head glow
          const grd = ctx!.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, ss.size * 4);
          grd.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, ${alpha * 0.6})`);
          grd.addColorStop(1, `rgba(${sr}, ${sg}, ${sb}, 0)`);
          ctx!.beginPath();
          ctx!.arc(ss.x, ss.y, ss.size * 4, 0, Math.PI * 2);
          ctx!.fillStyle = grd;
          ctx!.fill();

          if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
        }
      }

      // Cybernetics: occasional scan lines
      if (isCybernetics) {
        const scanY = (time * 1.5) % canvas!.height;
        ctx!.fillStyle = `rgba(0, 232, 123, 0.015)`;
        ctx!.fillRect(0, scanY, canvas!.width, 2);
      }

      // Cute theme: occasional plushie floaters
      if (isCute) {
        // Spawn frequently, anywhere on screen
        if (Math.random() < 0.02) {
          cuteFloaters.push({
            x: Math.random() * canvas!.width,
            y: Math.random() * canvas!.height,
            emoji: cuteEmojis[Math.floor(Math.random() * cuteEmojis.length)],
            size: 20 + Math.random() * 16,
            life: 0,
            maxLife: 240 + Math.random() * 180,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            floatSpeed: 0.15 + Math.random() * 0.25,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.015,
          });
        }

        for (let i = cuteFloaters.length - 1; i >= 0; i--) {
          const f = cuteFloaters[i];
          f.life++;

          // Float upward
          f.y -= f.floatSpeed;
          // Gentle side-to-side wobble
          f.x += Math.sin(f.life * f.wobbleSpeed + f.wobblePhase) * 0.8;
          f.rotation += f.rotationSpeed;

          // Fade in / hold / fade out
          const progress = f.life / f.maxLife;
          let alpha: number;
          if (progress < 0.15) {
            alpha = progress / 0.15;
          } else if (progress > 0.7) {
            alpha = 1 - (progress - 0.7) / 0.3;
          } else {
            alpha = 1;
          }
          // Visible but not overwhelming
          alpha *= 0.65;

          ctx!.save();
          ctx!.translate(f.x, f.y);
          ctx!.rotate(f.rotation);
          ctx!.globalAlpha = alpha;
          ctx!.font = `${f.size}px serif`;
          ctx!.textAlign = "center";
          ctx!.textBaseline = "middle";
          ctx!.fillText(f.emoji, 0, 0);
          ctx!.restore();
          ctx!.globalAlpha = 1;

          if (f.life >= f.maxLife) cuteFloaters.splice(i, 1);
        }
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
