"use client";

import { VALUE_DIMENSIONS } from "@/lib/valueDna";

interface Props {
  dna: number[];
  label?: string;
  size?: number;
  color?: string;
  compareWith?: number[];
  compareColor?: string;
}

export default function ValueDnaRadar({
  dna,
  label,
  size = 200,
  color = "rgb(var(--glow))",
  compareWith,
  compareColor = "rgb(var(--judgment))",
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 30;
  const dimensions = VALUE_DIMENSIONS.length;

  function polarToCartesian(angle: number, r: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function getPolygonPoints(values: number[]) {
    return values
      .map((v, i) => {
        const angle = (360 / dimensions) * i;
        const r = radius * Math.max(v, 0.05); // min visible
        const { x, y } = polarToCartesian(angle, r);
        return `${x},${y}`;
      })
      .join(" ");
  }

  // Concentric rings
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <div className="text-[10px] text-cosmos-muted uppercase tracking-wider">
          {label}
        </div>
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={Array.from({ length: dimensions })
              .map((_, i) => {
                const angle = (360 / dimensions) * i;
                const { x, y } = polarToCartesian(angle, radius * r);
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth="0.5"
            opacity={0.4}
          />
        ))}

        {/* Axis lines */}
        {Array.from({ length: dimensions }).map((_, i) => {
          const angle = (360 / dimensions) * i;
          const { x, y } = polarToCartesian(angle, radius);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgb(var(--border))"
              strokeWidth="0.5"
              opacity={0.3}
            />
          );
        })}

        {/* Comparison polygon (behind main) */}
        {compareWith && (
          <polygon
            points={getPolygonPoints(compareWith)}
            fill={compareColor}
            fillOpacity={0.1}
            stroke={compareColor}
            strokeWidth="1.5"
            strokeOpacity={0.5}
          />
        )}

        {/* Main value polygon */}
        <polygon
          points={getPolygonPoints(dna)}
          fill={color}
          fillOpacity={0.15}
          stroke={color}
          strokeWidth="2"
          strokeOpacity={0.8}
        />

        {/* Data points */}
        {dna.map((v, i) => {
          if (v <= 0) return null;
          const angle = (360 / dimensions) * i;
          const { x, y } = polarToCartesian(angle, radius * v);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              opacity={0.9}
            />
          );
        })}

        {/* Labels */}
        {VALUE_DIMENSIONS.map((dim, i) => {
          const angle = (360 / dimensions) * i;
          const { x, y } = polarToCartesian(angle, radius + 18);
          const shortLabel =
            dim.length > 10 ? dim.split(" ")[0] : dim;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgb(var(--muted))"
              fontSize="7"
              opacity={dna[i] > 0 ? 0.8 : 0.3}
            >
              {shortLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
