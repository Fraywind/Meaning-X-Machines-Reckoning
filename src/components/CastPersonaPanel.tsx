"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Send, Loader2, X, Mic, MicOff } from "lucide-react";
import { useStore, BriefMessage, PersonaConcern } from "@/store/useStore";
import { safeFetch } from "@/lib/api";
import { getLanguageConfig } from "@/lib/i18n";
import { getPersonaColors, PersonaColorSet } from "@/lib/personaColors";
import PersonaStrip from "./PersonaStrip";

export interface CastPersonaConfig {
  id: string;
  name: string;
  subtitle: string;
  thinkingLabel: string;
  archetype: string;
  /** Optional role description for domain-specific (Expert) personas */
  role?: string;
  /** Templated first message shown immediately when the panel opens. Avoids
   *  a blank right side while the LLM is computing the opening turn. */
  openingMessage: string;
  /** Quick-pick options shown alongside the opening message. */
  openingOptions?: string[];
  CharacterComponent: React.ComponentType<{ thinking: boolean }>;
}

interface Props {
  persona: CastPersonaConfig;
  onComplete: (summary: string) => void;
  onClose: () => void;
}

function Bubble({
  message,
  isLatest,
  onChipClick,
  disabled,
  colors,
}: {
  message: BriefMessage;
  isLatest: boolean;
  onChipClick: (text: string) => void;
  disabled: boolean;
  colors: PersonaColorSet;
}) {
  const isPersona = message.role === "setup";
  const [showChips, setShowChips] = useState(false);
  const [offerHelp, setOfferHelp] = useState(false);

  // After silence, offer "Suggest responses" rather than auto-revealing chips.
  // Gives the user time to think and articulate first.
  useEffect(() => {
    if (!isLatest || !isPersona) return;
    setShowChips(false);
    setOfferHelp(false);
    const t = setTimeout(() => setOfferHelp(true), 8000);
    return () => clearTimeout(t);
  }, [isLatest, isPersona, message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-2"
    >
      <div className={`flex ${isPersona ? "justify-start" : "justify-end"}`}>
        <div
          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isPersona
              ? `${colors.bubbleBg} border ${colors.bubbleBorder} text-cosmos-text rounded-tl-sm`
              : "bg-cosmos-surface/80 border border-cosmos-border text-cosmos-text/90 rounded-tr-sm"
          }`}
        >
          {message.content}
        </div>
      </div>

      {isPersona && isLatest && message.options && message.options.length > 0 && (
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
                  className={`px-3 py-1.5 text-xs ${colors.chipText} ${colors.chipBg} border ${colors.chipBorder} rounded-lg ${colors.chipHoverBg} ${colors.chipHoverBorder} transition-all disabled:opacity-30 disabled:cursor-not-allowed`}
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

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-3.5 py-2.5">
      <span className="w-1.5 h-1.5 rounded-full bg-cosmos-judgment/40 animate-pulse" />
      <span className="w-1.5 h-1.5 rounded-full bg-cosmos-judgment/40 animate-pulse" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-cosmos-judgment/40 animate-pulse" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export default function CastPersonaPanel({ persona, onComplete, onClose }: Props) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const {
    castConversations,
    addCastMessage,
    setCastReady,
    setCastLoading,
    markCastVisited,
    briefExtracted,
    recommendedPersonas,
    setCurrentCastPersona,
    setPendingCrossCheck,
    crossCheckHistory,
    language,
  } = useStore();

  const MIN_PERSONAS = 2;
  const RECOMMENDED_PERSONAS = 3;
  const completedCount = Object.values(castConversations).filter((c) => c.ready).length;
  const gateOpen = completedCount >= MIN_PERSONAS;
  const nextPersona = recommendedPersonas.find(
    (p) => p.id !== persona.id && !castConversations[p.id]?.ready,
  );

  const conversation = castConversations[persona.id] || {
    messages: [],
    ready: false,
    summary: "",
    concerns: [] as PersonaConcern[],
    loading: false,
  };
  const { messages, ready, summary, concerns, loading } = conversation;

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const openedRef = useRef(false);

  // Mark visited on mount; auto-fire opening turn if no messages yet
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    markCastVisited(persona.id);
    if (messages.length === 0) {
      // Seed the conversation with the templated opener so the right side is
      // never blank when the panel opens. The LLM kicks in only on the user's
      // first reply, removing a network round-trip from the entry experience.
      addCastMessage(persona.id, {
        role: "setup",
        content: persona.openingMessage,
        options: persona.openingOptions || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getLanguageConfig(language).speechLang;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t + " ";
        else interim = t;
      }
      setInput((prev) => {
        const base = prev.replace(/​.*$/, "").trimEnd();
        const spoken = (finalTranscript + interim).trim();
        if (!spoken) return base;
        return base ? `${base} ${spoken}` : spoken;
      });
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => {
      setIsRecording(false);
      setInput((prev) => prev.replace(/​.*$/, "").trimEnd());
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, language]);

  const sendTurn = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    // Allow empty text only for the very first opening turn
    const isOpening = messages.length === 0;
    if (!isOpening && !text) return;
    if (loading) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const updatedMessages = isOpening
      ? messages
      : (() => {
          const userMsg: BriefMessage = { role: "user", content: text };
          addCastMessage(persona.id, userMsg);
          return [...messages, userMsg];
        })();

    setInput("");
    setCastLoading(persona.id, true);
    if (inputRef.current) inputRef.current.style.height = "auto";

    const crossCheckUsed = crossCheckHistory.some((entry) => entry.startsWith(`${persona.id}->`));
    const otherPersonas = recommendedPersonas
      .filter((p) => p.id !== persona.id)
      .map((p) => ({ id: p.id, name: p.name, role: p.role }));
    // Look up dossier for the active persona (only domain experts have one)
    // so the runtime prompt is primed with their expertise/pushFor/vocabulary.
    const selfRec = recommendedPersonas.find((p) => p.id === persona.id);

    try {
      const data = await safeFetch("/api/persona", {
        personaId: persona.id,
        archetype: persona.archetype,
        name: persona.name,
        role: persona.role,
        messages: updatedMessages,
        context: {
          goal: briefExtracted.goal || "",
          values: briefExtracted.values || [],
          constraints: briefExtracted.constraints || [],
        },
        language,
        otherPersonas,
        crossCheckUsed,
        expertise: selfRec?.expertise,
        pushFor: selfRec?.pushFor,
        vocabulary: selfRec?.vocabulary,
      });

      if (data.error) {
        addCastMessage(persona.id, {
          role: "setup",
          content: "Something went wrong. Try again or close this persona to keep going.",
        });
        return;
      }

      if (data.reply) {
        addCastMessage(persona.id, {
          role: "setup",
          content: data.reply,
          options: Array.isArray(data.options) ? data.options : [],
        });
      }
      // Cross-check: another recommended persona has a pertinent take.
      // Validate the target is in our recommended list, isn't us, and we haven't already fired.
      if (
        !crossCheckUsed &&
        data.crossCheck &&
        typeof data.crossCheck.personaId === "string" &&
        typeof data.crossCheck.oneLineTake === "string" &&
        data.crossCheck.personaId !== persona.id &&
        recommendedPersonas.some((p) => p.id === data.crossCheck.personaId)
      ) {
        setPendingCrossCheck({
          fromPersonaId: persona.id,
          targetPersonaId: data.crossCheck.personaId,
          oneLineTake: data.crossCheck.oneLineTake.slice(0, 200),
        });
      }
      if (data.ready) {
        const incomingConcerns: PersonaConcern[] = Array.isArray(data.concerns)
          ? data.concerns
              .filter(
                (c: { kind?: string; point?: string; illustration?: string; followupQuestion?: string }) =>
                  c &&
                  (c.kind === "pushback" || c.kind === "enhance") &&
                  typeof c.point === "string" &&
                  typeof c.illustration === "string" &&
                  typeof c.followupQuestion === "string",
              )
              .slice(0, 3)
          : [];
        setCastReady(persona.id, true, data.summary || "", incomingConcerns);
      } else if (ready) {
        setCastReady(persona.id, false);
      }
    } catch (err) {
      console.error(`${persona.name} failed:`, err);
      addCastMessage(persona.id, {
        role: "setup",
        content: "Connection issue. Try again or close this persona.",
      });
    } finally {
      setCastLoading(persona.id, false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  let latestPersonaIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "setup") {
      latestPersonaIdx = i;
      break;
    }
  }

  const Character = persona.CharacterComponent;
  const colors = getPersonaColors(persona.archetype);

  // After this persona is ready, surface up to 3 next-step personas. Excludes
  // self and any already-ready conversations. Falls back gracefully if none.
  const nextSuggestions = recommendedPersonas
    .filter((p) => p.id !== persona.id && !castConversations[p.id]?.ready)
    .slice(0, 3);

  const MicButton = () => (
    <button
      onClick={toggleRecording}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors ${
        isRecording
          ? "text-cosmos-conflict bg-cosmos-conflict/15 animate-pulse"
          : `text-cosmos-muted/50 ${colors.sendHoverBg}`
      } disabled:opacity-30 disabled:cursor-not-allowed`}
      title={isRecording ? "Stop recording" : "Speak instead of typing"}
    >
      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        key={`cast-room-${persona.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[60] bg-cosmos-bg/95 backdrop-blur-md"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 text-cosmos-muted/50 hover:text-cosmos-text transition-colors rounded-lg"
          title={`Close ${persona.name}`}
        >
          <X className="w-5 h-5" />
        </button>

        <PersonaStrip activeId={persona.id} />

        <div className="flex flex-col md:flex-row h-full">
          {/* LEFT: persona character (during conversation) or next-suggestions
              picker (once this persona is ready). The picker shows up to 3 big
              avatars; clicking one switches the panel to that persona. */}
          <div className={`md:w-1/2 h-1/3 md:h-full relative bg-gradient-to-br ${colors.characterGradientFrom} via-cosmos-surface/30 ${colors.characterGradientTo} border-b md:border-b-0 md:border-r border-cosmos-border/30`}>
            {ready && nextSuggestions.length > 0 ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center px-6 py-10">
                <div className="text-[10px] text-cosmos-muted/60 uppercase tracking-[0.3em] mb-2">
                  Next, talk to
                </div>
                <div className={`text-lg font-display font-medium ${colors.activeText} mb-1 text-center`}>
                  {persona.name} surfaced what they could.
                </div>
                <div className="text-[12px] text-cosmos-muted/55 max-w-[300px] text-center mb-8 leading-relaxed">
                  Pick another angle, or open the tree from the right.
                </div>
                <div className="flex flex-wrap items-start justify-center gap-6 max-w-[420px]">
                  {nextSuggestions.map((p, idx) => {
                    const pc = getPersonaColors(p.archetype);
                    const initial = p.name.charAt(0).toUpperCase();
                    const shouldPulse = idx === 0;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setCurrentCastPersona(p.id)}
                        className="group flex flex-col items-center gap-2 transition-transform hover:scale-105"
                      >
                        <div
                          className={`w-20 h-20 rounded-full ${pc.activeBg} border-2 ${pc.activeBorder} ${pc.activeText} flex items-center justify-center text-3xl font-display font-medium shadow-lg ${shouldPulse ? "animate-pulse-glow" : ""}`}
                        >
                          {initial}
                        </div>
                        <div className="text-[12px] font-medium text-cosmos-text/90 text-center leading-tight max-w-[100px]">
                          {p.name}
                        </div>
                        {p.role && (
                          <div className="text-[10px] text-cosmos-muted/55 text-center max-w-[120px] leading-snug line-clamp-2">
                            {p.role.split(".")[0]}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <Character thinking={loading} />
                {/* Speech bubble: shows the persona's latest message floating
                    next to the character so the panel reads as a person
                    speaking, not a chat log next to a portrait. */}
                {latestPersonaIdx >= 0 && messages[latestPersonaIdx]?.content && (
                  <motion.div
                    key={`bubble-${latestPersonaIdx}-${messages[latestPersonaIdx].content.slice(0, 24)}`}
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`absolute top-[18%] right-4 md:right-8 max-w-[300px] md:max-w-[360px] p-3.5 rounded-2xl rounded-bl-sm ${colors.bubbleBg} border ${colors.bubbleBorder} shadow-xl pointer-events-none`}
                  >
                    <div className="text-[13px] md:text-[14px] text-cosmos-text leading-relaxed">
                      {messages[latestPersonaIdx].content}
                    </div>
                    {/* Tail pointing toward the character */}
                    <div
                      className={`absolute -bottom-2 left-6 w-3 h-3 rotate-45 ${colors.bubbleBg} border-r border-b ${colors.bubbleBorder}`}
                    />
                  </motion.div>
                )}
                <div className="absolute bottom-6 text-center px-4 pointer-events-none">
                  <div className="text-[10px] text-cosmos-muted/50 uppercase tracking-[0.3em] mb-1">Persona</div>
                  <div className="text-2xl font-display font-medium text-cosmos-text">{persona.name}</div>
                  <div className="text-[11px] text-cosmos-muted/50 mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                    {loading ? persona.thinkingLabel : persona.subtitle}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: conversation */}
          <div className="md:w-1/2 flex-1 md:h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
              <div className="max-w-xl mx-auto space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className="space-y-2">
                    <Bubble
                      message={m}
                      isLatest={i === latestPersonaIdx}
                      onChipClick={(text) => sendTurn(text)}
                      disabled={loading}
                      colors={colors}
                    />
                    {ready && i === latestPersonaIdx && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 pl-1 pt-1"
                      >
                        {summary && (
                          <div className={`p-2.5 bg-cosmos-bg/40 border ${colors.surfacedBorder} rounded-lg`}>
                            <div className={`text-[9px] ${colors.surfacedLabel} uppercase tracking-wider mb-1.5`}>
                              {persona.name} surfaced
                            </div>
                            <p className="text-[11px] text-cosmos-text/80 leading-relaxed">{summary}</p>
                          </div>
                        )}

                        {concerns.length > 0 && (
                          <div className="space-y-1.5 pt-0.5">
                            {concerns.map((c, ci) => {
                              const isPushback = c.kind === "pushback";
                              return (
                                <div
                                  key={ci}
                                  className={`p-2.5 rounded-lg border ${
                                    isPushback ? colors.surfacedBorder : "border-cosmos-resolved/25"
                                  } ${isPushback ? "bg-cosmos-bg/40" : "bg-cosmos-resolved/5"}`}
                                >
                                  <div className="flex items-baseline gap-1.5 mb-1">
                                    <span
                                      className={`text-[8px] uppercase tracking-wider font-semibold ${
                                        isPushback ? colors.surfacedLabel : "text-cosmos-resolved/70"
                                      }`}
                                    >
                                      {isPushback ? "Pushback" : "Naming this"}
                                    </span>
                                    <span className="text-[11px] font-medium text-cosmos-text/90 leading-snug">
                                      {c.point}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-cosmos-text/70 leading-relaxed">
                                    {c.illustration}
                                  </p>
                                  {c.followupQuestion && (
                                    <button
                                      onClick={() => sendTurn(c.followupQuestion)}
                                      disabled={loading}
                                      className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] ${colors.chipText} ${colors.chipBg} border ${colors.chipBorder} rounded-md ${colors.chipHoverBg} ${colors.chipHoverBorder} transition-all disabled:opacity-30 disabled:cursor-not-allowed`}
                                    >
                                      {c.followupQuestion}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {gateOpen ? (
                          <>
                            <button
                              onClick={() => onComplete(summary || "")}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-cosmos-resolved/15 border border-cosmos-resolved/40 rounded-lg text-cosmos-resolved text-sm font-medium hover:bg-cosmos-resolved/25 transition-all"
                            >
                              Open the tree
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <p className="text-[10px] text-cosmos-muted/40 pt-1">
                              {completedCount < RECOMMENDED_PERSONAS
                                ? `Talked with ${completedCount} of ${recommendedPersonas.length}. One more is recommended for a sharper tree.`
                                : `Or keep pushing back below. ${persona.name} will respond.`}
                            </p>
                          </>
                        ) : (
                          <>
                            <button
                              disabled
                              className="inline-flex items-center gap-2 px-4 py-2 bg-cosmos-bg/30 border border-cosmos-border/30 rounded-lg text-cosmos-muted/40 text-sm font-medium cursor-not-allowed"
                              title={`Talk with at least ${MIN_PERSONAS} personas before opening the tree`}
                            >
                              Open the tree
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <p className="text-[11px] text-cosmos-muted/60 pt-1 leading-relaxed">
                              Talked with {completedCount} of {MIN_PERSONAS}.{" "}
                              {nextPersona ? (
                                <>
                                  Try{" "}
                                  <button
                                    onClick={() => setCurrentCastPersona(nextPersona.id)}
                                    className="text-cosmos-judgment/85 hover:text-cosmos-judgment underline underline-offset-2"
                                  >
                                    {nextPersona.name}
                                  </button>{" "}
                                  next to unlock the tree.
                                </>
                              ) : (
                                <>One more persona unlocks the tree.</>
                              )}
                            </p>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                ))}
                {loading && <TypingDots />}
                <div ref={endRef} />
              </div>
            </div>

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
                        sendTurn();
                      }
                    }}
                    placeholder={
                      ready
                        ? `Push back, add detail, or click "Open the tree"...`
                        : `Reply to ${persona.name}, or click an option above...`
                    }
                    rows={2}
                    autoFocus
                    disabled={loading}
                    className={`w-full bg-cosmos-bg/50 border border-cosmos-border/50 rounded-xl px-4 py-3 pr-20 text-sm text-cosmos-text placeholder:text-cosmos-muted/40 focus:outline-none ${colors.inputFocusBorder} resize-none transition-all disabled:opacity-50`}
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <MicButton />
                    <button
                      onClick={() => sendTurn()}
                      disabled={!input.trim() || loading}
                      className={`p-2 ${colors.sendBg} border ${colors.sendBorder} rounded-lg ${colors.sendText} ${colors.sendHoverBg} transition-all disabled:opacity-25 disabled:cursor-not-allowed`}
                      title="Send"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="text-[11px] text-cosmos-muted/40 hover:text-cosmos-muted transition-colors disabled:opacity-30"
                  >
                    Back to Setup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
