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

interface BranchSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  growProgress: number;
  growSpeed: number;
  color: [number, number, number];
  children: BranchSegment[];
  hasSpawned: boolean;
  depth: number;
  swayPhase: number;
  angle: number;
  length: number;
  leaves: NatureLeaf[];
}

interface NatureLeaf {
  offsetX: number;
  offsetY: number;
  size: number;
  angle: number;
  color: [number, number, number];
  swayPhase: number;
}

interface CircuitLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  horizontal: boolean;
}

interface CircuitNode {
  x: number;
  y: number;
  size: number;
  pulsePhase: number;
  type: number; // 0=dot, 1=ring, 2=diamond, 3=square
}

interface DataPulse {
  line: CircuitLine;
  progress: number;
  speed: number;
  color: [number, number, number];
  size: number;
}

interface FallingLeaf {
  x: number;
  y: number;
  size: number;
  angle: number;
  rotationSpeed: number;
  color: [number, number, number];
  vx: number;
  vy: number;
  wobblePhase: number;
  wobbleSpeed: number;
  life: number;
  maxLife: number;
  leafType: number; // 0=oval, 1=pointed, 2=small twig
}

interface Butterfly {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  wingPhase: number;
  wingSpeed: number;
  color: [number, number, number];
  speed: number;
  life: number;
}

interface HangingAnimal {
  branchIndex: number;
  emoji: string;
  offsetT: number; // position along branch (0-1)
  swayPhase: number;
  size: number;
  spawned: boolean;
  opacity: number;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useStore((s) => s.theme);
  const hasStarted = useStore((s) => s.hasStarted);

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
    let cuteFloaters: CuteFloater[] = [];
    let branches: BranchSegment[] = [];
    let fallingLeaves: FallingLeaf[] = [];
    let butterflies: Butterfly[] = [];
    let hangingAnimals: HangingAnimal[] = [];
    let natureMature = false;
    let matureCheckTimer = 0;
    let circuitLines: CircuitLine[] = [];
    let circuitNodes: CircuitNode[] = [];
    let dataPulses: DataPulse[] = [];
    let time = 0;
    const isStarfield = theme === "starfield";
    const cuteEmojis = ["\uD83D\uDC3B", "\uD83D\uDC30", "\uD83C\uDF1F", "\uD83C\uDF38", "\uD83C\uDF6D", "\uD83E\uDDE1", "\uD83C\uDF80", "\uD83D\uDC31", "\uD83C\uDF3C", "\uD83E\uDD8B", "\u2B50", "\uD83C\uDF40", "\uD83D\uDC3E", "\uD83C\uDF37"];

    // Nature theme colors
    const barkColors: [number, number, number][] = [
      [120, 90, 60],   // warm wood
      [140, 105, 70],  // light wood
      [100, 75, 50],   // medium bark
      [130, 95, 65],   // sandy bark
    ];
    const leafColors: [number, number, number][] = [
      [75, 140, 66],   // forest green
      [95, 160, 80],   // leaf green
      [110, 170, 85],  // spring green
      [85, 150, 70],   // fresh green
      [130, 175, 95],  // lime-ish
      [60, 125, 55],   // deep green
    ];
    const autumnColors: [number, number, number][] = [
      [180, 120, 50],  // amber
      [165, 95, 45],   // rust
      [190, 140, 60],  // golden
      [155, 110, 55],  // copper
    ];

    function drawCanvasLeaf(cx: number, cy: number, size: number, angle: number, color: [number, number, number], alpha: number) {
      const [r, g, b] = color;
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(angle);
      ctx!.globalAlpha = alpha;

      // Leaf shape: elongated oval with a point
      ctx!.beginPath();
      ctx!.moveTo(0, -size * 0.5);
      ctx!.bezierCurveTo(size * 0.4, -size * 0.3, size * 0.4, size * 0.3, 0, size * 0.5);
      ctx!.bezierCurveTo(-size * 0.4, size * 0.3, -size * 0.4, -size * 0.3, 0, -size * 0.5);
      ctx!.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx!.fill();

      // Center vein
      ctx!.beginPath();
      ctx!.moveTo(0, -size * 0.4);
      ctx!.lineTo(0, size * 0.4);
      ctx!.strokeStyle = `rgba(${Math.max(0, r - 25)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 15)}, ${alpha * 0.5})`;
      ctx!.lineWidth = 0.5;
      ctx!.stroke();

      // Side veins
      for (let v = -1; v <= 1; v += 2) {
        for (let j = 0.15; j < 0.4; j += 0.15) {
          ctx!.beginPath();
          ctx!.moveTo(0, -size * j);
          ctx!.lineTo(size * 0.25 * v, -size * (j + 0.12));
          ctx!.strokeStyle = `rgba(${Math.max(0, r - 25)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 15)}, ${alpha * 0.3})`;
          ctx!.lineWidth = 0.3;
          ctx!.stroke();
        }
      }

      ctx!.restore();
      ctx!.globalAlpha = 1;
    }

    function createBranch(x: number, y: number, angle: number, length: number, thickness: number, depth: number): BranchSegment {
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      // Generate leaves along the branch — more at higher depths for full canopy
      const branchLeaves: NatureLeaf[] = [];
      if (depth >= 1) {
        const leafCount = depth >= 4 ? 5 + Math.floor(Math.random() * 5)
          : depth >= 3 ? 3 + Math.floor(Math.random() * 4)
          : depth >= 2 ? 2 + Math.floor(Math.random() * 3)
          : Math.floor(Math.random() * 2);
        for (let i = 0; i < leafCount; i++) {
          const t = 0.2 + Math.random() * 0.8;
          const spread = depth >= 3 ? 14 : 10;
          branchLeaves.push({
            offsetX: Math.cos(angle) * length * t + (Math.random() - 0.5) * spread,
            offsetY: Math.sin(angle) * length * t + (Math.random() - 0.5) * spread,
            size: depth >= 3 ? 6 + Math.random() * 9 : 4 + Math.random() * 6,
            angle: angle + (Math.random() - 0.5) * 2,
            color: Math.random() < 0.12
              ? autumnColors[Math.floor(Math.random() * autumnColors.length)]
              : leafColors[Math.floor(Math.random() * leafColors.length)],
            swayPhase: Math.random() * Math.PI * 2,
          });
        }
      }
      return {
        x1: x, y1: y, x2: endX, y2: endY,
        thickness,
        growProgress: 0,
        growSpeed: 0.002 + Math.random() * 0.003 + (depth * 0.0005),
        color: barkColors[Math.floor(Math.random() * barkColors.length)],
        children: [],
        hasSpawned: false,
        depth,
        swayPhase: Math.random() * Math.PI * 2,
        angle, length,
        leaves: branchLeaves,
      };
    }

    function initBranches() {
      branches = [];
      fallingLeaves = [];
      if (!isNature || hasStarted) return;
      const w = canvas!.width;
      const h = canvas!.height;
      // Trees from bottom — randomized positions, stay in left 25% and right 25%
      const treeCount = 4 + Math.floor(Math.random() * 3); // 4-6 trees
      for (let i = 0; i < treeCount; i++) {
        const onLeft = Math.random() < 0.5;
        const x = onLeft
          ? Math.random() * w * 0.25
          : w * 0.75 + Math.random() * w * 0.25;
        const leanAngle = onLeft
          ? -Math.PI / 2 + Math.random() * 0.25
          : -Math.PI / 2 - Math.random() * 0.25;
        const trunk = createBranch(
          x,
          h + 10,
          leanAngle + (Math.random() - 0.5) * 0.1,
          80 + Math.random() * 60,
          4 + Math.random() * 2.5,
          0
        );
        branches.push(trunk);
      }
      // Side branches reaching in from edges
      for (let i = 0; i < 6; i++) {
        const fromLeft = i % 2 === 0;
        const x = fromLeft ? -10 : w + 10;
        const y = h * 0.15 + Math.random() * h * 0.55;
        const angle = fromLeft
          ? -0.2 + Math.random() * 0.6
          : Math.PI + 0.2 - Math.random() * 0.6;
        const branch = createBranch(x, y, angle, 50 + Math.random() * 70, 2.5 + Math.random() * 2, 0);
        branches.push(branch);
      }
      // Top corner branches hanging down
      for (let i = 0; i < 2; i++) {
        const fromLeft = i === 0;
        const x = fromLeft ? Math.random() * w * 0.25 : w * 0.75 + Math.random() * w * 0.25;
        const branch = createBranch(x, -10, Math.PI / 2 + (fromLeft ? 0.2 : -0.2) + (Math.random() - 0.5) * 0.3, 40 + Math.random() * 50, 2 + Math.random() * 1.5, 1);
        branches.push(branch);
      }
    }

    function spawnChildren(branch: BranchSegment) {
      if (branch.hasSpawned || branch.depth >= 6) return;
      branch.hasSpawned = true;
      const numChildren = branch.depth < 2
        ? 2 + Math.floor(Math.random() * 2)
        : branch.depth < 4
          ? 2 + Math.floor(Math.random() * 2)
          : 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numChildren; i++) {
        const spread = 0.3 + Math.random() * 0.55;
        const childAngle = branch.angle + (i === 0 ? -spread : i === 1 ? spread : (Math.random() - 0.5) * spread) + (Math.random() - 0.5) * 0.2;
        const childLength = branch.length * (0.5 + Math.random() * 0.3);
        const childThickness = branch.thickness * (0.5 + Math.random() * 0.2);
        if (childThickness < 0.3) continue;
        const child = createBranch(branch.x2, branch.y2, childAngle, childLength, childThickness, branch.depth + 1);
        branch.children.push(child);
      }
    }

    function drawBranch(branch: BranchSegment, parentSway: number) {
      branch.growProgress = Math.min(1, branch.growProgress + branch.growSpeed);
      const sway = Math.sin(time * 0.002 + branch.swayPhase) * (branch.depth + 1) * 0.3;
      const totalSway = parentSway + sway;
      const progress = branch.growProgress;
      if (progress <= 0) return;

      const [r, g, b] = branch.color;
      const alpha = 0.35 + progress * 0.45;

      const curX2 = branch.x1 + (branch.x2 - branch.x1) * progress + totalSway;
      const curY2 = branch.y1 + (branch.y2 - branch.y1) * progress;
      const swayedX1 = branch.x1 + parentSway;

      // Draw branch with tapered thickness
      ctx!.beginPath();
      ctx!.moveTo(swayedX1, branch.y1);
      const midX = (swayedX1 + curX2) / 2 + totalSway * 0.2;
      const midY = (branch.y1 + curY2) / 2;
      ctx!.quadraticCurveTo(midX, midY, curX2, curY2);
      ctx!.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx!.lineWidth = branch.thickness * (1 - branch.depth * 0.08) * progress;
      ctx!.lineCap = "round";
      ctx!.stroke();

      // Bark texture: thin parallel line for thicker branches
      if (branch.thickness > 2 && progress > 0.5) {
        ctx!.beginPath();
        ctx!.moveTo(swayedX1 + 1, branch.y1);
        ctx!.quadraticCurveTo(midX + 1, midY, curX2 + 1, curY2);
        ctx!.strokeStyle = `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 25)}, ${Math.min(255, b + 20)}, ${alpha * 0.2})`;
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
      }

      // Draw leaves attached to this branch — fuller as branch matures
      if (progress > 0.35) {
        const leafMaturity = Math.min(1, (progress - 0.35) / 0.5);
        for (const leaf of branch.leaves) {
          const leafSway = Math.sin(time * 0.004 + leaf.swayPhase) * 2.5;
          const lx = swayedX1 + leaf.offsetX + leafSway;
          const ly = branch.y1 + leaf.offsetY;
          const leafAngle = leaf.angle + Math.sin(time * 0.003 + leaf.swayPhase) * 0.2;
          const leafAlpha = alpha * leafMaturity * 0.85;
          drawCanvasLeaf(lx, ly, leaf.size * leafMaturity, leafAngle, leaf.color, leafAlpha);
        }
      }

      // Spawn children
      if (progress > 0.65) spawnChildren(branch);

      for (const child of branch.children) {
        child.x1 = curX2;
        child.y1 = curY2;
        child.x2 = child.x1 + Math.cos(child.angle) * child.length;
        child.y2 = child.y1 + Math.sin(child.angle) * child.length;
        drawBranch(child, totalSway);
      }
    }

    function spawnFallingLeaf() {
      const w = canvas!.width;
      const h = canvas!.height;
      const leafType = Math.random() < 0.15 ? 2 : Math.random() < 0.5 ? 1 : 0;
      const color = Math.random() < 0.2
        ? autumnColors[Math.floor(Math.random() * autumnColors.length)]
        : leafColors[Math.floor(Math.random() * leafColors.length)];
      fallingLeaves.push({
        x: Math.random() * w,
        y: -15 - Math.random() * 30,
        size: leafType === 2 ? 3 + Math.random() * 4 : 6 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        color,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.3 + Math.random() * 0.5,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        life: 0,
        maxLife: 500 + Math.random() * 400,
        leafType,
      });
    }

    function drawFallingLeaf(leaf: FallingLeaf) {
      leaf.life++;
      leaf.y += leaf.vy;
      leaf.x += leaf.vx + Math.sin(leaf.life * leaf.wobbleSpeed + leaf.wobblePhase) * 0.8;
      leaf.angle += leaf.rotationSpeed;
      // Slow gentle arc
      leaf.vx += (Math.random() - 0.5) * 0.01;

      const progress = leaf.life / leaf.maxLife;
      let alpha: number;
      if (progress < 0.08) alpha = progress / 0.08;
      else if (progress > 0.75) alpha = 1 - (progress - 0.75) / 0.25;
      else alpha = 1;
      alpha *= 0.6;

      if (leaf.leafType === 2) {
        // Small twig
        const [r, g, b] = barkColors[0];
        ctx!.save();
        ctx!.translate(leaf.x, leaf.y);
        ctx!.rotate(leaf.angle);
        ctx!.globalAlpha = alpha;
        ctx!.beginPath();
        ctx!.moveTo(0, -leaf.size);
        ctx!.lineTo(0, leaf.size);
        ctx!.moveTo(0, -leaf.size * 0.3);
        ctx!.lineTo(leaf.size * 0.5, -leaf.size * 0.6);
        ctx!.moveTo(0, leaf.size * 0.2);
        ctx!.lineTo(-leaf.size * 0.4, -leaf.size * 0.05);
        ctx!.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx!.lineWidth = 1;
        ctx!.lineCap = "round";
        ctx!.stroke();
        ctx!.restore();
        ctx!.globalAlpha = 1;
      } else {
        drawCanvasLeaf(leaf.x, leaf.y, leaf.size, leaf.angle, leaf.color, alpha);
      }
    }

    const animalEmojis = ["\uD83D\uDC3C", "\uD83E\uDDA5", "\uD83D\uDC28"]; // panda, sloth, koala
    const butterflyColors: [number, number, number][] = [
      [220, 140, 60],   // monarch orange
      [140, 100, 200],  // purple
      [70, 160, 220],   // blue morpho
      [200, 80, 120],   // pink
      [240, 200, 80],   // yellow
    ];

    function drawButterfly(b: Butterfly) {
      b.life++;
      b.wingPhase += b.wingSpeed;

      // Move toward target with gentle drift
      const dx = b.targetX - b.x;
      const dy = b.targetY - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        // Pick new target
        b.targetX = Math.random() * canvas!.width;
        b.targetY = Math.random() * canvas!.height * 0.7;
      }
      b.x += (dx / dist) * b.speed + Math.sin(b.life * 0.03) * 0.5;
      b.y += (dy / dist) * b.speed + Math.cos(b.life * 0.025) * 0.3;

      const [r, g, b2] = b.color;
      const wingFlap = Math.sin(b.wingPhase) * 0.8;
      const alpha = 0.6;

      ctx!.save();
      ctx!.translate(b.x, b.y);
      // Face direction of movement
      const moveAngle = Math.atan2(dy, dx);
      ctx!.rotate(moveAngle * 0.3);

      // Left wing
      ctx!.beginPath();
      ctx!.ellipse(-b.size * 0.3, 0, b.size * 0.7, b.size * 0.4 * (0.3 + Math.abs(wingFlap)), wingFlap * 0.3, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${r}, ${g}, ${b2}, ${alpha})`;
      ctx!.fill();

      // Right wing
      ctx!.beginPath();
      ctx!.ellipse(b.size * 0.3, 0, b.size * 0.7, b.size * 0.4 * (0.3 + Math.abs(wingFlap)), -wingFlap * 0.3, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${r}, ${g}, ${b2}, ${alpha})`;
      ctx!.fill();

      // Body
      ctx!.beginPath();
      ctx!.ellipse(0, 0, b.size * 0.08, b.size * 0.35, 0, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(40, 30, 20, ${alpha})`;
      ctx!.fill();

      // Wing spots
      ctx!.beginPath();
      ctx!.arc(-b.size * 0.35, 0, b.size * 0.12, 0, Math.PI * 2);
      ctx!.arc(b.size * 0.35, 0, b.size * 0.12, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
      ctx!.fill();

      ctx!.restore();
    }

    function spawnButterfly() {
      const w = canvas!.width;
      const h = canvas!.height;
      butterflies.push({
        x: Math.random() * w,
        y: h * 0.3 + Math.random() * h * 0.4,
        targetX: Math.random() * w,
        targetY: Math.random() * h * 0.6,
        size: 8 + Math.random() * 6,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.15 + Math.random() * 0.1,
        color: butterflyColors[Math.floor(Math.random() * butterflyColors.length)],
        speed: 0.4 + Math.random() * 0.4,
        life: 0,
      });
    }

    function checkMaturity(): boolean {
      if (branches.length === 0) return false;
      let totalProgress = 0;
      let count = 0;
      function sumProgress(b: BranchSegment) {
        totalProgress += b.growProgress;
        count++;
        for (const child of b.children) sumProgress(child);
      }
      for (const branch of branches) sumProgress(branch);
      return count > 15 && (totalProgress / count) > 0.85;
    }

    function spawnHangingAnimals() {
      if (hangingAnimals.length > 0) return;
      // Find thick branches (depth 0 or 1) to hang from
      const candidates: number[] = [];
      branches.forEach((b, i) => {
        if (b.depth <= 1 && b.thickness >= 3 && b.growProgress > 0.9) {
          candidates.push(i);
        }
      });
      // Pick 1-2 branches to hang animals from
      const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, 2);
      for (const idx of shuffled) {
        hangingAnimals.push({
          branchIndex: idx,
          emoji: animalEmojis[Math.floor(Math.random() * animalEmojis.length)],
          offsetT: 0.4 + Math.random() * 0.4,
          swayPhase: Math.random() * Math.PI * 2,
          size: 20 + Math.random() * 8,
          spawned: true,
          opacity: 0,
        });
      }
    }

    function drawHangingAnimals() {
      for (const animal of hangingAnimals) {
        const branch = branches[animal.branchIndex];
        if (!branch || branch.growProgress < 0.8) continue;

        // Fade in
        animal.opacity = Math.min(1, animal.opacity + 0.005);

        const sway = Math.sin(time * 0.002 + animal.swayPhase) * 3;
        // Position along branch
        const bx = branch.x1 + (branch.x2 - branch.x1) * animal.offsetT + sway;
        const by = branch.y1 + (branch.y2 - branch.y1) * animal.offsetT;

        // Hang below the branch
        const hangY = by + 14 + Math.sin(time * 0.003 + animal.swayPhase) * 2;

        ctx!.save();
        ctx!.translate(bx, hangY);
        ctx!.rotate(Math.sin(time * 0.002 + animal.swayPhase) * 0.08);
        ctx!.globalAlpha = animal.opacity * 0.7;
        ctx!.font = `${animal.size}px serif`;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillText(animal.emoji, 0, 0);
        ctx!.restore();
        ctx!.globalAlpha = 1;
      }
    }

    function initCircuits() {
      circuitLines = [];
      circuitNodes = [];
      dataPulses = [];
      if (!isCybernetics) return;
      const w = canvas!.width;
      const h = canvas!.height;
      const spacing = 60 + Math.random() * 20;

      // Build a grid of possible circuit paths
      const gridCols = Math.ceil(w / spacing);
      const gridRows = Math.ceil(h / spacing);

      // Randomly connect grid points to form circuit traces
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const x = col * spacing + spacing * 0.5;
          const y = row * spacing + spacing * 0.5;

          // Horizontal line to right neighbor
          if (col < gridCols - 1 && Math.random() < 0.3) {
            circuitLines.push({
              x1: x, y1: y,
              x2: x + spacing, y2: y,
              horizontal: true,
            });
          }
          // Vertical line to bottom neighbor
          if (row < gridRows - 1 && Math.random() < 0.3) {
            circuitLines.push({
              x1: x, y1: y,
              x2: x, y2: y + spacing,
              horizontal: false,
            });
          }
          // Right-angle bends
          if (col < gridCols - 1 && row < gridRows - 1 && Math.random() < 0.12) {
            const midX = x + spacing;
            circuitLines.push({ x1: x, y1: y, x2: midX, y2: y, horizontal: true });
            circuitLines.push({ x1: midX, y1: y, x2: midX, y2: y + spacing, horizontal: false });
          }
        }
      }

      // Place nodes at intersections
      const nodeSet = new Set<string>();
      for (const line of circuitLines) {
        for (const [px, py] of [[line.x1, line.y1], [line.x2, line.y2]]) {
          const key = `${Math.round(px)},${Math.round(py)}`;
          if (!nodeSet.has(key) && Math.random() < 0.5) {
            nodeSet.add(key);
            circuitNodes.push({
              x: px, y: py,
              size: 2 + Math.random() * 3,
              pulsePhase: Math.random() * Math.PI * 2,
              type: Math.floor(Math.random() * 4),
            });
          }
        }
      }
    }

    function drawCircuits() {
      const w = canvas!.width;
      const h = canvas!.height;

      // Draw circuit traces
      for (const line of circuitLines) {
        ctx!.beginPath();
        ctx!.moveTo(line.x1, line.y1);
        ctx!.lineTo(line.x2, line.y2);
        ctx!.strokeStyle = "rgba(0, 232, 123, 0.06)";
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Draw junction nodes
      for (const node of circuitNodes) {
        const pulse = Math.sin(time * 0.02 + node.pulsePhase) * 0.5 + 0.5;
        const alpha = 0.15 + pulse * 0.25;

        ctx!.beginPath();
        if (node.type === 0) {
          // Filled dot
          ctx!.arc(node.x, node.y, node.size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(0, 232, 123, ${alpha})`;
          ctx!.fill();
        } else if (node.type === 1) {
          // Ring
          ctx!.arc(node.x, node.y, node.size, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
          ctx!.lineWidth = 1;
          ctx!.stroke();
        } else if (node.type === 2) {
          // Diamond
          ctx!.moveTo(node.x, node.y - node.size);
          ctx!.lineTo(node.x + node.size, node.y);
          ctx!.lineTo(node.x, node.y + node.size);
          ctx!.lineTo(node.x - node.size, node.y);
          ctx!.closePath();
          ctx!.fillStyle = `rgba(0, 255, 160, ${alpha * 0.7})`;
          ctx!.fill();
        } else {
          // Square
          ctx!.rect(node.x - node.size * 0.7, node.y - node.size * 0.7, node.size * 1.4, node.size * 1.4);
          ctx!.strokeStyle = `rgba(0, 232, 123, ${alpha})`;
          ctx!.lineWidth = 0.8;
          ctx!.stroke();
        }

        // Glow on brighter nodes
        if (pulse > 0.7) {
          const grd = ctx!.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 4);
          grd.addColorStop(0, `rgba(0, 232, 123, ${(pulse - 0.7) * 0.3})`);
          grd.addColorStop(1, "rgba(0, 232, 123, 0)");
          ctx!.beginPath();
          ctx!.arc(node.x, node.y, node.size * 4, 0, Math.PI * 2);
          ctx!.fillStyle = grd;
          ctx!.fill();
        }
      }

      // Spawn data pulses along circuit lines
      if (Math.random() < 0.04 && circuitLines.length > 0) {
        const line = circuitLines[Math.floor(Math.random() * circuitLines.length)];
        const cyberColors: [number, number, number][] = [[0, 232, 123], [0, 200, 255], [0, 255, 160], [100, 255, 200]];
        dataPulses.push({
          line,
          progress: 0,
          speed: 0.008 + Math.random() * 0.015,
          color: cyberColors[Math.floor(Math.random() * cyberColors.length)],
          size: 2 + Math.random() * 2,
        });
      }

      // Draw data pulses
      for (let i = dataPulses.length - 1; i >= 0; i--) {
        const p = dataPulses[i];
        p.progress += p.speed;
        if (p.progress > 1) { dataPulses.splice(i, 1); continue; }

        const px = p.line.x1 + (p.line.x2 - p.line.x1) * p.progress;
        const py = p.line.y1 + (p.line.y2 - p.line.y1) * p.progress;
        const [pr, pg, pb] = p.color;

        // Bright core
        ctx!.beginPath();
        ctx!.arc(px, py, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${pr}, ${pg}, ${pb}, 0.8)`;
        ctx!.fill();

        // Glow trail
        const grd = ctx!.createRadialGradient(px, py, 0, px, py, p.size * 5);
        grd.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0.4)`);
        grd.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0)`);
        ctx!.beginPath();
        ctx!.arc(px, py, p.size * 5, 0, Math.PI * 2);
        ctx!.fillStyle = grd;
        ctx!.fill();

        // Trail behind pulse
        const trailCount = 4;
        for (let t = 1; t <= trailCount; t++) {
          const tp = p.progress - t * 0.03;
          if (tp < 0) continue;
          const tx = p.line.x1 + (p.line.x2 - p.line.x1) * tp;
          const ty = p.line.y1 + (p.line.y2 - p.line.y1) * tp;
          ctx!.beginPath();
          ctx!.arc(tx, ty, p.size * (1 - t * 0.2), 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${0.3 - t * 0.06})`;
          ctx!.fill();
        }
      }

      // Scan line effect
      const scanY = (time * 1.5) % h;
      ctx!.fillStyle = "rgba(0, 232, 123, 0.015)";
      ctx!.fillRect(0, scanY, w, 2);

      // Subtle hex grid overlay
      if (time % 3 === 0) {
        const hexSize = 40;
        const hexH = hexSize * Math.sqrt(3);
        for (let row = 0; row < h / hexH + 1; row++) {
          for (let col = 0; col < w / (hexSize * 1.5) + 1; col++) {
            const cx = col * hexSize * 1.5;
            const cy = row * hexH + (col % 2 === 1 ? hexH / 2 : 0);
            if (Math.random() > 0.03) continue;
            ctx!.beginPath();
            for (let s = 0; s < 6; s++) {
              const a = (Math.PI / 3) * s - Math.PI / 6;
              const hx = cx + Math.cos(a) * hexSize * 0.4;
              const hy = cy + Math.sin(a) * hexSize * 0.4;
              if (s === 0) ctx!.moveTo(hx, hy);
              else ctx!.lineTo(hx, hy);
            }
            ctx!.closePath();
            ctx!.strokeStyle = "rgba(0, 232, 123, 0.04)";
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initStars();
      initBranches();
      initCircuits();
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
        } else if (isNature) {
          // Fireflies: slow random drift with wide gentle wandering
          const driftX = Math.cos(star.driftAngle) * star.speed * 0.2 * themeSpeed;
          const driftY = Math.sin(star.driftAngle) * star.speed * 0.2 * themeSpeed;
          star.x += driftX + Math.sin(time * 0.005 + star.twinklePhase) * 0.2;
          star.y += driftY + Math.cos(time * 0.004 + star.twinklePhase * 1.5) * 0.15;
          star.driftAngle += (Math.sin(time * 0.001 + star.twinklePhase) * 0.004);
        } else if (isLight) {
          // Aurora: gentle individual drift with soft wandering
          const driftX = Math.cos(star.driftAngle) * star.speed * 0.25 * themeSpeed;
          const driftY = Math.sin(star.driftAngle) * star.speed * 0.25 * themeSpeed;
          star.x += driftX + Math.sin(time * 0.004 + star.twinklePhase) * 0.1;
          star.y += driftY + Math.cos(time * 0.003 + star.twinklePhase * 1.2) * 0.06;
          star.driftAngle += (Math.sin(time * 0.0008 + star.twinklePhase) * 0.003);
        } else {
          // Default: slow drift
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

      // Cybernetics: circuit board with data pulses
      if (isCybernetics) {
        drawCircuits();
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

      // Nature theme: branches, falling leaves, animals & butterflies (home only)
      if (isNature && !hasStarted) {
        // Draw growing branches with attached leaves
        for (const branch of branches) {
          drawBranch(branch, 0);
        }

        // Spawn falling leaves
        if (Math.random() < 0.018) spawnFallingLeaf();

        // Draw and update falling leaves
        for (let i = fallingLeaves.length - 1; i >= 0; i--) {
          drawFallingLeaf(fallingLeaves[i]);
          if (fallingLeaves[i].life >= fallingLeaves[i].maxLife || fallingLeaves[i].y > canvas!.height + 30) {
            fallingLeaves.splice(i, 1);
          }
        }

        // Check maturity periodically
        matureCheckTimer++;
        if (!natureMature && matureCheckTimer % 60 === 0) {
          natureMature = checkMaturity();
          if (natureMature) {
            spawnHangingAnimals();
          }
        }

        // Draw hanging animals
        if (natureMature) {
          drawHangingAnimals();

          // Spawn butterflies gradually
          if (butterflies.length < 8 && Math.random() < 0.012) {
            spawnButterfly();
          }

          // Draw butterflies
          for (const b of butterflies) {
            drawButterfly(b);
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
  }, [theme, hasStarted]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}
