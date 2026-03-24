"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Gamepad2,
  GraduationCap,
  Home,
  Paperclip,
  Mic,
  MicOff,
  ShieldAlert,
  X,
  Clock,
  ChevronDown,
  BookOpen,
  Download,
  Upload,
} from "lucide-react";
import { useStore, SavedSession } from "@/store/useStore";
import { safeFetch } from "@/lib/api";
import Starfield from "./Starfield";
import ThemeSwitcher from "./ThemeSwitcher";
import ModePicker from "./ModePicker";

export default function GoalInput() {
  const [text, setText] = useState("");
  const [showAbout, setShowAbout] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; content: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showValues, setShowValues] = useState(false);
  const [statedValues, setStatedValues] = useState<string[]>([]);
  const [customValue, setCustomValue] = useState("");

  const suggestedValues = [
    "Fairness", "Sustainability", "Cost efficiency", "Speed to market",
    "User safety", "Inclusivity", "Privacy", "Innovation",
    "Long-term viability", "Transparency", "Community impact", "Quality",
  ];

  const toggleValue = (v: string) => {
    setStatedValues((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : prev.length < 5 ? [...prev, v] : prev
    );
  };

  const addCustomValue = () => {
    const trimmed = customValue.trim();
    if (trimmed && !statedValues.includes(trimmed) && statedValues.length < 5) {
      setStatedValues((prev) => [...prev, trimmed]);
      setCustomValue("");
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionFileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim = transcript;
        }
      }
      setText((prev) => {
        const base = prev.replace(/\u200B.*$/, "").trimEnd();
        const spoken = (finalTranscript + interim).trim();
        if (!spoken) return base;
        return base ? `${base} ${spoken}` : spoken;
      });
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Clean up any interim marker
      setText((prev) => prev.replace(/\u200B.*$/, "").trimEnd());
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);
  const {
    setGoalText, setHasStarted, setIsDecomposing, addNodes, addValues, setCritique,
    savedSessions, loadSessionsFromStorage, loadSession, viewMode, addChatMessage,
  } = useStore();

  useEffect(() => {
    loadSessionsFromStorage();
  }, [loadSessionsFromStorage]);

  const handleExportSessions = () => {
    const sessions = savedSessions;
    if (sessions.length === 0) return;
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cascade-sessions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSession = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const sessions: SavedSession[] = Array.isArray(data) ? data : [data];
        // Merge into localStorage
        const existing = savedSessions;
        const merged = [...sessions.filter((s) => !existing.find((e) => e.id === s.id)), ...existing].slice(0, 10);
        try {
          localStorage.setItem("reckoning-sessions", JSON.stringify(merged));
        } catch {}
        loadSessionsFromStorage();
        // If single session, load it directly
        if (sessions.length === 1) {
          loadSession(sessions[0].id);
        }
      } catch {
        alert("Could not read this file. Make sure it is a Cascade session file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setAttachments((prev) => [...prev, { name: file.name, content }]);
      };
      reader.readAsText(file);
    });

    // Reset so the same file can be re-uploaded
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;

    // Build the full goal with values and attachments context
    let fullGoal = text;
    if (statedValues.length > 0) {
      fullGoal += `\n\n--- Values and priorities the user explicitly stated matter to them ---\n${statedValues.join(", ")}\nWhen critiquing decisions, reference these stated values. Distinguish between values the user stated upfront vs. values you infer from their choices.`;
    }
    if (attachments.length > 0) {
      fullGoal +=
        "\n\n--- Attached reference materials ---\n" +
        attachments.map((a) => `[${a.name}]:\n${a.content}`).join("\n\n");
    }

    setGoalText(text);
    setHasStarted(true);
    setIsDecomposing(true);

    // Seed chat messages if in chat mode
    if (viewMode === "chat") {
      addChatMessage({
        id: `user-goal-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      });
      addChatMessage({
        id: `sys-start-${Date.now()}`,
        role: "system",
        content: "Breaking down your goal into a decision tree. I'll surface any points that need your judgment...",
        timestamp: Date.now(),
      });
    }

    addNodes([
      {
        id: "goal-root",
        type: "goal",
        label: text.length > 60 ? text.slice(0, 57) + "..." : text,
        description: text,
        parentId: null,
        children: [],
        status: "active",
      },
    ]);

    try {
      const data = await safeFetch("/api/decompose", { goal: fullGoal });

      if (data.error) {
        console.error("API error:", data.error);
        alert("Something went wrong connecting to the AI. Please try again.\n\n" + data.error);
        setIsDecomposing(false);
        setHasStarted(false);
        return;
      }

      const nodes = (data.nodes || []).map(
        (n: { parentId: string | null; [key: string]: unknown }) => ({
          ...n,
          parentId: n.parentId || "goal-root",
        })
      );

      addNodes(nodes);
      if (data.values) addValues(data.values);
      if (data.critique) setCritique(data.critique);

      // Add summary chat message in chat mode
      if (viewMode === "chat" && nodes.length > 0) {
        const judgmentCount = nodes.filter((n: { type: string }) => n.type === "judgment").length;
        addChatMessage({
          id: `sys-decomposed-${Date.now()}`,
          role: "system",
          content: `I've mapped out ${nodes.length} considerations. ${judgmentCount > 0 ? `${judgmentCount} need your judgment — scroll down to decide.` : "Take a look at the tree."}`,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error("Failed to decompose:", err);
      alert("Connection error. Please check your internet and try again.");
      setHasStarted(false);
    } finally {
      setIsDecomposing(false);
    }
  }, [text, attachments, statedValues, setGoalText, setHasStarted, setIsDecomposing, addNodes, addValues, setCritique, viewMode, addChatMessage]);

  const examples = [
    { text: "Build and launch an educational product for kids", icon: Gamepad2 },
    { text: "How should a public university restructure its tuition model to make it affordable?", icon: GraduationCap },
    { text: "Should I sell my house and relocate?", icon: Home },
  ];

  return (
    <div className="relative h-screen overflow-y-auto">
      <Starfield />

      {/* Theme switcher — top right */}
      <div className="fixed top-4 right-4 z-30">
        <ThemeSwitcher />
      </div>

      {/* T561 label — left side */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-20"
      >
        <div className="text-xs tracking-[0.3em] text-cosmos-text font-display uppercase select-none"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          A Meaning &times; Machines Project
        </div>
      </motion.div>

      <motion.div
        className="relative z-10 flex items-center justify-center min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="w-full max-w-2xl px-6">
          {/* Logo & tagline */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cosmos-glow/10 border border-cosmos-glow/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-cosmos-glow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <style>{`
                    @keyframes cascadeNode1 { 0%, 100% { opacity: 0.4; } 20%, 40% { opacity: 1; } }
                    @keyframes cascadeNode2 { 0%, 20%, 100% { opacity: 0.3; } 40%, 60% { opacity: 1; } }
                    @keyframes cascadeNode3 { 0%, 40%, 100% { opacity: 0.3; } 60%, 80% { opacity: 1; } }
                    @keyframes cascadeLine { 0%, 100% { opacity: 0.2; } 30%, 50% { opacity: 0.7; } }
                    .cn1 { animation: cascadeNode1 3s ease-in-out infinite; }
                    .cn2 { animation: cascadeNode2 3s ease-in-out infinite; }
                    .cn3 { animation: cascadeNode3 3s ease-in-out infinite; }
                    .cl1 { animation: cascadeLine 3s ease-in-out infinite; animation-delay: 0.3s; }
                    .cl2 { animation: cascadeLine 3s ease-in-out infinite; animation-delay: 0.9s; }
                  `}</style>
                  <circle cx="12" cy="4" r="2.5" className="cn1" />
                  <line x1="10.5" y1="6" x2="6" y2="10" className="cl1" />
                  <line x1="13.5" y1="6" x2="18" y2="10" className="cl1" />
                  <circle cx="6" cy="12" r="2.5" className="cn2" />
                  <circle cx="18" cy="12" r="2.5" className="cn2" />
                  <line x1="6" y1="14.5" x2="9" y2="18" className="cl2" />
                  <line x1="18" y1="14.5" x2="15" y2="18" className="cl2" />
                  <circle cx="12" cy="20" r="2.5" className="cn3" />
                </svg>
              </div>
              <h1 className="text-4xl font-display font-bold tracking-tight text-cosmos-text">
                Cascade
              </h1>
            </div>
            <p className="text-cosmos-muted text-sm max-w-md mx-auto leading-relaxed">
              AI maps the terrain. You choose the path.
            </p>
            <div className="mt-3 flex items-center justify-center gap-6 text-xs text-cosmos-muted/50">
              <span>Describe</span>
              <span className="w-1 h-1 rounded-full bg-cosmos-glow/30" />
              <span>Deliberate</span>
              <span className="w-1 h-1 rounded-full bg-cosmos-glow/30" />
              <span>Decide</span>
            </div>
          </motion.div>

          {/* About / How it works tab */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-6"
          >
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="mx-auto flex items-center gap-2 px-4 py-2 text-xs text-cosmos-muted hover:text-cosmos-glow border border-cosmos-border/50 hover:border-cosmos-glow/20 rounded-xl transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              What is this &amp; how does it work?
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showAbout ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showAbout && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-5 bg-cosmos-surface/60 backdrop-blur-sm border border-cosmos-border/40 rounded-2xl text-sm text-cosmos-muted leading-relaxed space-y-4 max-w-xl mx-auto">
                    {/* What it is */}
                    <div>
                      <h3 className="text-cosmos-text font-medium text-xs uppercase tracking-wider mb-1.5">
                        What is Cascade?
                      </h3>
                      <p>
                        Cascade is a thinking tool. You describe a complex goal, and the AI breaks it down
                        into a map of sub-decisions, consequences, and paths you might not have seen coming.
                        In any complex goal, there will inevitably be moments where a decision comes down to
                        tradeoffs and preferences, choices that have a cascading effect on everything
                        downstream. When the AI reaches one of those moments, <span className="text-cosmos-text">it
                        detects it, surfaces the conflict and tradeoffs, and brings it to you.</span> You
                        make the judgment call as the human. Your intent drives what happens next.
                      </p>
                    </div>

                    {/* How to use */}
                    <div>
                      <h3 className="text-cosmos-text font-medium text-xs uppercase tracking-wider mb-1.5">
                        How to use it
                      </h3>
                      <ol className="space-y-1.5 text-cosmos-muted list-decimal list-inside">
                        <li><span className="text-cosmos-text/80">Describe your goal</span> and a bit about who you are</li>
                        <li>The AI expands it into a decision tree, and you&apos;ll see nodes branch out</li>
                        <li><span className="text-cosmos-judgment">Yellow nodes</span> are judgment points, click <span className="text-cosmos-text/80">&ldquo;Decide now&rdquo;</span> to weigh in</li>
                        <li>Choose an option, or clarify if none fit your situation</li>
                        <li>Your choices ripple forward, revealing new branches and sometimes new conflicts</li>
                        <li>Open the <span className="text-cosmos-text/80">Values Mirror</span> to see what your decisions reveal about what matters to you</li>
                      </ol>
                    </div>

                    {/* Why judgment matters */}
                    <div className="pt-2 border-t border-cosmos-border/30">
                      <h3 className="text-cosmos-text font-medium text-xs uppercase tracking-wider mb-1.5">
                        Reckoning vs. Judgment
                      </h3>
                      <p>
                        The late Professor <a href="https://ischool.utoronto.ca/news/obituary-brian-cantwell-smith-1950-to-2025/" target="_blank" rel="noopener noreferrer" className="text-cosmos-text underline underline-offset-2 hover:text-cosmos-glow transition-colors">Brian Cantwell Smith</a> identified
                        two distinct kinds of intelligence. The first is <em>reckoning</em>: calculative rationality,
                        pattern recognition, decomposition, logical inference. This is what AI does well, and it
                        keeps getting better at it. The second is <em>judgment</em>: deliberative thought that is
                        grounded in ethical commitment, moral weight, and a sense of responsibility to the situation
                        you&apos;re actually in. Judgment isn&apos;t about what <em>can</em> be done. It&apos;s about
                        what <em>should</em> be done, and being willing to stand behind that call.
                      </p>
                      <p className="mt-2">
                        Smith&apos;s argument was that AI will produce world-changing reckoning systems, but nothing
                        in AI as currently conceived comes close to what genuine judgment requires. AI doesn&apos;t have
                        skin in the game. It has no stake in the outcome, no responsibility to the people affected,
                        no consequences to live with. That&apos;s exactly why it can&apos;t replace human judgment.
                        <span className="text-cosmos-text"> Joseph Weizenbaum</span> arrived at a similar conclusion
                        in the 1970s: the moral dimension of a decision is not something you can hand off to a machine.
                        Cascade is built on that distinction. The AI does the reckoning. The judgment, with all its
                        moral weight, stays with you.
                      </p>
                    </div>

                    <div className="text-[11px] text-cosmos-muted/40 pt-3 border-t border-cosmos-border/20 space-y-1.5">
                      <p className="text-cosmos-muted/50 text-[10px] uppercase tracking-wider">Inspired by</p>
                      <p>
                        <a href="https://www.youtube.com/watch?v=8t5Jg7PthFI" target="_blank" rel="noopener noreferrer" className="text-cosmos-glow/60 hover:text-cosmos-glow underline underline-offset-2 transition-colors">Smith, B. C. (2020). <em>Reckoning and Judgement: The Promise of AI.</em></a>
                      </p>
                      <p>
                        Weizenbaum, J. (1976). <em>Computer Power and Human Reason.</em>
                      </p>
                      <p className="text-cosmos-muted/50 text-[10px] uppercase tracking-wider pt-2">Recommended read</p>
                      <p>
                        <a href="https://www.theatlantic.com/technology/2026/02/words-without-consequence/685974/" target="_blank" rel="noopener noreferrer" className="text-cosmos-glow/60 hover:text-cosmos-glow underline underline-offset-2 transition-colors">Roy, D. (2026). &ldquo;Words Without Consequence.&rdquo; <em>The Atlantic.</em></a>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Mode picker */}
          <ModePicker />

          {/* Input */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="relative glow-input rounded-2xl">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Briefly describe what you want to accomplish and who you are. What's your role, your context, and your goal?"
                className="w-full bg-cosmos-surface/80 backdrop-blur-sm border border-cosmos-border rounded-2xl px-6 py-5 pr-14 text-base text-cosmos-text placeholder:text-cosmos-muted/40 focus:outline-none focus:border-cosmos-glow/50 resize-none transition-all duration-300 font-sans"
                rows={4}
                autoFocus
              />

              {/* Attach & Mic buttons */}
              <div className="absolute top-4 right-4 flex flex-col items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-cosmos-muted/40 hover:text-cosmos-glow transition-colors rounded-lg hover:bg-cosmos-glow/10"
                  title="Add any attachments for context"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleRecording}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording
                      ? "text-cosmos-conflict bg-cosmos-conflict/15 animate-pulse"
                      : "text-cosmos-muted/40 hover:text-cosmos-glow hover:bg-cosmos-glow/10"
                  }`}
                  title={isRecording ? "Stop recording" : "Speak your idea"}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.csv,.json,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="absolute bottom-4 right-4 px-5 py-2.5 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-xl text-cosmos-glow text-sm font-medium hover:bg-cosmos-glow/30 hover:border-cosmos-glow/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2 group"
              >
                Begin
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Attachments list */}
            {attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cosmos-glow/10 border border-cosmos-glow/20 rounded-lg text-xs text-cosmos-glow"
                  >
                    <Paperclip className="w-3 h-3" />
                    {a.name}
                    <button
                      onClick={() => removeAttachment(i)}
                      className="ml-1 hover:text-cosmos-conflict transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Values section */}
            <div className="mt-4">
              <button
                onClick={() => setShowValues(!showValues)}
                className="flex items-center gap-2 text-xs text-cosmos-muted/60 hover:text-cosmos-glow transition-colors"
              >
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showValues ? "rotate-180" : ""}`} />
                <span>What matters to you?</span>
                {statedValues.length > 0 && (
                  <span className="text-cosmos-glow/60">({statedValues.length}/5)</span>
                )}
              </button>

              <AnimatePresence>
                {showValues && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-4 bg-cosmos-surface/50 border border-cosmos-border/30 rounded-xl">
                      <p className="text-[11px] text-cosmos-muted/60 mb-3">
                        Optional: pick up to 5 values that matter most to you. The AI will reference these when surfacing tradeoffs and giving feedback.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {suggestedValues.map((v) => (
                          <button
                            key={v}
                            onClick={() => toggleValue(v)}
                            className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all ${
                              statedValues.includes(v)
                                ? "bg-cosmos-glow/15 border-cosmos-glow/40 text-cosmos-glow"
                                : "border-cosmos-border/40 text-cosmos-muted/50 hover:border-cosmos-glow/20 hover:text-cosmos-muted"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={customValue}
                          onChange={(e) => setCustomValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomValue(); } }}
                          placeholder="Add your own..."
                          className="flex-1 bg-cosmos-bg/50 border border-cosmos-border/30 rounded-lg px-3 py-1.5 text-xs text-cosmos-text placeholder:text-cosmos-muted/30 focus:outline-none focus:border-cosmos-glow/30"
                        />
                        <button
                          onClick={addCustomValue}
                          disabled={!customValue.trim() || statedValues.length >= 5}
                          className="px-3 py-1.5 text-xs text-cosmos-glow/60 border border-cosmos-border/30 rounded-lg hover:bg-cosmos-glow/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          Add
                        </button>
                      </div>
                      {statedValues.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {statedValues.map((v) => (
                            <span
                              key={v}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-cosmos-glow/10 border border-cosmos-glow/25 rounded-full text-cosmos-glow"
                            >
                              {v}
                              <button onClick={() => toggleValue(v)} className="hover:text-cosmos-conflict transition-colors">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Example prompts */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              {examples.map(({ text: ex, icon: Icon }) => (
                <button
                  key={ex}
                  onClick={() => setText(ex)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-cosmos-muted border border-cosmos-border/60 rounded-xl hover:border-cosmos-glow/30 hover:text-cosmos-glow hover:bg-cosmos-glow/5 transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {ex}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Previous sessions + save/load */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-6 flex flex-wrap gap-1.5 justify-center items-center"
          >
            {savedSessions.slice(0, 3).map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-cosmos-muted/50 border border-cosmos-border/30 rounded-lg hover:border-cosmos-glow/20 hover:text-cosmos-glow transition-all max-w-[220px]"
              >
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{session.goalText}</span>
              </button>
            ))}
            {savedSessions.length > 0 && (
              <button
                onClick={handleExportSessions}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-cosmos-muted/35 border border-cosmos-border/20 rounded-lg hover:border-cosmos-glow/20 hover:text-cosmos-glow transition-all"
                title="Download your sessions as a file"
              >
                <Download className="w-2.5 h-2.5" />
                Save
              </button>
            )}
            <button
              onClick={() => sessionFileRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-cosmos-muted/35 border border-cosmos-border/20 rounded-lg hover:border-cosmos-glow/20 hover:text-cosmos-glow transition-all"
              title="Load a session file"
            >
              <Upload className="w-2.5 h-2.5" />
              Load
            </button>
            <input
              ref={sessionFileRef}
              type="file"
              accept=".json"
              onChange={handleImportSession}
              className="hidden"
            />
          </motion.div>

          {/* Footer disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-14 pb-10 text-center"
          >
            <div className="inline-flex items-start gap-2 px-4 py-2.5 rounded-lg bg-cosmos-surface/40 border border-cosmos-border/40">
              <ShieldAlert className="w-3.5 h-3.5 text-cosmos-muted/70 mt-0.5 shrink-0" />
              <p className="text-xs text-cosmos-muted/70 leading-relaxed text-left">
                Your input is processed by AI. Avoid sharing sensitive personal information,
                passwords, or confidential data. Responses are generated and may not always be accurate.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
