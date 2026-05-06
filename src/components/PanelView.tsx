"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, Volume2, VolumeX, Mic, MicOff, Music } from "lucide-react";
import { useStore } from "@/store/useStore";
import { safeFetch } from "@/lib/api";
import { getLanguageConfig } from "@/lib/i18n";
import { getPersonaColors } from "@/lib/personaColors";
import { useTextToSpeech, getVoiceProfile } from "@/lib/useTextToSpeech";
import { useAnimalese, getAnimaleseProfile } from "@/lib/useAnimalese";
import { CastPersonaConfig } from "./CastPersonaPanel";

const TURN_BUDGET = 4;

interface Props {
  configs: [CastPersonaConfig, CastPersonaConfig];
  onClose: () => void;
}

/**
 * Panel mode: two personas in a moderated conversation with the user.
 * The user controls every turn (clicks an avatar to make THAT persona
 * respond next). No auto-fire. Soft 4-turn budget visible to the user.
 * Direct address between personas only when there is real substance,
 * enforced by the panelContext block in the prompt.
 */
export default function PanelView({ configs, onClose }: Props) {
  const [pA, pB] = configs;
  const colorsA = getPersonaColors(pA.archetype);
  const colorsB = getPersonaColors(pB.archetype);
  const CharA = pA.CharacterComponent;
  const CharB = pB.CharacterComponent;

  const {
    panelMessages,
    panelTurnsUsed,
    panelLoadingPersona,
    addPanelMessage,
    setPanelLoadingPersona,
    briefExtracted,
    language,
  } = useStore();

  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [voiceMode, setVoiceMode] = useState<"tts" | "animalese">("animalese");
  const tts = useTextToSpeech();
  const animalese = useAnimalese();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastAutoPlayedIdxRef = useRef(-1);

  const isAnyTalking = voiceMode === "tts" ? tts.speaking : animalese.speaking;
  const supportsActiveMode = voiceMode === "tts" ? tts.supported : animalese.supported;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [panelMessages.length, panelLoadingPersona]);

  const speakMessage = (idx: number, text: string, personaId: string) => {
    const cfg = personaId === pA.id ? pA : pB;
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
      animalese.speak(text, cfg.id, getAnimaleseProfile(cfg.archetype));
    } else {
      tts.speak(text, cfg.id, getVoiceProfile(cfg.archetype));
    }
  };

  // Auto-play the latest persona message if autoPlay is on.
  useEffect(() => {
    if (!autoPlay || !supportsActiveMode || isAnyTalking) return;
    let latest = -1;
    for (let i = panelMessages.length - 1; i >= 0; i--) {
      if (panelMessages[i].role === "persona") { latest = i; break; }
    }
    if (latest > lastAutoPlayedIdxRef.current && panelMessages[latest]?.content) {
      lastAutoPlayedIdxRef.current = latest;
      const m = panelMessages[latest];
      speakMessage(latest, m.content, m.personaId || pA.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelMessages.length, autoPlay, voiceMode, supportsActiveMode]);

  useEffect(() => {
    if (!isAnyTalking && speakingIdx !== null) {
      const t = setTimeout(() => setSpeakingIdx(null), 50);
      return () => clearTimeout(t);
    }
  }, [isAnyTalking, speakingIdx]);

  // Voice input. Snapshot input at start so interim transcripts don't
  // pile on top of each other and stutter.
  const inputAtStartRef = useRef("");
  const startRecording = () => {
    if (isRecording) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    // Aggressive teardown of any prior recognition (Safari's start() can
    // silently fail if the previous instance is still shutting down).
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
  };
  const stopRecording = () => {
    if (!isRecording) return;
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  // Push-to-talk: hold Space.
  const startRef = useRef(startRecording);
  const stopRef = useRef(stopRecording);
  const isRecRef = useRef(isRecording);
  startRef.current = startRecording;
  stopRef.current = stopRecording;
  isRecRef.current = isRecording;
  useEffect(() => {
    const pttActive = { current: false };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || (t as HTMLElement).isContentEditable)) return;
      e.preventDefault();
      if (!isRecRef.current) {
        pttActive.current = true;
        startRef.current();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (pttActive.current) {
        pttActive.current = false;
        stopRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const summonPersona = async (which: "A" | "B") => {
    const cfg = which === "A" ? pA : pB;
    const otherCfg = which === "A" ? pB : pA;
    if (panelLoadingPersona) return;

    // Find the most recent OTHER-persona message for direct-address context.
    let otherLast = "";
    for (let i = panelMessages.length - 1; i >= 0; i--) {
      const m = panelMessages[i];
      if (m.role === "persona" && m.personaId === otherCfg.id) {
        otherLast = m.content;
        break;
      }
    }

    // Compose conversation for this persona: their own prior turns + user
    // messages, with the other persona's contributions presented as user
    // messages tagged with their name (so this persona sees the panel flow).
    const ownConversation = panelMessages.map((m) => {
      if (m.role === "user") return { role: "user" as const, content: m.content };
      if (m.personaId === cfg.id) return { role: "setup" as const, content: m.content };
      return {
        role: "user" as const,
        content: `[${otherCfg.name} just said]: ${m.content}`,
      };
    });

    setPanelLoadingPersona(cfg.id);
    if (isRecording) stopRecording();
    try {
      const data = await safeFetch("/api/persona", {
        personaId: cfg.id,
        archetype: cfg.archetype,
        name: cfg.name,
        role: cfg.role,
        messages: ownConversation,
        context: {
          goal: briefExtracted.goal || "",
          values: briefExtracted.values || [],
          constraints: briefExtracted.constraints || [],
        },
        language,
        panelContext: {
          otherName: otherCfg.name,
          otherLastMessage: otherLast,
        },
      });
      if (data.error || !data.reply) {
        addPanelMessage({
          role: "persona",
          personaId: cfg.id,
          content: "(Could not respond. Try again.)",
        });
        return;
      }
      addPanelMessage({ role: "persona", personaId: cfg.id, content: data.reply });
    } catch (err) {
      console.error(`${cfg.name} (panel) failed:`, err);
      addPanelMessage({
        role: "persona",
        personaId: cfg.id,
        content: "(Connection issue.)",
      });
    } finally {
      setPanelLoadingPersona(null);
    }
  };

  const submitUserTurn = () => {
    const text = input.trim();
    if (!text || panelLoadingPersona) return;
    addPanelMessage({ role: "user", content: text });
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    if (isRecording) stopRecording();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  const overBudget = panelTurnsUsed >= TURN_BUDGET;
  const turnsLeft = Math.max(0, TURN_BUDGET - panelTurnsUsed);

  return (
    <AnimatePresence>
      <motion.div
        key="panel-room"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[60] bg-cosmos-bg/95 backdrop-blur-md"
      >
        <div className="absolute top-4 right-4 z-50 flex items-center gap-1">
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
              title={autoPlay ? "Voice auto-play on" : "Voice auto-play off"}
            >
              {autoPlay ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-cosmos-muted/50 hover:text-cosmos-text transition-colors rounded-lg"
            title="Exit panel mode"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          {/* TOP: Two personas as a visual cast */}
          <div className="flex border-b border-cosmos-border/30">
            {[
              { cfg: pA, colors: colorsA, Char: CharA, key: "A" as const },
              { cfg: pB, colors: colorsB, Char: CharB, key: "B" as const },
            ].map(({ cfg, colors, Char, key }) => {
              const loading = panelLoadingPersona === cfg.id;
              return (
                <button
                  key={cfg.id}
                  onClick={() => summonPersona(key)}
                  disabled={!!panelLoadingPersona || overBudget}
                  className={`flex-1 relative flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-br ${colors.characterGradientFrom} via-cosmos-surface/30 ${colors.characterGradientTo} hover:brightness-110 transition-all disabled:cursor-not-allowed disabled:opacity-60`}
                  title={`Have ${cfg.name} respond next`}
                >
                  <div className="w-32 h-32 md:w-40 md:h-40">
                    <Char thinking={loading} />
                  </div>
                  <div className={`mt-2 text-[11px] uppercase tracking-[0.3em] ${colors.activeText}`}>
                    {loading ? "Thinking..." : "Click to summon"}
                  </div>
                  <div className="mt-1 text-xl md:text-2xl font-display font-medium text-cosmos-text">
                    {cfg.name}
                  </div>
                  {cfg.role && (
                    <div className="mt-1 text-[11px] text-cosmos-muted/60 max-w-[280px] text-center leading-relaxed">
                      {cfg.role}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* MIDDLE: Panel thread */}
          <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-[11px] text-cosmos-muted/60">
                <div>
                  Panel mode. Click a persona above to make them respond.
                </div>
                <div className={overBudget ? "text-cosmos-conflict" : ""}>
                  {turnsLeft > 0
                    ? `${turnsLeft} of ${TURN_BUDGET} turns left`
                    : `${panelTurnsUsed} turns used (over the soft budget)`}
                </div>
              </div>

              {panelMessages.length === 0 && (
                <div className="text-center py-10 text-cosmos-muted/50 text-sm leading-relaxed">
                  Type or speak a question to start. Then click {pA.name} or {pB.name} above to make
                  them respond.
                </div>
              )}

              {panelMessages.map((m, i) => {
                if (m.role === "user") {
                  return (
                    <div key={i} className="flex justify-center">
                      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-cosmos-surface/80 border border-cosmos-border text-cosmos-text/90 text-center">
                        {m.content}
                      </div>
                    </div>
                  );
                }
                const cfg = m.personaId === pA.id ? pA : pB;
                const colors = m.personaId === pA.id ? colorsA : colorsB;
                const isA = m.personaId === pA.id;
                const isSpeaking = speakingIdx === i && isAnyTalking;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isA ? "justify-start" : "justify-end"} items-end gap-1.5`}
                  >
                    {!isA && supportsActiveMode && (
                      <button
                        onClick={() => speakMessage(i, m.content, cfg.id)}
                        className={`flex-shrink-0 p-1.5 rounded-full transition-all ${
                          isSpeaking
                            ? `${colors.sendBg} ${colors.sendText}`
                            : "text-cosmos-muted/40 hover:text-cosmos-text"
                        }`}
                        title={isSpeaking ? "Stop" : "Listen"}
                      >
                        {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${colors.bubbleBg} border ${colors.bubbleBorder} text-cosmos-text ${
                        isA ? "rounded-tl-sm" : "rounded-tr-sm"
                      }`}
                    >
                      <div className={`text-[10px] uppercase tracking-wider ${colors.surfacedLabel} mb-1`}>
                        {cfg.name}
                      </div>
                      {m.content}
                    </div>
                    {isA && supportsActiveMode && (
                      <button
                        onClick={() => speakMessage(i, m.content, cfg.id)}
                        className={`flex-shrink-0 p-1.5 rounded-full transition-all ${
                          isSpeaking
                            ? `${colors.sendBg} ${colors.sendText}`
                            : "text-cosmos-muted/40 hover:text-cosmos-text"
                        }`}
                        title={isSpeaking ? "Stop" : "Listen"}
                      >
                        {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </motion.div>
                );
              })}

              {panelLoadingPersona && (
                <div className="flex items-center gap-1.5 px-3.5 py-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cosmos-muted/40 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cosmos-muted/40 animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cosmos-muted/40 animate-pulse" style={{ animationDelay: "300ms" }} />
                </div>
              )}

              <div ref={endRef} />
            </div>
          </div>

          {/* BOTTOM: Input */}
          <div className="border-t border-cosmos-border/30 bg-cosmos-surface/40 backdrop-blur-sm">
            <div className="max-w-2xl mx-auto px-6 md:px-10 py-5">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitUserTurn();
                    }
                  }}
                  placeholder="Pose a question to the panel, then click a persona above to respond..."
                  rows={2}
                  autoFocus
                  disabled={!!panelLoadingPersona}
                  className="w-full bg-cosmos-bg/50 border border-cosmos-border/50 rounded-xl px-4 py-3 pr-20 text-sm text-cosmos-text placeholder:text-cosmos-muted/40 focus:outline-none focus:border-cosmos-glow/40 resize-none transition-all disabled:opacity-50"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!!panelLoadingPersona}
                    className={`p-2 rounded-lg transition-colors ${
                      isRecording
                        ? "text-cosmos-conflict bg-cosmos-conflict/15 animate-pulse"
                        : "text-cosmos-muted/50 hover:text-cosmos-text"
                    } disabled:opacity-30`}
                    title={isRecording ? "Stop" : "Talk"}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={submitUserTurn}
                    disabled={!input.trim() || !!panelLoadingPersona}
                    className="p-2 bg-cosmos-glow/15 border border-cosmos-glow/25 rounded-lg text-cosmos-glow hover:bg-cosmos-glow/25 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                    title="Submit your turn"
                  >
                    {panelLoadingPersona ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-cosmos-muted/40">
                <span>
                  {isRecording ? (
                    <span className="text-cosmos-conflict">Listening...</span>
                  ) : (
                    <>Hold <kbd className="px-1 py-0.5 rounded border border-cosmos-border/50 font-mono text-[9px]">Space</kbd> to talk</>
                  )}
                </span>
                <button
                  onClick={onClose}
                  className="text-cosmos-muted/40 hover:text-cosmos-muted transition-colors"
                >
                  Exit panel
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
