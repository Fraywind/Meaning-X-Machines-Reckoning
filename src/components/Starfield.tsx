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

interface Floater {
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
    const isNature = theme === "nature";

    let animationId: number;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let floaters: Floater[] = [];
    let time = 0;
    const isStarfield = theme === "starfield";

    // Cute emojis (no animals except butterflies)
    const cuteEmojis = ["\uD83D\uDC3B", "\uD83D\uDC30", "\uD83C\uDF1F", "\uD83C\uDF38", "\uD83C\uDF6D", "\uD83E\uDDE1", "\uD83C\uDF80", "\uD83D\uDC31", "\uD83C\uDF3C", "\uD83E\uDD8B", "\u2B50", "\uD83C\uDF40", "\uD83D\uDC3E", "\uD83C\uDF37"];

    // Nature emojis: trees (varied), butterflies, leaves — no animals
    const natureTrees = ["\uD83C\uDF32", "\uD83C\uDF33", "\uD83C\uDF34", "\uD83C\uDF35", "\uD83C\uDFD4\uFE0F"];
    const natureButterflies = ["\uD83E\uDD8B"];
    const natureLeaves = ["\uD83C\uDF42", "\uD83C\uDF43", "\uD83C\uDF41", "\uD83C\uDF3F", "\uD83C\uDF40"];
    // Pick a random set of 2-4 tree types for this session
    const sessionTreeCount = 2 + Math.floor(Math.random() * 3); // 2-4 trees
    const shuffledTrees = [...natureTrees].sort(() => Math.random() - 0.5);
    const sessionTrees = shuffledTrees.slice(0, sessionTreeCount);

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initStars();
      if (isNature) initNatureTrees();
    }

    // Place static trees at the bottom on init (different each load)
    let staticTrees: { x: number; emoji: string; size: number; sway: number; swayPhase: number }[] = [];

    function initNatureTrees() {
      staticTrees = [];
      const treeCount = 4 + Math.floor(Math.random() * 4); // 4-7 trees
      for (let i = 0; i < treeCount; i++) {
        staticTrees.push({
          x: (canvas!.width * (i + 0.3 + Math.random() * 0.4)) / treeCount,
          emoji: sessionTrees[Math.floor(Math.random() * sessionTrees.length)],
          size: 32 + Math.random() * 28, // 32-60px
          sway: 0.3 + Math.random() * 0.5,
          swayPhase: Math.random() * Math.PI * 2,
        });
      }
    }

    function initStars() {
      stars = [];
      const count = Math.floor((canvas!.width * canvas!.height) / density);
      for (let i = 0; i < count; i++) {
        const baseOpacity = isLight
          ? Math.random() * 0.3 + 0.05
          : isCute
            ? Math.random() * 0.4 + 0.2
            : isNature
              ? Math.random() * 0.35 + 0.1
              : Math.random() * 0.6 + 0.1;
        stars.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          size: isCybernetics
            ? Math.random() * 1.5 + 0.2
            : isCute
              ? Math.random() * 3.5 + 1
              : isNature
                ? Math.random() * 2.5 + 0.5
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
          star.y += star.speed * 0.08 * themeSpeed * 3;
          star.x += (Math.random() - 0.5) * 0.1;
        } else if (isCute) {
          star.y -= star.speed * 0.04 * themeSpeed;
          star.x += Math.sin(time * 0.002 + star.twinklePhase) * 0.15;
        } else if (isNature) {
          // Firefly-like: slow wandering with occasional pauses
          const fireflyCycle = Math.sin(time * 0.001 + star.twinklePhase * 3);
          const isResting = fireflyCycle < -0.5;
          if (!isResting) {
            star.x += Math.sin(time * 0.002 + star.driftAngle) * 0.2 * themeSpeed;
            star.y += Math.cos(time * 0.0015 + star.driftAngle * 1.5) * 0.15 * themeSpeed;
            star.driftAngle += Math.sin(time * 0.0003 + star.twinklePhase) * 0.003;
          }
        } else if (isStarfield) {
          const driftX = Math.cos(star.driftAngle) * star.speed * 0.3 * themeSpeed;
          const driftY = Math.sin(star.driftAngle) * star.speed * 0.3 * themeSpeed;
          star.x += driftX + Math.sin(time * 0.003 + star.twinklePhase) * 0.12;
          star.y += driftY + Math.cos(time * 0.002 + star.twinklePhase * 1.3) * 0.08;
          star.driftAngle += (Math.sin(time * 0.0005 + star.twinklePhase) * 0.002);
        } else {
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
        if (Math.random() < 0.008) {
          const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.2;
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

        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const ss = shootingStars[i];
          ss.life++;
          ss.x += ss.vx;
          ss.y += ss.vy;

          const progress = ss.life / ss.maxLife;
          const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
          const [sr, sg, sb] = ss.color;

          const tailLen = 6;
          for (let t = 0; t < tailLen; t++) {
            const tAlpha = alpha * (1 - t / tailLen) * 0.5;
            ctx!.beginPath();
            ctx!.arc(ss.x - ss.vx * t * 0.4, ss.y - ss.vy * t * 0.4, ss.size * (1 - t / tailLen * 0.5), 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${tAlpha})`;
            ctx!.fill();
          }

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

      // Cybernetics: scan lines
      if (isCybernetics) {
        const scanY = (time * 1.5) % canvas!.height;
        ctx!.fillStyle = `rgba(0, 232, 123, 0.015)`;
        ctx!.fillRect(0, scanY, canvas!.width, 2);
      }

      // Cute theme: emoji floaters
      if (isCute) {
        if (Math.random() < 0.02) {
          floaters.push({
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

        for (let i = floaters.length - 1; i >= 0; i--) {
          const f = floaters[i];
          f.life++;
          f.y -= f.floatSpeed;
          f.x += Math.sin(f.life * f.wobbleSpeed + f.wobblePhase) * 0.8;
          f.rotation += f.rotationSpeed;

          const progress = f.life / f.maxLife;
          let alpha: number;
          if (progress < 0.15) {
            alpha = progress / 0.15;
          } else if (progress > 0.7) {
            alpha = 1 - (progress - 0.7) / 0.3;
          } else {
            alpha = 1;
          }
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

          if (f.life >= f.maxLife) floaters.splice(i, 1);
        }
      }

      // Nature theme: static trees at bottom + floating butterflies + falling leaves
      if (isNature) {
        // Draw static trees at the bottom with gentle sway
        for (const tree of staticTrees) {
          const swayOffset = Math.sin(time * 0.008 * tree.sway + tree.swayPhase) * 2;
          ctx!.save();
          ctx!.globalAlpha = 0.35;
          ctx!.font = `${tree.size}px serif`;
          ctx!.textAlign = "center";
          ctx!.textBaseline = "bottom";
          ctx!.fillText(tree.emoji, tree.x + swayOffset, canvas!.height + 4);
          ctx!.restore();
          ctx!.globalAlpha = 1;
        }

        // Spawn butterflies (slightly more frequent)
        if (Math.random() < 0.012) {
          floaters.push({
            x: Math.random() * canvas!.width,
            y: canvas!.height * 0.3 + Math.random() * canvas!.height * 0.5,
            emoji: natureButterflies[Math.floor(Math.random() * natureButterflies.length)],
            size: 16 + Math.random() * 12,
            life: 0,
            maxLife: 300 + Math.random() * 250,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.04 + Math.random() * 0.03,
            floatSpeed: 0.08 + Math.random() * 0.12,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
          });
        }

        // Spawn falling leaves (frequent, gentle)
        if (Math.random() < 0.025) {
          floaters.push({
            x: Math.random() * canvas!.width,
            y: -20,
            emoji: natureLeaves[Math.floor(Math.random() * natureLeaves.length)],
            size: 14 + Math.random() * 10,
            life: 0,
            maxLife: 400 + Math.random() * 300,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.015 + Math.random() * 0.02,
            floatSpeed: 0.3 + Math.random() * 0.4, // falling speed
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.025,
          });
        }

        // Draw and update nature floaters
        for (let i = floaters.length - 1; i >= 0; i--) {
          const f = floaters[i];
          f.life++;

          // Butterflies flutter around; leaves fall down
          const isLeaf = f.emoji !== "\uD83E\uDD8B";
          if (isLeaf) {
            // Leaves fall with side-to-side sway
            f.y += f.floatSpeed;
            f.x += Math.sin(f.life * f.wobbleSpeed + f.wobblePhase) * 1.2;
          } else {
            // Butterflies flutter upward with erratic path
            f.y -= f.floatSpeed * 0.5;
            f.x += Math.sin(f.life * f.wobbleSpeed + f.wobblePhase) * 1.5;
            f.y += Math.cos(f.life * f.wobbleSpeed * 0.7 + f.wobblePhase) * 0.8;
          }
          f.rotation += f.rotationSpeed;

          const progress = f.life / f.maxLife;
          let alpha: number;
          if (progress < 0.1) {
            alpha = progress / 0.1;
          } else if (progress > 0.75) {
            alpha = 1 - (progress - 0.75) / 0.25;
          } else {
            alpha = 1;
          }
          alpha *= isLeaf ? 0.5 : 0.6;

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

          // Remove when off screen or expired
          if (f.life >= f.maxLife || f.y > canvas!.height + 30 || f.y < -50) {
            floaters.splice(i, 1);
          }
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
