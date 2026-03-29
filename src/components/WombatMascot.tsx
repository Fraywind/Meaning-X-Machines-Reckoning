"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  /** Size of the mascot in pixels (width, height auto-scales) */
  size?: number;
  /** Current mood/state */
  mood?: "idle" | "talking" | "thinking" | "happy";
  /** Accessory to wear */
  accessory?: "none" | "glasses" | "judge";
  /** Optional speech bubble text */
  speechText?: string;
  /** Called when speech bubble is dismissed */
  onSpeechDone?: () => void;
}

export default function WombatMascot({
  size = 200,
  mood = "idle",
  accessory = "none",
  speechText,
  onSpeechDone,
}: Props) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  // Random blinking every 2-5 seconds
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const interval = setInterval(() => {
      blink();
    }, 2500 + Math.random() * 2500);
    // Initial blink after a short delay
    const initialTimeout = setTimeout(blink, 800);
    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  // Mouth animation when talking
  useEffect(() => {
    if (mood !== "talking") {
      setMouthOpen(false);
      return;
    }
    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 200);
    return () => clearInterval(interval);
  }, [mood]);

  // Scale factor relative to original image (1024x1536)
  const scale = size / 1024;
  const height = 1536 * scale;

  return (
    <div className="relative inline-block" style={{ width: size, height }}>
      {/* Base wombat image */}
      <motion.img
        src="/wombat.png"
        alt="Cascade Wombat"
        className="w-full h-full object-contain select-none pointer-events-none"
        draggable={false}
        // Gentle idle breathing animation
        animate={{
          scale: mood === "happy" ? [1, 1.03, 1] : [1, 1.01, 1],
          rotate: mood === "happy" ? [0, -2, 2, 0] : 0,
        }}
        transition={{
          scale: {
            duration: mood === "happy" ? 0.6 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: 0.5,
            repeat: mood === "happy" ? 3 : 0,
          },
        }}
      />

      {/* Eye blink overlays — fur-colored ellipses that cover the eyes */}
      <AnimatePresence>
        {isBlinking && (
          <>
            {/* Left eye blink */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ duration: 0.08 }}
              className="absolute rounded-full"
              style={{
                left: `${35.5}%`,
                top: `${31}%`,
                width: size * 0.08,
                height: size * 0.055,
                backgroundColor: "#7a5a3a",
              }}
            />
            {/* Right eye blink */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ duration: 0.08 }}
              className="absolute rounded-full"
              style={{
                left: `${54.5}%`,
                top: `${31}%`,
                width: size * 0.08,
                height: size * 0.055,
                backgroundColor: "#7a5a3a",
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Talking mouth overlay */}
      <AnimatePresence>
        {mood === "talking" && mouthOpen && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute rounded-full"
            style={{
              left: `${44}%`,
              top: `${42.5}%`,
              width: size * 0.1,
              height: size * 0.04,
              backgroundColor: "#5a3020",
              borderRadius: "0 0 50% 50%",
            }}
          />
        )}
      </AnimatePresence>

      {/* Thinking indicator */}
      {mood === "thinking" && (
        <motion.div
          className="absolute"
          style={{ right: "5%", top: "5%" }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-cosmos-glow/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-cosmos-glow/40" />
            <div className="w-1 h-1 rounded-full bg-cosmos-glow/30" />
          </div>
        </motion.div>
      )}

      {/* Accessory: Glasses */}
      {accessory === "glasses" && (
        <svg
          className="absolute pointer-events-none"
          style={{
            left: "28%",
            top: "28%",
            width: "44%",
          }}
          viewBox="0 0 200 80"
          fill="none"
          stroke="#4a3728"
          strokeWidth="3"
        >
          {/* Left lens */}
          <circle cx="55" cy="35" r="30" fill="rgba(200, 220, 255, 0.15)" />
          {/* Right lens */}
          <circle cx="145" cy="35" r="30" fill="rgba(200, 220, 255, 0.15)" />
          {/* Bridge */}
          <path d="M85 35 Q100 28 115 35" />
          {/* Left arm */}
          <path d="M25 35 Q10 33 5 25" />
          {/* Right arm */}
          <path d="M175 35 Q190 33 195 25" />
        </svg>
      )}

      {/* Accessory: Judge wig */}
      {accessory === "judge" && (
        <svg
          className="absolute pointer-events-none"
          style={{
            left: "18%",
            top: "-2%",
            width: "64%",
          }}
          viewBox="0 0 260 120"
          fill="none"
        >
          {/* Main wig shape */}
          <ellipse cx="130" cy="55" rx="120" ry="50" fill="#e8e0d0" />
          <ellipse cx="130" cy="50" rx="110" ry="42" fill="#f5f0e8" />
          {/* Curls */}
          <circle cx="30" cy="70" r="18" fill="#e8e0d0" />
          <circle cx="230" cy="70" r="18" fill="#e8e0d0" />
          <circle cx="50" cy="80" r="15" fill="#ddd5c5" />
          <circle cx="210" cy="80" r="15" fill="#ddd5c5" />
          <circle cx="35" cy="95" r="12" fill="#e8e0d0" />
          <circle cx="225" cy="95" r="12" fill="#e8e0d0" />
          {/* Top detail */}
          <ellipse cx="130" cy="25" rx="60" ry="20" fill="#f0ebe3" />
        </svg>
      )}

      {/* Speech bubble */}
      <AnimatePresence>
        {speechText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="absolute cursor-pointer"
            style={{
              left: "105%",
              top: "5%",
              width: "max-content",
              maxWidth: 260,
            }}
            onClick={onSpeechDone}
          >
            <div className="relative bg-cosmos-surface/95 backdrop-blur-sm border border-cosmos-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg">
              <p className="text-xs text-cosmos-text leading-relaxed">{speechText}</p>
              {/* Speech bubble tail */}
              <div
                className="absolute -left-2 bottom-3 w-0 h-0"
                style={{
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  borderRight: "8px solid rgb(var(--surface) / 0.95)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
