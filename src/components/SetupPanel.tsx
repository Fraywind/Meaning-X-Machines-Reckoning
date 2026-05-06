"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Send, Loader2, X, Mic, MicOff, Volume2, VolumeX, Music } from "lucide-react";
import { useStore, BriefMessage } from "@/store/useStore";
import { safeFetch } from "@/lib/api";
import { getLanguageConfig } from "@/lib/i18n";
import { useTextToSpeech, getVoiceProfile } from "@/lib/useTextToSpeech";
import { useAnimalese, getAnimaleseProfile } from "@/lib/useAnimalese";
import PersonaStrip from "./PersonaStrip";

interface Props {
  onReady: (goal: string, values: string[], constraints: string[]) => void;
  onSummonPersona: (personaId: string) => void;
  examples: { text: string }[];
}

/** Small inline sigil for the initial card state */
function SigilSmall() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-cosmos-glow">
      <circle cx="3.5" cy="3.5" r="1.8" fill="currentColor" />
      <line x1="5" y1="5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12.5" cy="12.5" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/**
 * Setup persona — bust-portrait scribe character, warmer Stardew-adjacent style.
 * Future personas (Stress Test, Cheerleader/Coach, Skeptic, etc.) get their own characters.
 */
function SetupCharacter({ thinking }: { thinking: boolean }) {
  // Warm palette — lifts the character off the cosmos-dark background like a Stardew portrait.
  const skin = "#f3d3b0";
  const skinShade = "#dcb591";
  const hair = "#3b2519";
  const hood = "#5d4a7a"; // muted purple, plays with cosmos-glow
  const robe = "#3a2f55";
  const accent = "#c9a05a"; // warm gold for pencil / notepad edge
  const paper = "#f0e6d2";
  const ink = "#2a1f3d";

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Soft glow halo */}
      <motion.div
        className="absolute rounded-full bg-cosmos-glow/8 blur-3xl pointer-events-none"
        style={{ width: 380, height: 380 }}
        animate={{
          scale: thinking ? [1, 1.06, 1] : [1, 1.02, 1],
          opacity: thinking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{ duration: thinking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Background portrait disc — gives it a "framed" feel like a Stardew dialogue portrait */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-b from-cosmos-surface/40 to-cosmos-bg/60 border border-cosmos-glow/15" />

      {/* Character */}
      <motion.svg
        viewBox="0 0 220 240"
        className="relative w-72 h-72"
        animate={{
          y: thinking ? [0, -3, 0] : [0, -2, 0],
          rotate: thinking ? [-0.7, 0.7, -0.7] : [-0.4, 0.4, -0.4],
        }}
        transition={{
          duration: thinking ? 1.8 : 4.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "110px 220px" }}
      >
        {/* Robe shoulders */}
        <path
          d="M 30 240 Q 30 170 80 165 L 140 165 Q 190 170 190 240 Z"
          fill={robe}
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Hood drape over shoulders — lighter purple */}
        <path
          d="M 50 195 Q 60 165 110 158 Q 160 165 170 195 L 165 220 Q 110 200 55 220 Z"
          fill={hood}
          stroke={ink}
          strokeWidth="1.8"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Notepad held in front */}
        <rect x="62" y="178" width="96" height="58" rx="4" fill={paper} stroke={ink} strokeWidth="2" />
        <line x1="74" y1="192" x2="146" y2="192" stroke={ink} strokeWidth="1" opacity="0.35" />
        <line x1="74" y1="202" x2="142" y2="202" stroke={ink} strokeWidth="1" opacity="0.35" />
        <line x1="74" y1="212" x2="135" y2="212" stroke={ink} strokeWidth="1" opacity="0.35" />
        <line x1="74" y1="222" x2="120" y2="222" stroke={ink} strokeWidth="1" opacity="0.35" />

        {/* Hands resting on notepad */}
        <ellipse cx="64" cy="180" rx="9" ry="6" fill={skin} stroke={ink} strokeWidth="1.5" />
        <ellipse cx="156" cy="180" rx="9" ry="6" fill={skin} stroke={ink} strokeWidth="1.5" />

        {/* Pencil — taps when thinking */}
        <motion.g
          animate={{
            rotate: thinking ? [0, 8, 0, 8, 0] : 0,
            y: thinking ? [0, -1, 0, -1, 0] : 0,
          }}
          transition={{ duration: 0.9, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
          style={{ transformOrigin: "156px 180px" }}
        >
          <line x1="156" y1="180" x2="170" y2="166" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="170" cy="166" r="2" fill={ink} />
        </motion.g>

        {/* Neck */}
        <rect x="98" y="140" width="24" height="22" fill={skin} stroke={ink} strokeWidth="1.5" />
        <ellipse cx="110" cy="160" rx="14" ry="3" fill={skinShade} opacity="0.4" />

        {/* Head */}
        <ellipse cx="110" cy="98" rx="42" ry="46" fill={skin} stroke={ink} strokeWidth="2" />

        {/* Cheek shading */}
        <ellipse cx="82" cy="115" rx="6" ry="4" fill={skinShade} opacity="0.4" />
        <ellipse cx="138" cy="115" rx="6" ry="4" fill={skinShade} opacity="0.4" />

        {/* Hair — visible tuft above forehead, peeks out from hood */}
        <path
          d="M 72 80 Q 80 50 110 48 Q 140 50 148 80 Q 142 64 130 60 Q 118 70 110 62 Q 102 70 90 60 Q 78 64 72 80 Z"
          fill={hair}
          stroke={ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Hood wrapping behind head */}
        <path
          d="M 60 95 Q 60 50 110 42 Q 160 50 160 95 L 158 110 Q 148 75 110 70 Q 72 75 62 110 Z"
          fill={hood}
          stroke={ink}
          strokeWidth="2"
          opacity="0.92"
        />

        {/* Regular eyes group — fade out during the big-smile beat so the
            ^_^ smile-arc overlay below can take over. */}
        <motion.g
          animate={{ opacity: thinking ? 1 : [1, 1, 0, 1, 1, 1, 1, 1] }}
          transition={{
            duration: 24,
            times: [0, 0.3, 0.34, 0.42, 0.5, 0.7, 0.85, 1],
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ellipse cx="93" cy="100" rx="5.5" ry="6.5" fill="#ffffff" stroke={ink} strokeWidth="1.5" />
          <ellipse cx="127" cy="100" rx="5.5" ry="6.5" fill="#ffffff" stroke={ink} strokeWidth="1.5" />

          <motion.g
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 0.18, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 4.2, ease: "easeInOut" }}
            style={{ transformOrigin: "110px 100px" }}
          >
            {/* Pupil saccade — eyes dart subtly every few seconds */}
            <motion.g
              animate={{ x: [0, 1.5, 0, -1.2, 0, 0] }}
              transition={{
                duration: 6,
                times: [0, 0.08, 0.18, 0.3, 0.42, 1],
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ellipse cx="93" cy="101" rx="2.6" ry="3.4" fill={ink} />
              <ellipse cx="127" cy="101" rx="2.6" ry="3.4" fill={ink} />
              {/* Highlights */}
              <circle cx="94.5" cy="99" r="1.1" fill="#ffffff" opacity="0.95" />
              <circle cx="128.5" cy="99" r="1.1" fill="#ffffff" opacity="0.95" />
            </motion.g>
          </motion.g>
        </motion.g>

        {/* ^_^ smile-arc eye overlay. Fades in briefly during the
            big-smile beat to give Setup a periodic happy expression. */}
        <motion.g
          animate={{ opacity: thinking ? 0 : [0, 0, 1, 0, 0, 0, 0, 0] }}
          transition={{
            duration: 24,
            times: [0, 0.3, 0.36, 0.42, 0.5, 0.7, 0.85, 1],
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M 86 102 Q 93 95 100 102"
            stroke={ink}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 120 102 Q 127 95 134 102"
            stroke={ink}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Eyebrows */}
        <motion.path
          d="M 84 88 Q 93 84 102 88"
          stroke={hair}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          animate={{ y: thinking ? -1 : 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.path
          d="M 118 88 Q 127 84 136 88"
          stroke={hair}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          animate={{ y: thinking ? -1 : 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* Nose — simple subtle */}
        <path d="M 110 110 Q 109 118 113 120" stroke={skinShade} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />

        {/* Mouth — talks when thinking; cycles through emotions in idle.
            The expression beats sync with the eye overlay above so the
            big smile lands with ^_^ eyes, and the surprised :o lands on
            its own beat to add a periodic dose of personality. */}
        <motion.path
          stroke={ink}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: thinking
              ? [
                  "M 102 130 Q 110 132 118 130",
                  "M 100 132 Q 110 139 120 132",
                  "M 103 131 Q 110 134 117 131",
                  "M 100 132 Q 110 138 120 132",
                ]
              : [
                  "M 102 128 Q 110 134 118 128", // small smile (default)
                  "M 102 128 Q 110 134 118 128", // hold
                  "M 96 128 Q 110 144 124 128",  // BIG smile
                  "M 102 128 Q 110 134 118 128", // back to small smile
                  "M 102 128 Q 110 134 118 128", // hold
                  "M 105 130 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0", // :o surprised
                  "M 102 128 Q 110 134 118 128", // back to small smile
                  "M 102 128 Q 110 134 118 128", // hold
                ],
          }}
          transition={{
            duration: thinking ? 0.65 : 24,
            times: thinking ? undefined : [0, 0.3, 0.38, 0.45, 0.7, 0.74, 0.8, 1],
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.svg>

      {/* Label */}
      <div className="absolute bottom-6 text-center px-4 pointer-events-none">
        <div className="text-[10px] text-cosmos-muted/50 uppercase tracking-[0.3em] mb-1">Persona</div>
        <div className="text-2xl font-display font-medium text-cosmos-text">Setup</div>
        <div className="text-[11px] text-cosmos-muted/50 mt-1.5 max-w-[260px] mx-auto leading-relaxed">
          {thinking ? "thinking..." : "asks the questions that sharpen yours"}
        </div>
        <div className="text-[10px] text-cosmos-muted/40 mt-2 max-w-[240px] mx-auto leading-relaxed italic">
          May ask follow-ups to clarify the context or pull in more detail.
        </div>
      </div>
    </div>
  );
}

function Bubble({ message, isLatest, onChipClick, disabled, onSpeak, isSpeaking, ttsSupported }: {
  message: BriefMessage;
  isLatest: boolean;
  onChipClick: (text: string) => void;
  disabled: boolean;
  onSpeak?: () => void;
  isSpeaking?: boolean;
  ttsSupported?: boolean;
}) {
  const isSetup = message.role === "setup";
  const [showChips, setShowChips] = useState(false);
  const [offerHelp, setOfferHelp] = useState(false);

  useEffect(() => {
    if (!isLatest || !isSetup) return;
    setShowChips(false);
    setOfferHelp(false);
    // Suggest-responses link only appears after a full minute of inactivity.
    // The default behavior is the user types or talks; chips are a fallback
    // for genuine stuckness, not a quick shortcut.
    const t = setTimeout(() => setOfferHelp(true), 60000);
    return () => clearTimeout(t);
  }, [isLatest, isSetup, message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-2"
    >
      <div className={`flex ${isSetup ? "justify-start" : "justify-end"} items-end gap-1.5`}>
        <div
          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isSetup
              ? "bg-cosmos-glow/8 border border-cosmos-glow/20 text-cosmos-text rounded-tl-sm"
              : "bg-cosmos-surface/80 border border-cosmos-border text-cosmos-text/90 rounded-tr-sm"
          }`}
        >
          {message.content}
        </div>
        {isSetup && ttsSupported && onSpeak && (
          <button
            onClick={onSpeak}
            aria-label={isSpeaking ? "Stop speaking" : "Listen"}
            className={`flex-shrink-0 p-1.5 rounded-full transition-all ${
              isSpeaking
                ? "bg-cosmos-glow/15 text-cosmos-glow"
                : "text-cosmos-muted/40 hover:text-cosmos-glow hover:bg-cosmos-glow/8"
            }`}
            title={isSpeaking ? "Stop" : "Read aloud"}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Chips are opt-in: a "Suggest responses" link appears after silence,
          and clicking it reveals the chip set. The user types or talks first. */}
      {isSetup && isLatest && message.options && message.options.length > 0 && (
        <div className="pl-1">
          {!showChips && offerHelp && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setShowChips(true)}
              disabled={disabled}
              className="text-[11px] text-cosmos-muted/55 hover:text-cosmos-muted underline underline-offset-2 decoration-dotted disabled:opacity-30"
            >
              Suggest responses
            </motion.button>
          )}
          {showChips && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap gap-1.5"
            >
              {message.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onChipClick(opt)}
                  disabled={disabled}
                  className="px-3 py-1.5 text-xs text-cosmos-muted/70 bg-transparent border border-cosmos-border/40 rounded-lg hover:bg-cosmos-glow/5 hover:text-cosmos-glow/85 hover:border-cosmos-glow/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ReadyActions({
  briefExtracted,
  recommendedPersonas,
  castConversations,
  onOpenTree,
  onSummonPersona,
  onAddCustomExpert,
}: {
  briefExtracted: { goal: string | null; values: string[]; constraints: string[] };
  recommendedPersonas: { id: string; name: string; role: string; archetype: string }[];
  castConversations: Record<string, { ready: boolean }>;
  onOpenTree: () => void;
  onSummonPersona: (id: string) => void;
  onAddCustomExpert: (description: string) => Promise<void>;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const submitCustom = async () => {
    const t = customInput.trim();
    if (!t || customLoading) return;
    setCustomLoading(true);
    try {
      await onAddCustomExpert(t);
      setCustomInput("");
      setCustomOpen(false);
    } finally {
      setCustomLoading(false);
    }
  };
  const MIN_PERSONAS = 2;
  const completedCount = Object.values(castConversations).filter((c) => c.ready).length;
  const gateOpen = completedCount >= MIN_PERSONAS;
  const nextPersona = recommendedPersonas.find((p) => !castConversations[p.id]?.ready);
  // Color hint per archetype
  const archetypeColor = (archetype: string) => {
    switch (archetype) {
      case "skeptic":
        return { bg: "bg-cosmos-judgment/15", border: "border-cosmos-judgment/40", text: "text-cosmos-judgment", hover: "hover:bg-cosmos-judgment/25" };
      case "pragmatist":
        return { bg: "bg-cosmos-reckoning/15", border: "border-cosmos-reckoning/40", text: "text-cosmos-reckoning", hover: "hover:bg-cosmos-reckoning/25" };
      case "stress-test":
        return { bg: "bg-cosmos-conflict/15", border: "border-cosmos-conflict/40", text: "text-cosmos-conflict", hover: "hover:bg-cosmos-conflict/25" };
      default:
        return { bg: "bg-cosmos-resolved/12", border: "border-cosmos-resolved/35", text: "text-cosmos-resolved", hover: "hover:bg-cosmos-resolved/22" };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 pl-1 pt-1"
    >
      {(briefExtracted.values.length > 0 || briefExtracted.constraints.length > 0) && (
        <div className="p-2.5 bg-cosmos-bg/40 border border-cosmos-border/30 rounded-lg">
          <div className="text-[9px] text-cosmos-muted/50 uppercase tracking-wider mb-1.5">
            Setup picked up
          </div>
          {briefExtracted.values.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {briefExtracted.values.map((v) => (
                <span key={v} className="px-1.5 py-0.5 text-[10px] bg-cosmos-glow/10 border border-cosmos-glow/25 rounded-full text-cosmos-glow">
                  {v}
                </span>
              ))}
            </div>
          )}
          {briefExtracted.constraints.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {briefExtracted.constraints.map((c) => (
                <span key={c} className="px-1.5 py-0.5 text-[10px] bg-cosmos-conflict/10 border border-cosmos-conflict/25 rounded-full text-cosmos-conflict/80">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended cast — Setup picked these for this specific goal */}
      {recommendedPersonas.length > 0 ? (
        <div className="p-3 bg-cosmos-glow/5 border border-cosmos-glow/20 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cosmos-glow/70 uppercase tracking-wider">
              Suggested cast for this goal
            </span>
            <span className="text-[9px] text-cosmos-muted/40">
              {recommendedPersonas.length} {recommendedPersonas.length === 1 ? "persona" : "personas"}
            </span>
          </div>
          <p className="text-[11px] text-cosmos-muted/60 leading-relaxed">
            Start with one of these. Each will push your thinking from a different angle. You can come back to Setup anytime (tap it in the strip up top) if a new question opens up or you want to add another expert.
          </p>
          <div className="space-y-1.5">
            {recommendedPersonas.map((p, idx) => {
              const c = archetypeColor(p.archetype);
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const alreadyTalked = !!castConversations[p.id]?.ready;
              // Strongest emphasis on the first un-talked-to persona;
              // a softer secondary emphasis on the second so the user
              // sees a clear "go here next" after the first.
              const shouldPulse = isFirst && !alreadyTalked;
              const shouldHintSecondary = isSecond && !alreadyTalked && !castConversations[recommendedPersonas[0]?.id]?.ready;
              return (
                <button
                  key={p.id}
                  onClick={() => onSummonPersona(p.id)}
                  className={`w-full text-left flex items-start gap-2 p-2 rounded-lg border transition-all ${c.bg} ${c.border} ${c.hover} ${shouldPulse ? "animate-pulse-glow" : ""} ${shouldHintSecondary ? "ring-1 ring-cosmos-glow/15" : ""}`}
                >
                  <div className={`text-xs font-medium ${c.text}`}>
                    {p.name}
                  </div>
                  {p.role && (
                    <div className="text-[10px] text-cosmos-text/60 leading-relaxed flex-1">
                      {p.role}
                    </div>
                  )}
                  <ArrowRight className={`w-3 h-3 ${c.text} mt-0.5 shrink-0`} />
                </button>
              );
            })}
          </div>
          {/* Custom SME: user describes a specific expert they want to talk
              to and the persona is added to the cast with a generated dossier. */}
          <div className="pt-2 border-t border-cosmos-glow/15">
            {!customOpen ? (
              <button
                onClick={() => setCustomOpen(true)}
                className="w-full text-left text-[11px] text-cosmos-muted/70 hover:text-cosmos-glow/80 transition-colors py-1"
              >
                + Add a specific expert
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] text-cosmos-muted/60 uppercase tracking-wider">
                  Describe the expert you want to talk to
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitCustom();
                    }
                  }}
                  placeholder="e.g. a developmental pediatrician who has worked with kids on the autism spectrum"
                  rows={2}
                  disabled={customLoading}
                  className="w-full bg-cosmos-bg/50 border border-cosmos-border/50 rounded-lg px-2.5 py-2 text-[12px] text-cosmos-text placeholder:text-cosmos-muted/40 focus:outline-none focus:border-cosmos-glow/40 resize-none disabled:opacity-50"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={submitCustom}
                    disabled={!customInput.trim() || customLoading}
                    className="px-3 py-1.5 text-[11px] bg-cosmos-glow/15 border border-cosmos-glow/35 rounded-lg text-cosmos-glow hover:bg-cosmos-glow/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                  >
                    {customLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {customLoading ? "Building..." : "Add to cast"}
                  </button>
                  <button
                    onClick={() => {
                      setCustomOpen(false);
                      setCustomInput("");
                    }}
                    disabled={customLoading}
                    className="text-[11px] text-cosmos-muted/50 hover:text-cosmos-muted transition-colors disabled:opacity-30"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-cosmos-judgment/8 border border-cosmos-judgment/25 rounded-lg">
          <p className="text-xs text-cosmos-text/85 leading-relaxed">
            Setup is ready. Open the tree below, or keep adding context.
          </p>
        </div>
      )}

      {/* Setup never offers a tree-opening affordance. The tree opens from
          inside CastPersonaPanel's ready-state, after the user has actually
          been pushed by personas. Setup only points the user toward the
          next un-talked-to persona. */}
      {!gateOpen && (
        <p className="text-[11px] text-cosmos-muted/55 pt-1 leading-relaxed">
          Talked with {completedCount} of {MIN_PERSONAS}.
          {nextPersona ? (
            <>
              {" "}Try{" "}
              <button
                onClick={() => onSummonPersona(nextPersona.id)}
                className="text-cosmos-judgment/85 hover:text-cosmos-judgment underline underline-offset-2"
              >
                {nextPersona.name}
              </button>{" "}
              next.
            </>
          ) : null}
        </p>
      )}
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-3.5 py-2.5">
      <span className="w-1.5 h-1.5 rounded-full bg-cosmos-glow/40 animate-pulse" />
      <span className="w-1.5 h-1.5 rounded-full bg-cosmos-glow/40 animate-pulse" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-cosmos-glow/40 animate-pulse" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export default function SetupPanel({ onReady, onSummonPersona, examples }: Props) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const {
    briefMessages,
    addBriefMessage,
    briefReady,
    briefExtracted,
    setBriefReady,
    briefLoading,
    setBriefLoading,
    language,
    resetBrief,
    setRecommendedPersonas,
    recommendedPersonas,
    castConversations,
  } = useStore();
  const tts = useTextToSpeech();
  const animalese = useAnimalese();
  const setupVoiceProfile = getVoiceProfile("setup");
  const setupAnimaleseProfile = getAnimaleseProfile("setup");
  const [voiceMode, setVoiceMode] = useState<"tts" | "animalese">("animalese");
  const lastAutoPlayedIdxRef = useRef(-1);

  const isAnyTalking = voiceMode === "tts" ? tts.speaking : animalese.speaking;
  const supportsActiveMode = voiceMode === "tts" ? tts.supported : animalese.supported;

  const speakSetupMessage = (idx: number, text: string) => {
    if (!supportsActiveMode || !text) return;
    if (speakingIdx === idx && isAnyTalking) {
      tts.stop();
      animalese.stop();
      setSpeakingIdx(null);
      return;
    }
    tts.stop();
    animalese.stop();
    setSpeakingIdx(idx);
    if (voiceMode === "animalese") {
      animalese.speak(text, "setup", setupAnimaleseProfile);
    } else {
      tts.speak(text, "setup", setupVoiceProfile);
    }
  };

  // Auto-play the latest Setup message when autoPlay is enabled.
  useEffect(() => {
    if (!autoPlay || !supportsActiveMode || isAnyTalking) return;
    let latest = -1;
    for (let i = briefMessages.length - 1; i >= 0; i--) {
      if (briefMessages[i].role === "setup") { latest = i; break; }
    }
    if (latest > lastAutoPlayedIdxRef.current && briefMessages[latest]?.content) {
      lastAutoPlayedIdxRef.current = latest;
      speakSetupMessage(latest, briefMessages[latest].content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefMessages.length, autoPlay, voiceMode, supportsActiveMode]);

  useEffect(() => {
    if (!isAnyTalking && speakingIdx !== null) {
      const t = setTimeout(() => setSpeakingIdx(null), 50);
      return () => clearTimeout(t);
    }
  }, [isAnyTalking, speakingIdx]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [briefMessages, briefLoading]);

  // Voice input. Snapshots input at recording start so interim transcripts
  // don't pile on top of each other and produce stuttering output.
  const inputAtStartRef = useRef("");
  const isRecRef = useRef(isRecording);
  useEffect(() => { isRecRef.current = isRecording; }, [isRecording]);
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    // Aggressive teardown of any prior recognition (Safari's start() can
    // silently fail when the previous instance is still shutting down).
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current = null;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    inputAtStartRef.current = input;
    let lastSpoken = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let all = "";
      for (let i = 0; i < event.results.length; i++) {
        all += event.results[i][0].transcript + " ";
      }
      const spoken = all.trim();
      if (!spoken) return;
      lastSpoken = spoken;
      const prefix = inputAtStartRef.current;
      const sep = prefix && spoken ? " " : "";
      setInput(prefix + sep + spoken);
      if (inputRef.current) {
        const el = inputRef.current;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 180) + "px";
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => {
      setIsRecording(false);
      if (lastSpoken) {
        const prefix = inputAtStartRef.current;
        const sep = prefix && lastSpoken ? " " : "";
        setInput(prefix + sep + lastSpoken);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Speech recognition start failed; retrying in 100ms", err);
      setTimeout(() => {
        try {
          recognition.start();
          setIsRecording(true);
        } catch (e) {
          console.error("Speech recognition retry also failed", e);
          setIsRecording(false);
        }
      }, 100);
    }
  }, [isRecording, language, input]);

  // Push-to-talk: hold Space anywhere in the Setup overlay (when not focused
  // in a textarea/input) to record. Released = stop. Same affordance as
  // CastPersonaPanel and PanelView.
  const toggleRef = useRef(toggleRecording);
  useEffect(() => { toggleRef.current = toggleRecording; }, [toggleRecording]);
  useEffect(() => {
    const pttActive = { current: false };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || (t as HTMLElement).isContentEditable)) return;
      e.preventDefault();
      if (!isRecRef.current) {
        pttActive.current = true;
        toggleRef.current();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (pttActive.current && isRecRef.current) {
        pttActive.current = false;
        toggleRef.current();
      } else {
        pttActive.current = false;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || briefLoading) return;

    // Stop voice if active
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const userMsg: BriefMessage = { role: "user", content: text };
    addBriefMessage(userMsg);
    setInput("");
    setBriefLoading(true);

    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const data = await safeFetch("/api/brief", {
        messages: [...briefMessages, userMsg],
        language,
      });

      if (data.error) {
        addBriefMessage({
          role: "setup",
          content: "Something went wrong. Try again.",
        });
        return;
      }

      if (data.reply) {
        addBriefMessage({
          role: "setup",
          content: data.reply,
          options: Array.isArray(data.options) ? data.options : [],
        });
      }
      if (data.ready) {
        setBriefReady(true, {
          goal: data.extractedGoal || text,
          values: data.extractedValues || [],
          constraints: data.extractedConstraints || [],
        });
        if (Array.isArray(data.recommendedPersonas) && data.recommendedPersonas.length > 0) {
          // Validate each persona has the expected shape and forward optional
          // dossier fields (expertise/pushFor/vocabulary) so domain experts
          // get real domain priming at runtime, not just a name + role label.
          const valid = data.recommendedPersonas
            .filter(
              (p: {
                id?: string;
                name?: string;
                role?: string;
                archetype?: string;
              }) => p && typeof p.id === "string" && typeof p.name === "string",
            )
            .map(
              (p: {
                id: string;
                name: string;
                role?: string;
                archetype?: string;
                expertise?: string;
                pushFor?: string;
                vocabulary?: string[];
                accessory?: string;
              }) => ({
                id: p.id,
                name: p.name,
                role: p.role || "",
                archetype: p.archetype || "expert",
                expertise: typeof p.expertise === "string" ? p.expertise : undefined,
                pushFor: typeof p.pushFor === "string" ? p.pushFor : undefined,
                vocabulary: Array.isArray(p.vocabulary)
                  ? p.vocabulary.filter((v) => typeof v === "string").slice(0, 12)
                  : undefined,
                accessory: typeof p.accessory === "string" ? p.accessory : undefined,
              }),
            );
          setRecommendedPersonas(valid);
        }
      } else if (briefReady) {
        // User kept typing past ready → un-ready until Setup re-confirms
        setBriefReady(false);
      }
    } catch (err) {
      console.error("Setup failed:", err);
      addBriefMessage({
        role: "setup",
        content: "Connection issue. Try again in a moment.",
      });
    } finally {
      setBriefLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  const initial = briefMessages.length === 0;

  const handleOpenTree = () => {
    onReady(
      briefExtracted.goal || briefMessages.find((m) => m.role === "user")?.content || "",
      briefExtracted.values,
      briefExtracted.constraints,
    );
  };

  // User-specified Subject Matter Expert. Calls the custom-persona endpoint
  // to generate a full dossier from the description, then appends to the
  // recommendedPersonas list so the user can summon them like any other.
  const addCustomExpert = async (description: string) => {
    try {
      const data = await safeFetch("/api/custom-persona", {
        description,
        goal: briefExtracted.goal || "",
        language,
      });
      if (data.error || !data.id || !data.name) {
        addBriefMessage({
          role: "setup",
          content: "I had trouble building that expert. Try describing them slightly differently.",
        });
        return;
      }
      // Avoid duplicate ids if the user adds two similar experts.
      let id: string = data.id;
      let n = 2;
      while (recommendedPersonas.some((p) => p.id === id)) {
        id = `${data.id}-${n++}`;
      }
      const newPersona = {
        id,
        name: data.name,
        role: typeof data.role === "string" ? data.role : "",
        archetype: "expert",
        expertise: typeof data.expertise === "string" ? data.expertise : undefined,
        pushFor: typeof data.pushFor === "string" ? data.pushFor : undefined,
        vocabulary: Array.isArray(data.vocabulary)
          ? data.vocabulary.filter((v: unknown) => typeof v === "string").slice(0, 12)
          : undefined,
        accessory: typeof data.accessory === "string" ? data.accessory : undefined,
      };
      setRecommendedPersonas([...recommendedPersonas, newPersona]);
    } catch (err) {
      console.error("Custom persona failed:", err);
      addBriefMessage({
        role: "setup",
        content: "Connection issue while building that expert. Try again in a moment.",
      });
    }
  };

  // Latest setup message index
  let latestSetupIdx = -1;
  for (let i = briefMessages.length - 1; i >= 0; i--) {
    if (briefMessages[i].role === "setup") {
      latestSetupIdx = i;
      break;
    }
  }

  // Reusable mic button
  const MicButton = () => (
    <button
      onClick={toggleRecording}
      disabled={briefLoading}
      className={`p-2 rounded-lg transition-colors ${
        isRecording
          ? "text-cosmos-conflict bg-cosmos-conflict/15 animate-pulse"
          : "text-cosmos-muted/50 hover:text-cosmos-glow hover:bg-cosmos-glow/10"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
      title={isRecording ? "Stop recording" : "Speak instead of typing"}
    >
      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
    </button>
  );

  // ===== INITIAL CARD STATE =====
  if (initial) {
    return (
      <div className="bg-cosmos-surface/40 backdrop-blur-sm border border-cosmos-border/50 rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <SigilSmall />
          <span className="text-sm font-medium text-cosmos-text">Setup</span>
          <span className="text-[10px] text-cosmos-muted/40 hidden sm:inline">
            let&apos;s sharpen the question first
          </span>
        </div>

        {/* Initial prompt */}
        <p className="text-cosmos-text text-base font-medium leading-relaxed mb-1">
          What are you trying to decide?
        </p>
        <p className="text-[11px] text-cosmos-muted/55 italic mb-4 leading-relaxed">
          Setup may ask a few follow-ups to clarify the context or pull in more detail before handing you to the cast.
        </p>

        {/* Input */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type or speak. Setup adapts to a sentence or a paragraph."
            rows={3}
            autoFocus
            disabled={briefLoading}
            className="w-full bg-cosmos-bg/50 border border-cosmos-border/50 rounded-xl px-4 py-3 pr-20 text-sm text-cosmos-text placeholder:text-cosmos-muted/40 focus:outline-none focus:border-cosmos-glow/40 resize-none transition-all disabled:opacity-50"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <MicButton />
            <button
              onClick={() => send()}
              disabled={!input.trim() || briefLoading}
              className="p-2 bg-cosmos-glow/15 border border-cosmos-glow/25 rounded-lg text-cosmos-glow hover:bg-cosmos-glow/25 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
              title="Send"
            >
              {briefLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Suggested openers, rendered as full-width starter cards because
            the demo questions are long-form and don't fit a chip layout. */}
        <div className="mt-5">
          <div className="text-[10px] text-cosmos-muted/40 uppercase tracking-wider mb-2.5">
            Or start from
          </div>
          <div className="flex flex-col gap-2">
            {examples.map(({ text }) => (
              <button
                key={text}
                onClick={() => send(text)}
                disabled={briefLoading}
                className="text-left px-4 py-3 text-[12.5px] text-cosmos-text/85 leading-relaxed border border-cosmos-border/60 rounded-xl hover:border-cosmos-glow/45 hover:text-cosmos-text hover:bg-cosmos-glow/8 transition-all disabled:opacity-30 break-words"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== IN-CONVERSATION FULLSCREEN PERSONA ROOM =====
  return (
    <AnimatePresence>
      <motion.div
        key="persona-room"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-40 bg-cosmos-bg backdrop-blur-md"
      >
        {/* Voice + close cluster, top right. The voice toggle controls
            whether Setup auto-reads its messages aloud. Per-message volume
            buttons on each Setup bubble give manual control regardless. */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-1">
          {/* Voice-mode toggle: cycles TTS <-> Animalese. */}
          <button
            onClick={() => setVoiceMode((m) => (m === "tts" ? "animalese" : "tts"))}
            className={`p-2 rounded-lg transition-colors ${
              voiceMode === "animalese"
                ? "bg-cosmos-glow/15 text-cosmos-glow"
                : "text-cosmos-muted/50 hover:text-cosmos-text"
            }`}
            title={
              voiceMode === "animalese"
                ? "Animal Crossing-style voice. Click for natural TTS."
                : "Natural TTS. Click for Animal Crossing-style voice."
            }
          >
            <Music className="w-4 h-4" />
          </button>
          {supportsActiveMode && (
            <button
              onClick={() => setAutoPlay((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${
                autoPlay
                  ? "bg-cosmos-glow/15 text-cosmos-glow"
                  : "text-cosmos-muted/50 hover:text-cosmos-text"
              }`}
              title={autoPlay ? "Setup voice on. Click to silence." : "Setup voice off. Click to enable."}
            >
              {autoPlay ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => {
              if (briefMessages.length > 0) {
                if (!confirm("Close Setup and return home? Your conversation will be discarded.")) return;
              }
              resetBrief();
            }}
            className="p-2 text-cosmos-muted/50 hover:text-cosmos-text transition-colors rounded-lg"
            title="Close Setup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full">
          {/* Persona navigation strip — top center */}
          <PersonaStrip activeId="setup" />

          {/* LEFT: Persona character — half the screen */}
          <div className="md:w-1/2 h-1/3 md:h-full relative bg-gradient-to-br from-cosmos-bg via-cosmos-surface/30 to-cosmos-bg">
            <SetupCharacter thinking={briefLoading} />
          </div>

          {/* RIGHT: Conversation + input — half the screen */}
          <div className="md:w-1/2 flex-1 md:h-full flex flex-col">
            {/* Conversation thread */}
            <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
              <div className="max-w-xl mx-auto space-y-4">
                {briefMessages.map((m, i) => (
                  <div key={i} className="space-y-2">
                    <Bubble
                      message={m}
                      isLatest={i === latestSetupIdx}
                      onChipClick={(text) => send(text)}
                      disabled={briefLoading}
                      ttsSupported={supportsActiveMode}
                      isSpeaking={speakingIdx === i && isAnyTalking}
                      onSpeak={() => speakSetupMessage(i, m.content)}
                    />
                    {briefReady && i === latestSetupIdx && (
                      <ReadyActions
                        briefExtracted={briefExtracted}
                        recommendedPersonas={recommendedPersonas}
                        castConversations={castConversations}
                        onOpenTree={handleOpenTree}
                        onSummonPersona={onSummonPersona}
                        onAddCustomExpert={addCustomExpert}
                      />
                    )}
                  </div>
                ))}
                {briefLoading && <TypingDots />}
                <div ref={endRef} />
              </div>
            </div>

            {/* Bottom: input always visible */}
            <div className="border-t border-cosmos-border/30 bg-cosmos-surface/40 backdrop-blur-sm">
              <div className="max-w-xl mx-auto px-6 md:px-10 py-5">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={
                      briefReady
                        ? "Add more context, push back, or click 'Open the tree' above..."
                        : "Reply, or click an option above..."
                    }
                    rows={2}
                    autoFocus
                    disabled={briefLoading}
                    className="w-full bg-cosmos-bg/50 border border-cosmos-border/50 rounded-xl px-4 py-3 pr-20 text-sm text-cosmos-text placeholder:text-cosmos-muted/40 focus:outline-none focus:border-cosmos-glow/40 resize-none transition-all disabled:opacity-50"
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <MicButton />
                    <button
                      onClick={() => send()}
                      disabled={!input.trim() || briefLoading}
                      className="p-2 bg-cosmos-glow/15 border border-cosmos-glow/25 rounded-lg text-cosmos-glow hover:bg-cosmos-glow/25 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                      title="Send"
                    >
                      {briefLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-[10px] text-cosmos-muted/40">
                    {isRecording ? (
                      <span className="text-cosmos-conflict">Listening...</span>
                    ) : (
                      <>Hold <kbd className="px-1 py-0.5 rounded border border-cosmos-border/50 text-cosmos-muted/55 font-mono text-[9px]">Space</kbd> to talk</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
