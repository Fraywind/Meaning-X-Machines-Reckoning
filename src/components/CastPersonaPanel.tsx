"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Send, Loader2, X, Mic, MicOff, Volume2, VolumeX, Users, Music } from "lucide-react";
import { useStore, BriefMessage, PersonaConcern } from "@/store/useStore";
import { safeFetch } from "@/lib/api";
import { getLanguageConfig } from "@/lib/i18n";
import { getPersonaColors, PersonaColorSet } from "@/lib/personaColors";
import { useTextToSpeech, getVoiceProfile } from "@/lib/useTextToSpeech";
import { useAnimalese, getAnimaleseProfile } from "@/lib/useAnimalese";
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
  onSpeak,
  isSpeaking,
  ttsSupported,
}: {
  message: BriefMessage;
  isLatest: boolean;
  onChipClick: (text: string) => void;
  disabled: boolean;
  colors: PersonaColorSet;
  onSpeak?: () => void;
  isSpeaking?: boolean;
  ttsSupported?: boolean;
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
    // Suggest-responses link only appears after a full minute of inactivity.
    // The default behavior is the user types or talks; chips are a fallback
    // for genuine stuckness, not a quick shortcut.
    const t = setTimeout(() => setOfferHelp(true), 60000);
    return () => clearTimeout(t);
  }, [isLatest, isPersona, message.content]);

  // When a persona's turn surfaces a judgment moment, the bubble renders
  // in the cosmos-judgment palette (yellow) and carries a JUDGMENT label so
  // the user is told plainly: this is the part where YOU need to choose.
  const isJudgment = isPersona && !!message.judgmentMoment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-2"
    >
      <div className={`flex ${isPersona ? "justify-start" : "justify-end"} items-end gap-1.5`}>
        <div
          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isPersona
              ? isJudgment
                ? "bg-cosmos-judgment/12 border-2 border-cosmos-judgment/45 text-cosmos-text rounded-tl-sm shadow-[0_0_18px_rgb(var(--judgment)/0.18)]"
                : `${colors.bubbleBg} border ${colors.bubbleBorder} text-cosmos-text rounded-tl-sm`
              : "bg-cosmos-surface/80 border border-cosmos-border text-cosmos-text/90 rounded-tr-sm"
          }`}
        >
          {isJudgment && (
            <div className="text-[9px] uppercase tracking-[0.18em] font-semibold text-cosmos-judgment mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cosmos-judgment animate-pulse" />
              Judgment moment
            </div>
          )}
          {message.content}
          {isJudgment && message.judgmentMoment && (
            <div className="mt-3 pt-3 border-t border-cosmos-judgment/25 space-y-2">
              {message.judgmentMoment.stakes && (
                <div className="text-[11px] text-cosmos-text/75 leading-relaxed">
                  <span className="text-cosmos-judgment/85 font-medium">What's at stake:</span>{" "}
                  {message.judgmentMoment.stakes}
                </div>
              )}
              {message.judgmentMoment.conflict && (
                <div className="text-[11px] text-cosmos-text/75 leading-relaxed">
                  <span className="text-cosmos-judgment/85 font-medium">The tradeoff:</span>{" "}
                  {message.judgmentMoment.conflict}
                </div>
              )}
              <div className="space-y-1 pt-1">
                {message.judgmentMoment.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className="text-[11px] px-2 py-1.5 rounded-md bg-cosmos-bg/40 border border-cosmos-judgment/20"
                  >
                    <div className="font-medium text-cosmos-text/90">{opt.label}</div>
                    {opt.description && (
                      <div className="text-cosmos-text/65 mt-0.5">{opt.description}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-cosmos-judgment/65 italic pt-1">
                Added to your tree as a judgment node. You choose when ready.
              </div>
            </div>
          )}
        </div>
        {isPersona && ttsSupported && onSpeak && (
          <button
            onClick={onSpeak}
            aria-label={isSpeaking ? "Stop speaking" : "Listen"}
            className={`flex-shrink-0 p-1.5 rounded-full transition-all ${
              isSpeaking
                ? `${colors.sendBg} ${colors.sendText}`
                : `text-cosmos-muted/40 hover:${colors.sendText} hover:${colors.bubbleBg}`
            }`}
            title={isSpeaking ? "Stop" : "Read aloud"}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}
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
    enterPanelMode,
    addNodes,
    setNarrativeOpen,
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

  // Mark visited on mount; auto-fire LLM opening turn if no messages yet.
  // The LLM produces a contextual opener that reflects the persona's dossier
  // AND what Setup just surfaced. While loading, typing dots show. If the
  // LLM returns nothing or errors, we fall back to the templated opener
  // (handled inside sendTurn's reply handling).
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    markCastVisited(persona.id);
    if (messages.length === 0) {
      sendTurn("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  // Capture the user's existing typed input at recording start. We append
  // speech to this fixed prefix rather than to whatever input currently
  // shows, otherwise interim transcripts pile on top of each other and
  // produce stuttering output ("I I think I I think I want...").
  const inputAtStartRef = useRef("");

  const startRecording = useCallback(() => {
    if (isRecording) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    // Aggressively tear down any previous recognition. Safari has been seen
    // to silently fail recognition.start() if a prior instance is still in
    // its shutdown phase.
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

    // Snapshot input at the moment recording begins, used as the prefix.
    inputAtStartRef.current = input;
    let lastSpoken = "";

    // Iterate ALL results from the start (Safari quirk with resultIndex).
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let all = "";
      for (let i = 0; i < event.results.length; i++) {
        all += event.results[i][0].transcript + " ";
      }
      const spoken = all.trim();
      if (!spoken) return; // ignore empty events (Safari fires these on stop)
      lastSpoken = spoken;
      const prefix = inputAtStartRef.current;
      const sep = prefix && spoken ? " " : "";
      setInput(prefix + sep + spoken);
      // Force textarea to resize so new content is visible after voice input.
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
        if (inputRef.current) {
          const el = inputRef.current;
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 180) + "px";
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      // Most common failure: Safari's recognition still cleaning up from
      // the previous session. Brief retry covers it.
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

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // Push-to-talk: hold Space anywhere in the panel to record. Released = stop.
  // Ignored when the user is typing (input/textarea focused) so spacebar still
  // works to insert a space inside text fields.
  const pttActiveRef = useRef(false);
  const startRecRef = useRef(startRecording);
  const stopRecRef = useRef(stopRecording);
  const isRecRef = useRef(isRecording);
  useEffect(() => { startRecRef.current = startRecording; }, [startRecording]);
  useEffect(() => { stopRecRef.current = stopRecording; }, [stopRecording]);
  useEffect(() => { isRecRef.current = isRecording; }, [isRecording]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (t as HTMLElement).isContentEditable) return;
      }
      e.preventDefault();
      if (!isRecRef.current) {
        pttActiveRef.current = true;
        startRecRef.current();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (pttActiveRef.current) {
        pttActiveRef.current = false;
        stopRecRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

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

    // Cap at 2 cross-checks per persona conversation. Loosened from 1 so
    // the user gets a couple of "{Other} is ringing in" moments per turn,
    // matching the medium-high threshold in the prompt.
    const crossCheckUsed =
      crossCheckHistory.filter((entry) => entry.startsWith(`${persona.id}->`)).length >= 2;
    const otherPersonas = recommendedPersonas
      .filter((p) => p.id !== persona.id)
      .map((p) => ({ id: p.id, name: p.name, role: p.role }));
    // Look up dossier for the active persona (only domain experts have one)
    // so the runtime prompt is primed with their expertise/pushFor/vocabulary.
    const selfRec = recommendedPersonas.find((p) => p.id === persona.id);

    // For Anchor, forward summaries of personas that have already reached
    // ready=true so it can synthesize them by name.
    const priorPersonaSummaries =
      persona.archetype === "anchor"
        ? recommendedPersonas
            .filter((p) => p.id !== persona.id && castConversations[p.id]?.ready)
            .map((p) => ({
              name: p.name,
              summary: castConversations[p.id]?.summary || "",
            }))
            .filter((p) => p.summary.trim())
        : [];

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
        priorPersonaSummaries,
      });

      if (data.error) {
        addCastMessage(persona.id, {
          role: "setup",
          content: "Something went wrong. Try again or close this persona to keep going.",
        });
        return;
      }

      // Validate the optional judgmentMoment field. Persona is only allowed
      // to flag this when the turn surfaces a real value-laden fork. If the
      // shape is valid, attach to the message AND immediately add a
      // DecisionNode of type "judgment" to the tree state so the tree builds
      // up live as the conversation progresses (per Brian Cantwell Smith,
      // judgment nodes are the only place the user's choice is required).
      let judgmentForMessage: BriefMessage["judgmentMoment"] | undefined;
      if (
        data.judgmentMoment &&
        typeof data.judgmentMoment.question === "string" &&
        Array.isArray(data.judgmentMoment.options) &&
        data.judgmentMoment.options.length >= 2
      ) {
        const jm = data.judgmentMoment as {
          question: string;
          stakes?: string;
          conflict?: string;
          options: { label?: string; description?: string; tradeoffs?: string[]; consequences?: string[] }[];
        };
        const cleanOptions = jm.options
          .filter((o) => o && typeof o.label === "string" && o.label.trim())
          .slice(0, 4)
          .map((o, idx) => ({
            id: `opt-${idx}`,
            label: o.label!,
            description: typeof o.description === "string" ? o.description : "",
            tradeoffs: Array.isArray(o.tradeoffs) ? o.tradeoffs.filter((t) => typeof t === "string") : [],
            consequences: Array.isArray(o.consequences)
              ? o.consequences.filter((c) => typeof c === "string")
              : [],
          }));
        if (cleanOptions.length >= 2) {
          const nodeId = `j-${persona.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          judgmentForMessage = {
            nodeId,
            question: jm.question,
            stakes: typeof jm.stakes === "string" ? jm.stakes : "",
            conflict: typeof jm.conflict === "string" ? jm.conflict : "",
            options: cleanOptions,
          };
          // Add to the tree state. Live, incremental tree-building.
          addNodes([
            {
              id: nodeId,
              type: "judgment",
              label: jm.question,
              description: typeof jm.conflict === "string" ? jm.conflict : "",
              parentId: null,
              children: [],
              options: cleanOptions,
              conflict: typeof jm.conflict === "string" ? jm.conflict : "",
              stakes: typeof jm.stakes === "string" ? jm.stakes : "",
              status: "pending",
            },
          ]);
        }
      }

      if (data.reply) {
        addCastMessage(persona.id, {
          role: "setup",
          content: data.reply,
          options: Array.isArray(data.options) ? data.options : [],
          judgmentMoment: judgmentForMessage,
        });
      } else if (isOpening) {
        // LLM didn't produce an opening reply. Fall back to the templated
        // opener so the right side is never left blank.
        addCastMessage(persona.id, {
          role: "setup",
          content: persona.openingMessage,
          options: persona.openingOptions || [],
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

  // Voice playback. Two engines:
  //   - tts: real human voices (browser SpeechSynthesis), default.
  //   - animalese: Animal Crossing-style synthesized warble, opt-in.
  // The user toggles voiceMode in the header. Per-message volume buttons
  // and the auto-play toggle both use whichever engine is active.
  const tts = useTextToSpeech();
  const animalese = useAnimalese();
  const voiceProfile = getVoiceProfile(persona.archetype);
  const animaleseProfile = getAnimaleseProfile(persona.archetype);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [voiceMode, setVoiceMode] = useState<"tts" | "animalese">("animalese");
  const lastAutoPlayedIdxRef = useRef<number>(-1);

  const isAnyTalking = voiceMode === "tts" ? tts.speaking : animalese.speaking;
  const supportsActiveMode = voiceMode === "tts" ? tts.supported : animalese.supported;

  const speakMessage = (idx: number, text: string) => {
    if (!supportsActiveMode || !text) return;
    if (speakingIdx === idx && isAnyTalking) {
      // Stop whichever engine is running.
      tts.stop();
      animalese.stop();
      setSpeakingIdx(null);
      return;
    }
    // Stop any other engine before starting the active one.
    tts.stop();
    animalese.stop();
    setSpeakingIdx(idx);
    if (voiceMode === "animalese") {
      animalese.speak(text, persona.id, animaleseProfile);
    } else {
      tts.speak(text, persona.id, voiceProfile);
    }
  };

  // Auto-play the latest persona message when autoPlay is on. Tracks the
  // index we last fired so toggling autoPlay mid-conversation doesn't
  // re-speak old messages on render.
  useEffect(() => {
    if (!autoPlay || !supportsActiveMode || isAnyTalking) return;
    let latest = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "setup") {
        latest = i;
        break;
      }
    }
    if (latest > lastAutoPlayedIdxRef.current && messages[latest]?.content) {
      lastAutoPlayedIdxRef.current = latest;
      speakMessage(latest, messages[latest].content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, autoPlay, voiceMode, supportsActiveMode]);

  // Clear speakingIdx when speech ends naturally (whichever engine).
  useEffect(() => {
    if (!isAnyTalking && speakingIdx !== null) {
      const t = setTimeout(() => setSpeakingIdx(null), 50);
      return () => clearTimeout(t);
    }
  }, [isAnyTalking, speakingIdx]);

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
        <div className="absolute top-4 right-4 z-50 flex items-center gap-1">
          {gateOpen && (
            <button
              onClick={() => {
                // Pick the first two ready cast personas, putting the active
                // persona first if they're ready, otherwise default to the
                // first two ready conversations in recommended order.
                const readyIds = recommendedPersonas
                  .filter((p) => castConversations[p.id]?.ready)
                  .map((p) => p.id);
                if (readyIds.length < 2) return;
                const a = readyIds.includes(persona.id) ? persona.id : readyIds[0];
                const b = readyIds.find((id) => id !== a) || readyIds[1];
                enterPanelMode([a, b]);
              }}
              className={`p-2 rounded-lg transition-colors text-cosmos-muted/50 hover:text-cosmos-text hover:${colors.bubbleBg}`}
              title="Open Panel mode (two personas, you moderate)"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
          {/* Voice-mode toggle: cycles TTS -> Animalese. Click switches mode. */}
          <button
            onClick={() => setVoiceMode((m) => (m === "tts" ? "animalese" : "tts"))}
            className={`p-2 rounded-lg transition-colors ${
              voiceMode === "animalese"
                ? `${colors.sendBg} ${colors.sendText}`
                : "text-cosmos-muted/50 hover:text-cosmos-text"
            }`}
            title={
              voiceMode === "animalese"
                ? "Animal Crossing-style synthesized voice. Click for natural TTS."
                : "Natural TTS voice. Click for Animal Crossing-style synth."
            }
          >
            <Music className="w-4 h-4" />
          </button>
          {supportsActiveMode && (
            <button
              onClick={() => setAutoPlay((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${
                autoPlay
                  ? `${colors.sendBg} ${colors.sendText}`
                  : "text-cosmos-muted/50 hover:text-cosmos-text"
              }`}
              title={autoPlay ? "Voice auto-play on. Click to disable." : "Auto-play voices off. Click to enable."}
            >
              {autoPlay ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-cosmos-muted/50 hover:text-cosmos-text transition-colors rounded-lg"
            title={`Close ${persona.name}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <PersonaStrip activeId={persona.id} />

        <div className="flex flex-col md:flex-row h-full">
          {/* LEFT: persona character (during conversation) or next-suggestions
              picker (once this persona is ready). The picker shows up to 3 big
              avatars; clicking one switches the panel to that persona. */}
          <div className={`md:w-1/2 h-1/3 md:h-full relative bg-gradient-to-br ${colors.characterGradientFrom} via-cosmos-surface/30 ${colors.characterGradientTo}`}>
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
                      ttsSupported={tts.supported}
                      isSpeaking={speakingIdx === i && tts.speaking}
                      onSpeak={() => speakMessage(i, m.content)}
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
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => onComplete(summary || "")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-cosmos-resolved/15 border border-cosmos-resolved/40 rounded-lg text-cosmos-resolved text-sm font-medium hover:bg-cosmos-resolved/25 transition-all"
                              >
                                Open the tree
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setNarrativeOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-cosmos-glow/10 border border-cosmos-glow/30 rounded-lg text-cosmos-glow text-sm font-medium hover:bg-cosmos-glow/20 transition-all"
                                title="Read a second-person story of what happened in your session"
                              >
                                Tell me the story
                              </button>
                            </div>
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
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-cosmos-muted/40">
                    {isRecording ? (
                      <span className={colors.sendText}>Listening...</span>
                    ) : (
                      <>Hold <kbd className="px-1 py-0.5 rounded border border-cosmos-border/50 text-cosmos-muted/55 font-mono text-[9px]">Space</kbd> to talk</>
                    )}
                  </span>
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
