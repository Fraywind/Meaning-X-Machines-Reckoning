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
import ModePicker from "./ModePicker";
import { safeFetch } from "@/lib/api";
import Starfield from "./Starfield";
import ThemeSwitcher from "./ThemeSwitcher";

export default function GoalInput() {
  const [text, setText] = useState("");
  const [showWhat, setShowWhat] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
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
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const addCustomValue = () => {
    const trimmed = customValue.trim();
    if (trimmed && !statedValues.includes(trimmed)) {
      setStatedValues((prev) => [...prev, trimmed]);
      setCustomValue("");
    }
  };
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
    { text: "Build and launch an educational product for 3-5 year olds to help learn ABCs", icon: Gamepad2 },
    { text: "How should a public university restructure its tuition model to make it affordable?", icon: GraduationCap },
    { text: "Should I sell my $1.2M house in Hollywood and relocate to New York City?", icon: Home },
  ];

  return (
    <div className="relative h-screen overflow-y-auto">
      <Starfield />

      {/* Theme switcher — top right, highlighted on home */}
      <div className="fixed top-4 right-4 z-30 [&_button]:border-cosmos-glow/30 [&_button]:text-cosmos-text/70">
        <ThemeSwitcher />
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="flex items-center justify-end gap-1 mt-1.5 pr-1 pointer-events-none"
        >
          <span className="text-[10px] text-cosmos-muted/50">try the Nature theme! &#8593;</span>
        </motion.div>
      </div>

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
                  <circle cx="12" cy="3" r="2" className="cn1" />
                  <line x1="10" y1="5" x2="4" y2="10" className="cl1" />
                  <line x1="12" y1="5" x2="12" y2="10" className="cl1" />
                  <line x1="14" y1="5" x2="20" y2="10" className="cl1" />
                  <circle cx="4" cy="12" r="2" className="cn2" />
                  <circle cx="12" cy="12" r="2" className="cn2" />
                  <circle cx="20" cy="12" r="2" className="cn2" />
                  <line x1="4" y1="14" x2="8" y2="19" className="cl2" />
                  <line x1="12" y1="14" x2="12" y2="19" className="cl2" />
                  <line x1="20" y1="14" x2="16" y2="19" className="cl2" />
                  <circle cx="12" cy="21" r="2" className="cn3" />
                </svg>
              </div>
              <h1 className="text-4xl font-display font-bold tracking-tight text-cosmos-text">
                Cascade
              </h1>
            </div>
            <p className="text-cosmos-muted text-sm max-w-md mx-auto leading-relaxed">
              AI breaks it down. You judge and choose.
            </p>
            <div className="mt-3 flex items-center justify-center gap-6 text-xs text-cosmos-muted/50">
              <span>Describe</span>
              <span className="w-1 h-1 rounded-full bg-cosmos-glow/30" />
              <span>Deliberate</span>
              <span className="w-1 h-1 rounded-full bg-cosmos-glow/30" />
              <span>Decide</span>
            </div>
          </motion.div>

          {/* About dropdowns — two tabs side by side */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => { setShowWhat(!showWhat); setShowWhy(false); }}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl border transition-all ${
                  showWhat
                    ? "text-cosmos-glow border-cosmos-glow/40 bg-cosmos-glow/10"
                    : "text-cosmos-text/70 hover:text-cosmos-glow border-cosmos-glow/25 hover:border-cosmos-glow/40"
                } shadow-[0_0_8px_rgba(var(--glow),0.08)]`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                What is Cascade?
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showWhat ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={() => { setShowWhy(!showWhy); setShowWhat(false); }}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl border transition-all ${
                  showWhy
                    ? "text-cosmos-glow border-cosmos-glow/40 bg-cosmos-glow/10"
                    : "text-cosmos-muted/60 hover:text-cosmos-glow border-cosmos-border/20 hover:border-cosmos-glow/30"
                }`}
              >
                Why it Matters
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showWhy ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Dropdown 1: What is Cascade + How to use */}
            <AnimatePresence>
              {showWhat && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-5 bg-cosmos-surface/60 backdrop-blur-sm border border-cosmos-border/40 rounded-2xl text-sm text-cosmos-muted leading-relaxed space-y-4 max-w-xl mx-auto">
                      <div>
                        <h3 className="text-cosmos-text font-medium text-xs uppercase tracking-wider mb-1.5">
                          What is Cascade?
                        </h3>
                        <p>
                          Cascade is a thinking and planning tool. You describe a complex goal or task, and the AI breaks it down
                          into a map of sub-decisions, consequences, and paths you might not have seen coming.
                          Complex tasks are full of nuances and details that are easy to overlook or not even realize
                          are there. Typically, AI just assumes or skips over these, and those silent assumptions can
                          have real consequences downstream. In any complex goal or task, there will inevitably be
                          moments where a decision comes down to tradeoffs and preferences &mdash; choices that have
                          a cascading effect on everything that follows. When the AI reaches one of those moments,
                          <span className="text-cosmos-text"> it detects it, surfaces the conflict and tradeoffs,
                          and brings it to you.</span> You make the judgment call as the human. Your intent drives
                          what happens next.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-cosmos-text font-medium text-xs uppercase tracking-wider mb-1.5">
                          How to use it
                        </h3>
                        <ol className="space-y-2.5 text-cosmos-muted list-decimal list-inside">
                          <li><span className="text-cosmos-text/80">Describe your goal or task</span> with as much detail and context as you can. The more specific you are about your situation, constraints, and who you are, the better the output.</li>
                          <li>The AI breaks down your complex goal or task into a decision tree of sub-decisions, dependencies, and consequences. Any point that requires a nuanced human call &mdash; something that depends on your values, intent, or priorities &mdash; gets flagged and brought back to you.</li>
                          <li><span className="text-cosmos-judgment">Highlighted nodes</span> are those judgment points. Click <span className="text-cosmos-text/80">&ldquo;Decide now&rdquo;</span> to see the options, tradeoffs, blind spots, and what&apos;s at stake. You decide which direction to go.</li>
                          <li>If none of the options fit, you can clarify your situation and redirect the AI. Your choices cascade forward, generating new branches and sometimes surfacing new conflicts.</li>
                          <li>Once all decisions are resolved, the output is a fully laid-out plan you can reference, document, or export as a prompt to build through your preferred AI tool.</li>
                        </ol>
                        <p className="mt-3 text-cosmos-muted/60 text-xs italic">
                          Tip: Open the <span className="text-cosmos-text/70">Values Mirror</span> at any point to see what your decisions reveal about your priorities, adjust your stated values, and get explanations for how they connect to your choices.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Dropdown 2: Why it matters + citations */}
            <AnimatePresence>
              {showWhy && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-5 bg-cosmos-surface/60 backdrop-blur-sm border border-cosmos-border/40 rounded-2xl text-sm text-cosmos-muted leading-relaxed space-y-3 max-w-xl mx-auto">
                      <div>
                        <h4 className="text-cosmos-text/70 text-xs font-medium mb-1">Two kinds of intelligence</h4>
                        <p>
                          The late Professor <a href="https://ischool.utoronto.ca/news/obituary-brian-cantwell-smith-1950-to-2025/" target="_blank" rel="noopener noreferrer" className="text-cosmos-text underline underline-offset-2 hover:text-cosmos-glow transition-colors">Brian Cantwell Smith</a> identified
                          two distinct kinds of intelligence. The first is <em>reckoning</em>: calculative rationality,
                          pattern recognition, decomposition, logical inference. This is what AI does well, and it
                          keeps getting better at it. The second is <em>judgment</em>: deliberative thought that is
                          grounded in ethical commitment and a sense of responsibility to the situation
                          you&apos;re in.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-cosmos-text/70 text-xs font-medium mb-1">What judgment requires</h4>
                        <p>
                          Judgment isn&apos;t about what <em>can</em> be done. It&apos;s about
                          what <em>should</em> be done, and being willing to stand behind that call. This capacity
                          is uniquely human &mdash; it comes from lived experience, caring about outcomes, and
                          understanding what&apos;s at stake for the people involved.
                          Smith&apos;s argument was that AI will produce world-changing reckoning systems, but nothing
                          in AI today comes close to what genuine judgment requires.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-cosmos-text/70 text-xs font-medium mb-1">Why AI can&apos;t replace it</h4>
                        <p>
                          AI doesn&apos;t have skin in the game. It has no stake in the outcome, no responsibility
                          to the people affected, no consequences to live with.
                          <a href="https://www.theguardian.com/technology/2023/jul/25/joseph-weizenbaum-inventor-eliza-chatbot-turned-against-artificial-intelligence-ai" target="_blank" rel="noopener noreferrer" className="text-cosmos-text underline underline-offset-2 hover:text-cosmos-glow transition-colors"> Joseph Weizenbaum</a> arrived at a similar conclusion
                          in the 1970s: the moral dimension of a decision is not something you can hand off to a machine.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-cosmos-text/70 text-xs font-medium mb-1">Where Cascade fits</h4>
                        <p>
                          Cascade is built on that distinction. The AI does the reckoning. The human decides
                          what matters, weighs the tradeoffs, and exercises the judgment that carries real consequences.
                        </p>
                      </div>

                      <div className="text-[11px] text-cosmos-muted/50 pt-3 border-t border-cosmos-border/20 space-y-1.5">
                        <p className="text-cosmos-text/50 text-[10px] uppercase tracking-wider font-medium">Inspired by</p>
                        <p>
                          <a href="https://www.youtube.com/watch?v=8t5Jg7PthFI" target="_blank" rel="noopener noreferrer" className="text-cosmos-glow/70 hover:text-cosmos-glow underline underline-offset-2 transition-colors">Smith, B. C. (2020). <em>Reckoning and Judgement: The Promise of AI.</em></a>
                        </p>
                        <p>
                          Weizenbaum, J. (1976). <em>Computer Power and Human Reason.</em>
                        </p>
                        <p className="text-cosmos-text/50 text-[10px] uppercase tracking-wider font-medium pt-2">Recommended read</p>
                        <p>
                          <a href="https://www.theatlantic.com/technology/2026/02/words-without-consequence/685974/" target="_blank" rel="noopener noreferrer" className="text-cosmos-glow/70 hover:text-cosmos-glow underline underline-offset-2 transition-colors">Roy, D. (2026). &ldquo;Words Without Consequence.&rdquo; <em>The Atlantic.</em></a>
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
                placeholder="Describe a goal or task you're working on. What are you trying to accomplish, who are you, and what's the context?"
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
            <div className="mt-5">
              <button
                onClick={() => setShowValues(!showValues)}
                className="flex items-center gap-2 text-sm text-cosmos-text/80 hover:text-cosmos-glow transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showValues ? "rotate-180" : ""}`} />
                <span className="font-medium">What matters to you for this task?</span>
                {statedValues.length > 0 && (
                  <span className="text-cosmos-glow text-xs">({statedValues.length} selected)</span>
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
                      <p className="text-xs text-cosmos-muted/70 mb-3">
                        Select or add values and priorities that matter to you. The more detailed, the better. The AI will reference these when surfacing tradeoffs and giving feedback.
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
                          disabled={!customValue.trim()}
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

          {/* Load session from file */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-4 flex items-center justify-center gap-3"
          >
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-cosmos-muted/50 border border-cosmos-border/30 rounded-lg hover:border-cosmos-glow/20 hover:text-cosmos-muted cursor-pointer transition-all" title="Upload a previously saved .json session file to continue where you left off">
              <Clock className="w-3 h-3" />
              <span>Upload saved session (.json)</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const data = JSON.parse(ev.target?.result as string);
                      if (data.nodes && data.goalText) {
                        const store = useStore.getState();
                        store.setGoalText(data.goalText);
                        store.addNodes(Object.values(data.nodes));
                        if (data.values) store.setValues(data.values);
                        if (data.critique) store.setCritique(data.critique);
                        store.setHasStarted(true);
                      }
                    } catch {
                      alert("Invalid session file.");
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
            {Object.keys(useStore.getState().nodes).length > 0 && (
              <button
                onClick={() => {
                  const state = useStore.getState();
                  const data = {
                    goalText: state.goalText,
                    nodes: state.nodes,
                    values: state.values,
                    critique: state.critique,
                    exportedAt: new Date().toISOString(),
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `cascade-session-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-cosmos-muted/50 border border-cosmos-border/30 rounded-lg hover:border-cosmos-glow/20 hover:text-cosmos-muted transition-all"
              >
                Save to file
              </button>
            )}
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

          {/* Built by badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="fixed bottom-4 right-4 z-20"
          >
            <span className="text-[10px] text-cosmos-muted/40">Built using Claude Opus 4.6</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
