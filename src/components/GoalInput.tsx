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
} from "lucide-react";
import { useStore, SavedSession } from "@/store/useStore";
import { safeFetch } from "@/lib/api";
import Starfield from "./Starfield";
import ThemeSwitcher from "./ThemeSwitcher";

export default function GoalInput() {
  const [text, setText] = useState("");
  const [showAbout, setShowAbout] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; content: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    savedSessions, loadSessionsFromStorage, loadSession,
  } = useStore();

  useEffect(() => {
    loadSessionsFromStorage();
  }, [loadSessionsFromStorage]);

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

    // Build the full goal with attachments context
    let fullGoal = text;
    if (attachments.length > 0) {
      fullGoal +=
        "\n\n--- Attached reference materials ---\n" +
        attachments.map((a) => `[${a.name}]:\n${a.content}`).join("\n\n");
    }

    setGoalText(text);
    setHasStarted(true);
    setIsDecomposing(true);

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
    } catch (err) {
      console.error("Failed to decompose:", err);
      alert("Connection error. Please check your internet and try again.");
      setHasStarted(false);
    } finally {
      setIsDecomposing(false);
    }
  }, [text, attachments, setGoalText, setHasStarted, setIsDecomposing, addNodes, addValues, setCritique]);

  const examples = [
    { text: "Build and launch an educational product for kids", icon: Gamepad2 },
    { text: "How should a public university restructure its tuition model?", icon: GraduationCap },
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
                  {/* Top node */}
                  <circle cx="12" cy="4" r="2.5" />
                  {/* Lines branching down */}
                  <line x1="10.5" y1="6" x2="6" y2="10" />
                  <line x1="13.5" y1="6" x2="18" y2="10" />
                  {/* Mid-left node */}
                  <circle cx="6" cy="12" r="2.5" />
                  {/* Mid-right node */}
                  <circle cx="18" cy="12" r="2.5" />
                  {/* Lines cascading further */}
                  <line x1="6" y1="14.5" x2="9" y2="18" />
                  <line x1="18" y1="14.5" x2="15" y2="18" />
                  {/* Bottom node (convergence) */}
                  <circle cx="12" cy="20" r="2.5" />
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
                        tradeoffs and preferences &mdash; choices that have a cascading effect on everything
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
                        <li>The AI expands it into a decision tree &mdash; you&apos;ll see nodes branch out</li>
                        <li><span className="text-cosmos-judgment">Yellow nodes</span> are judgment points &mdash; click <span className="text-cosmos-text/80">&ldquo;Decide now&rdquo;</span> to weigh in</li>
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
                        in AI as currently conceived comes close to what genuine judgment requires.
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

          {/* Previous sessions */}
          {savedSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="mt-8"
            >
              <div className="text-[10px] uppercase tracking-wider text-cosmos-muted/40 text-center mb-3">
                Resume a previous deliberation
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {savedSessions.slice(0, 3).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadSession(session.id)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-cosmos-muted border border-cosmos-border/40 rounded-xl hover:border-cosmos-glow/30 hover:text-cosmos-glow hover:bg-cosmos-glow/5 transition-all max-w-[280px]"
                  >
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="truncate">{session.goalText}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

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
