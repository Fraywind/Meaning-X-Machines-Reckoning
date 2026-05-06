"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { useStore } from "@/store/useStore";
import { safeFetch } from "@/lib/api";
import { useTextToSpeech, getVoiceProfile } from "@/lib/useTextToSpeech";

interface Props {
  onClose: () => void;
}

/**
 * Narrative summary of the deliberation session. A second-person story
 * the user reads after the experience to map the territory of their own
 * thinking. Generated on-demand from briefMessages, castConversations,
 * recommendedPersonas, and tree nodes.
 */
export default function NarrativeView({ onClose }: Props) {
  const { briefExtracted, briefMessages, castConversations, recommendedPersonas, nodes, language } =
    useStore();
  const [narrative, setNarrative] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tts = useTextToSpeech();
  const [speaking, setSpeaking] = useState(false);

  const fetchNarrative = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await safeFetch("/api/narrative", {
        goal: briefExtracted.goal || "",
        briefMessages,
        castConversations,
        recommendedPersonas,
        nodes,
      });
      if (data.error) {
        setError(data.error);
      } else if (typeof data.narrative === "string") {
        setNarrative(data.narrative);
      } else {
        setError("No narrative came back. Try regenerating.");
      }
    } catch (err) {
      console.error("Narrative fetch failed:", err);
      setError("Could not generate the story. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNarrative();
    return () => {
      try { window.speechSynthesis?.cancel(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tts.speaking && speaking) {
      const t = setTimeout(() => setSpeaking(false), 50);
      return () => clearTimeout(t);
    }
  }, [tts.speaking, speaking]);

  const toggleSpeak = () => {
    if (!tts.supported || !narrative) return;
    if (speaking) {
      tts.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      // Use the Setup voice profile for narration. It's the warm guide.
      tts.speak(narrative, "narrative", getVoiceProfile("setup"));
    }
  };

  // Split the narrative into paragraphs for readable rendering.
  const paragraphs = narrative
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div
        key="narrative-room"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[70] bg-cosmos-bg/95 backdrop-blur-md overflow-y-auto"
      >
        <div className="absolute top-4 right-4 z-50 flex items-center gap-1">
          {tts.supported && narrative && !loading && (
            <button
              onClick={toggleSpeak}
              className={`p-2 rounded-lg transition-colors ${
                speaking
                  ? "bg-cosmos-glow/15 text-cosmos-glow"
                  : "text-cosmos-muted/50 hover:text-cosmos-text"
              }`}
              title={speaking ? "Stop reading" : "Read the story aloud"}
            >
              {speaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}
          {!loading && narrative && (
            <button
              onClick={fetchNarrative}
              className="p-2 rounded-lg text-cosmos-muted/50 hover:text-cosmos-text transition-colors"
              title="Regenerate the story"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-cosmos-muted/50 hover:text-cosmos-text transition-colors rounded-lg"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-6 md:px-10 py-16">
          <div className="text-[10px] text-cosmos-muted/55 uppercase tracking-[0.3em] mb-2">
            Mapping this territory
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-cosmos-text font-medium leading-tight mb-1">
            The story of what happened
          </h1>
          <p className="text-cosmos-muted/65 text-sm leading-relaxed mb-10">
            A second-person reconstruction of your deliberation, drawn from the actual conversations
            and choices you made. Read it back, and see the shape of your own thinking.
          </p>

          {loading && (
            <div className="flex items-center gap-2 text-cosmos-muted/60 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading back through your session...
            </div>
          )}

          {error && (
            <div className="p-4 bg-cosmos-conflict/8 border border-cosmos-conflict/30 rounded-lg text-cosmos-text/80 text-sm">
              {error}
              <button
                onClick={fetchNarrative}
                className="ml-3 underline underline-offset-2 text-cosmos-conflict/85 hover:text-cosmos-conflict"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && paragraphs.length > 0 && (
            <article className="space-y-5">
              {paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="font-serif text-[17px] md:text-[18px] text-cosmos-text/90 leading-relaxed"
                  style={{ textWrap: "pretty" } as React.CSSProperties}
                >
                  {p}
                </motion.p>
              ))}
            </article>
          )}

          {!loading && !error && narrative && (
            <div className="mt-12 pt-6 border-t border-cosmos-border/30 text-center">
              <button
                onClick={onClose}
                className="text-[12px] text-cosmos-muted/55 hover:text-cosmos-muted transition-colors"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
