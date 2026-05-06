"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animal Crossing-style "villager voice" playback. Uses a real MP3
 * (public/persona-voice.mp3) looped for the duration of the message,
 * with per-persona playback rate for pitch variation. Falls back to
 * synthesized tones via Web Audio if the MP3 fails to load (offline,
 * file missing, etc.).
 */

export interface AnimaleseProfile {
  /** Playback rate multiplier for the looped MP3. <1 = lower/slower, >1 = higher/faster. */
  playbackRate?: number;
  /** Output gain (volume), 0..1. */
  volume?: number;
  /** Synthesized fallback only: base pitch, variation, waveform, durations. */
  basePitch?: number;
  variation?: number;
  waveform?: OscillatorType;
  duration?: number;
  gap?: number;
  vowelHold?: number;
}

// Per-persona playback rate so each character sounds visibly distinct
// when the same MP3 is played back. Combined with hash-based offset for
// dynamic experts so different domain experts vary too.
export const PERSONA_ANIMALESE: Record<string, AnimaleseProfile> = {
  setup: { playbackRate: 1.05, volume: 0.55, basePitch: 540, variation: 60, waveform: "sine", duration: 0.07, gap: 0.04, vowelHold: 1.4 },
  skeptic: { playbackRate: 0.82, volume: 0.6, basePitch: 320, variation: 40, waveform: "triangle", duration: 0.08, gap: 0.03, vowelHold: 1.2 },
  pragmatist: { playbackRate: 0.92, volume: 0.55, basePitch: 380, variation: 50, waveform: "triangle", duration: 0.07, gap: 0.03, vowelHold: 1.3 },
  "stress-test": { playbackRate: 1.18, volume: 0.55, basePitch: 470, variation: 80, waveform: "sine", duration: 0.08, gap: 0.04, vowelHold: 1.4 },
  anchor: { playbackRate: 1.0, volume: 0.55, basePitch: 500, variation: 50, waveform: "sine", duration: 0.075, gap: 0.04, vowelHold: 1.4 },
  expert: { playbackRate: 1.0, volume: 0.55, basePitch: 430, variation: 70, waveform: "sine", duration: 0.07, gap: 0.04, vowelHold: 1.3 },
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

function hashOffset(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ((h % 200) - 100);
}

export function getAnimaleseProfile(archetype: string): AnimaleseProfile {
  return PERSONA_ANIMALESE[archetype] || PERSONA_ANIMALESE.expert;
}

/** Estimate how long the persona "talks". Roughly 50ms per character,
 *  capped at 12 seconds so a long message doesn't drone forever. */
function estimateDuration(text: string): number {
  const chars = text.length;
  return Math.max(800, Math.min(chars * 50, 12000));
}

export function useAnimalese() {
  const supported = typeof window !== "undefined";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const cancelRef = useRef(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      try { ctxRef.current?.close(); } catch {}
    };
  }, []);

  const stop = () => {
    cancelRef.current = true;
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
  };

  // Synthesized fallback for when the MP3 fails to load.
  const speakSynth = (text: string, personaSeed: string, profile: AnimaleseProfile) => {
    if (typeof AudioContext === "undefined" && typeof (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext === "undefined") return;
    if (!ctxRef.current) {
      const Ctor =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctor();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const basePitch = (profile.basePitch ?? 430) + hashOffset(personaSeed) * 0.3;
    const variation = profile.variation ?? 60;
    const waveform = profile.waveform ?? "sine";
    const duration = profile.duration ?? 0.075;
    const gap = profile.gap ?? 0.04;
    const vowelHold = profile.vowelHold ?? 1.3;
    const volume = profile.volume ?? 0.12;

    let time = ctx.currentTime + 0.02;
    const cleanText = text.toLowerCase().replace(/[^a-z\s.!?,;]/g, "");
    let totalDuration = 0;

    for (const ch of cleanText) {
      if (cancelRef.current) break;
      if (/\s/.test(ch)) { time += gap * 2; totalDuration += gap * 2; continue; }
      if (/[.!?]/.test(ch)) { time += gap * 4; totalDuration += gap * 4; continue; }
      if (/[,;]/.test(ch)) { time += gap * 2.5; totalDuration += gap * 2.5; continue; }

      const isVowel = VOWELS.has(ch);
      const toneDur = duration * (isVowel ? vowelHold : 1);
      const charPitch = basePitch + ((ch.charCodeAt(0) - 97) * 8) - 50 + (Math.random() - 0.5) * variation;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = waveform;
      osc.frequency.setValueAtTime(charPitch, time);
      osc.frequency.linearRampToValueAtTime(charPitch * 1.05, time + toneDur * 0.4);
      osc.frequency.linearRampToValueAtTime(charPitch * 0.95, time + toneDur);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + toneDur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + toneDur + 0.02);

      time += toneDur + gap;
      totalDuration += toneDur + gap;
    }

    if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = window.setTimeout(() => {
      setSpeaking(false);
      stopTimerRef.current = null;
    }, Math.max(100, totalDuration * 1000));
  };

  const speak = (text: string, personaSeed: string, profile: AnimaleseProfile) => {
    if (!supported || !text) return;
    cancelRef.current = false;
    stop();
    cancelRef.current = false;
    setSpeaking(true);

    // Try the MP3 first. Per-persona playbackRate plus hash shimmer
    // gives each character a distinct pitch from the same source.
    const audio = new Audio("/persona-voice.mp3");
    audio.loop = true;
    const baseRate = profile.playbackRate ?? 1.0;
    const shimmer = (hashOffset(personaSeed) / 100) * 0.08; // +- 8%
    audio.playbackRate = Math.max(0.5, Math.min(2.5, baseRate + shimmer));
    audio.volume = profile.volume ?? 0.55;

    const durationMs = estimateDuration(text);

    audio.addEventListener("error", () => {
      // MP3 failed: fall through to synthesized tones.
      audioRef.current = null;
      speakSynth(text, personaSeed, profile);
    });

    audioRef.current = audio;
    audio.play().catch(() => {
      audioRef.current = null;
      speakSynth(text, personaSeed, profile);
    });

    if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = window.setTimeout(() => {
      if (audioRef.current === audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setSpeaking(false);
      stopTimerRef.current = null;
    }, durationMs);
  };

  const toggle = (text: string, personaSeed: string, profile: AnimaleseProfile) => {
    if (speaking) stop();
    else speak(text, personaSeed, profile);
  };

  return { supported, speaking, speak, stop, toggle };
}
