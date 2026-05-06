"use client";

import { useEffect, useState } from "react";

/**
 * Per-persona TTS using the browser's SpeechSynthesis API. Free, no
 * external service. Voice quality is bounded by what the user's browser
 * exposes:
 *   - Edge: Microsoft Online (Natural) neural voices, the closest to
 *     ElevenLabs in quality. Highly recommended.
 *   - Safari (Mac): Apple Premium / Enhanced voices (Samantha, Daniel,
 *     Karen, etc.) once the user has downloaded them in System Settings.
 *   - Chrome: Google US English voices (decent, not as natural as Edge).
 *
 * The picker scores all available voices and returns the highest match
 * for the requested gender/profile.
 */

export interface VoiceProfile {
  /** Persona-tone hint. Drives voice scoring. */
  gender?: "male" | "female";
  /** Pitch multiplier (default 1). Use sparingly; large shifts sound robotic. */
  pitch?: number;
  /** Rate multiplier (default 0.95). Slightly slower than 1 reads more naturally. */
  rate?: number;
  /** Optional explicit voice name preference (e.g. "Microsoft Aria Online (Natural) - English (United States)"). */
  voiceName?: string;
  /** Voice profile bucket so different personas with the same gender still sound distinct. */
  bucket?: "warm" | "sharp" | "neutral" | "older" | "young" | "deep";
}

export const PERSONA_VOICE_BUCKETS: Record<string, VoiceProfile> = {
  // Universal personas. Locked-in voices so each archetype reads the same across sessions.
  setup: { gender: "female", pitch: 1.0, rate: 0.95, bucket: "warm" },
  skeptic: { gender: "male", pitch: 0.95, rate: 0.93, bucket: "sharp" },
  pragmatist: { gender: "male", pitch: 1.0, rate: 0.97, bucket: "neutral" },
  "stress-test": { gender: "female", pitch: 1.05, rate: 0.92, bucket: "older" },
  // Expert (domain-specific) personas pick from a rotating pool. The picker
  // hashes the persona id so the same expert always reads in the same voice.
  expert: { gender: "female", pitch: 1.0, rate: 0.95, bucket: "young" },
};

/** Names of voices known to sound natural across major browsers, in priority order. */
const NATURAL_VOICE_PRIORITY = [
  // Edge "Online (Natural)" voices, neural, the highest quality available for free.
  "Microsoft Aria Online (Natural)",
  "Microsoft Jenny Online (Natural)",
  "Microsoft Sonia Online (Natural)",
  "Microsoft Libby Online (Natural)",
  "Microsoft Davis Online (Natural)",
  "Microsoft Guy Online (Natural)",
  "Microsoft Tony Online (Natural)",
  "Microsoft Ryan Online (Natural)",
  // Apple Premium/Enhanced voices, downloadable on macOS.
  "Samantha (Premium)",
  "Samantha (Enhanced)",
  "Karen (Premium)",
  "Daniel (Premium)",
  "Daniel (Enhanced)",
  "Allison (Premium)",
  "Ava (Premium)",
  "Tom (Premium)",
  // Apple stock voices.
  "Samantha",
  "Karen",
  "Moira",
  "Tessa",
  "Daniel",
  "Tom",
  "Alex",
  // Google Cloud voices in Chrome.
  "Google US English",
  "Google UK English Female",
  "Google UK English Male",
];

const FEMALE_PATTERNS = /samantha|allison|ava|karen|moira|tessa|fiona|serena|veena|female|aria|jenny|libby|sonia|natasha/i;
const MALE_PATTERNS = /daniel|tom|alex|fred|oliver|arthur|male|guy|davis|ryan|brandon|tony/i;

function scoreVoice(v: SpeechSynthesisVoice, profile: VoiceProfile): number {
  let s = 0;
  // English-speaking voices only, with a strong preference.
  if (/^en\b/i.test(v.lang) || /-en/i.test(v.lang)) s += 100;
  // Priority list scoring.
  for (let i = 0; i < NATURAL_VOICE_PRIORITY.length; i++) {
    if (v.name === NATURAL_VOICE_PRIORITY[i]) {
      s += 200 - i * 5; // earlier matches score higher
      break;
    }
  }
  // Generic neural / premium hints.
  if (/natural|neural|premium|enhanced|wavenet/i.test(v.name)) s += 30;
  // Gender match.
  if (profile.gender === "female" && FEMALE_PATTERNS.test(v.name)) s += 25;
  if (profile.gender === "male" && MALE_PATTERNS.test(v.name)) s += 25;
  if (profile.gender === "female" && MALE_PATTERNS.test(v.name)) s -= 40;
  if (profile.gender === "male" && FEMALE_PATTERNS.test(v.name)) s -= 40;
  // Cloud voices tend to sound better than local ones.
  if (v.localService === false) s += 10;
  return s;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Pick a voice for a specific persona. Hashes the persona id so the same
 * persona always uses the same voice across the conversation, even when
 * multiple voices in the same gender bucket are available.
 */
function pickVoiceForPersona(personaId: string, profile: VoiceProfile): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Explicit voice name takes priority.
  if (profile.voiceName) {
    const exact = voices.find((v) => v.name === profile.voiceName);
    if (exact) return exact;
  }

  // Score all voices.
  const scored = voices.map((v) => ({ voice: v, score: scoreVoice(v, profile) }));
  scored.sort((a, b) => b.score - a.score);

  // Take top half and pick deterministically by persona id so different
  // domain experts get different voices in the same gender bucket.
  const topN = Math.max(1, Math.min(8, Math.floor(scored.length / 4)));
  const top = scored.slice(0, topN);
  if (!top.length) return null;
  const idx = hashString(personaId) % top.length;
  return top[idx].voice;
}

export function getVoiceProfile(archetype: string): VoiceProfile {
  return PERSONA_VOICE_BUCKETS[archetype] || PERSONA_VOICE_BUCKETS.expert;
}

export function useTextToSpeech() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);

  useEffect(() => {
    if (!supported) return;
    const sync = () => setVoicesReady(true);
    if (window.speechSynthesis.getVoices().length) setVoicesReady(true);
    window.speechSynthesis.addEventListener?.("voiceschanged", sync);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", sync);
      try { window.speechSynthesis.cancel(); } catch {}
    };
  }, [supported]);

  const stop = () => {
    if (!supported) return;
    try { window.speechSynthesis.cancel(); } catch {}
    setSpeaking(false);
  };

  const speak = (text: string, personaId: string, profile: VoiceProfile) => {
    if (!supported || !text) return;
    try { window.speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    u.rate = profile.rate ?? 0.95;
    u.pitch = profile.pitch ?? 1;
    u.lang = "en-US";
    const voice = pickVoiceForPersona(personaId, profile);
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    // Brief delay avoids Chrome cutting off the first word.
    setTimeout(() => window.speechSynthesis.speak(u), 30);
  };

  const toggle = (text: string, personaId: string, profile: VoiceProfile) => {
    if (speaking) stop();
    else speak(text, personaId, profile);
  };

  return { supported, speaking, voicesReady, speak, stop, toggle };
}
