"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import ModePicker from "./ModePicker";
import SetupPanel from "./SetupPanel";
import CastPersonaPanel, { CastPersonaConfig } from "./CastPersonaPanel";
import PanelView from "./PanelView";
import NarrativeView from "./NarrativeView";
import SkepticCharacter from "./personas/SkepticCharacter";
import PragmatistCharacter from "./personas/PragmatistCharacter";
import StressTestCharacter from "./personas/StressTestCharacter";
import ExpertCharacter from "./personas/ExpertCharacter";
import { safeFetch } from "@/lib/api";
import Starfield from "./Starfield";
import ThemeSwitcher from "./ThemeSwitcher";
// Language picker removed; the app is English-only.

/** Map archetype id to Character component. Unknown archetypes fall back to ExpertCharacter. */
// Trim the user's goal to a short, lowercase fragment that reads naturally
// inside an opener sentence. Avoids quoting it back verbatim with capitals.
function shortGoal(goal: string): string {
  const t = goal.trim();
  if (!t) return "";
  // Strip leading "I want to" / "I'm trying to" / "How do I" / etc., lowercase.
  const cleaned = t
    .replace(/^(i\s+want\s+to|i'm\s+trying\s+to|i\s+am\s+trying\s+to|how\s+do\s+i|should\s+i|can\s+i|i\s+need\s+to|let's|deciding\s+whether\s+to|figuring\s+out\s+whether\s+to)\s+/i, "")
    .replace(/[?.!]+$/, "")
    .toLowerCase();
  if (cleaned.length <= 80) return cleaned;
  // Cut at the nearest word boundary so we don't truncate mid-word
  // (e.g. "indian vegetari..." reads worse than "for a group...").
  const wordCutoff = cleaned.lastIndexOf(" ", 80);
  const safeCutoff = wordCutoff > 40 ? wordCutoff : 80;
  return cleaned.slice(0, safeCutoff).trimEnd() + "...";
}

function buildCastPersonaConfig(
  rec: { id: string; name: string; role: string; archetype: string; accessory?: string },
  goal: string = "",
): CastPersonaConfig {
  let CharacterComponent: React.ComponentType<{ thinking: boolean }>;
  let openingMessage: string;
  let openingOptions: string[] | undefined;
  const g = shortGoal(goal);

  switch (rec.archetype) {
    case "skeptic":
      // Skeptic stays consistent: same opening regardless of the goal.
      CharacterComponent = SkepticCharacter;
      openingMessage =
        "Let's pressure-test this. What's the strongest case for your direction, and what's the case against you've already considered?";
      openingOptions = [
        "I haven't really stress-tested it",
        "Push me on the assumptions",
        "Tell me what you'd attack first",
      ];
      break;
    case "pragmatist":
      CharacterComponent = PragmatistCharacter;
      openingMessage = g
        ? `If you're going to ${g}, what does Monday morning actually look like? Who does the work, and where does the first dollar go?`
        : "Tell me what you actually do tomorrow morning if this goes ahead. Who does the work, and where does the first dollar go?";
      openingOptions = [
        "I haven't planned that part yet",
        "Walk me through what I'm missing",
        "What would you do in the first week?",
      ];
      break;
    case "stress-test":
      CharacterComponent = StressTestCharacter;
      openingMessage = g
        ? `Picture this: you went ahead and tried to ${g}, and a year in it isn't working the way you hoped. What's the version of failure you'd actually be most embarrassed by?`
        : "Picture this: you went ahead with this, and a year in it isn't working the way you hoped. What's the version of failure you'd actually be most embarrassed by?";
      openingOptions = [
        "I'm not sure where it would crack",
        "Help me name the quiet failure modes",
        "What do most people in this situation miss?",
      ];
      break;
    case "anchor":
      // Reuse ExpertCharacter with a clipboard accessory so Anchor reads
      // visually as the synthesizer-with-a-plan.
      // eslint-disable-next-line react/display-name
      CharacterComponent = ({ thinking }: { thinking: boolean }) => (
        <ExpertCharacter thinking={thinking} accentSeed="anchor" accessory="clipboard" />
      );
      openingMessage =
        "I'm here to wrap this up. Before we land on a plan, I need to understand your real constraints. How much time do you actually have, and how much of it can you commit to this?";
      openingOptions = [
        "Walk me through the constraints",
        "Tell me what's realistic given everything that's been said",
        "I'm not sure I have a workable plan yet",
      ];
      break;
    default:
      // Domain-specific or unknown → Expert with name-derived accent color
      // and an optional role-based accessory (chef hat, glasses, etc.) so
      // each domain expert reads visually distinct.
      // eslint-disable-next-line react/display-name
      CharacterComponent = ({ thinking }: { thinking: boolean }) => (
        <ExpertCharacter thinking={thinking} accentSeed={rec.name} accessory={rec.accessory} />
      );
      // Substantive opener: poses a real domain-flavored question instead
      // of introducing themselves and handing the work back to the user.
      openingMessage = g
        ? `${rec.name} here. The thing I'd ask first about ${g}: what made you think the existing options aren't already covering this? Walk me through what you've actually seen, not what you think might be there.`
        : `${rec.name} here. The thing I'd ask first: what made you think the existing options aren't already covering this? Walk me through what you've actually seen.`;
      openingOptions = [
        "I've looked at what's out there",
        "Honestly, I'm assuming",
        "I've seen people struggle with the current options",
      ];
  }

  return {
    id: rec.id,
    name: rec.name,
    subtitle: rec.role || "(domain expert)",
    thinkingLabel: "thinking...",
    archetype: rec.archetype,
    role: rec.role,
    openingMessage,
    openingOptions,
    CharacterComponent,
  };
}

export default function GoalInput() {
  const [showWhat, setShowWhat] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const {
    setGoalText,
    setHasStarted,
    setIsDecomposing,
    addNodes,
    addValues,
    setCritique,
    loadSessionsFromStorage,
    currentCastPersona,
    setCurrentCastPersona,
    castConversations,
    briefExtracted,
    recommendedPersonas,
    briefMessages,
    panelMode,
    panelPersonaIds,
    exitPanelMode,
    narrativeOpen,
    setNarrativeOpen,
  } = useStore();

  useEffect(() => {
    loadSessionsFromStorage();
    // Cascade is always Standard depth. Force quickMode off on mount
    // in case it was persisted to true from a prior session.
    useStore.getState().setQuickMode(false);
  }, [loadSessionsFromStorage]);

  const examples = [
    {
      text: "I want to build a learning tool for 3-5 year olds, but I'm worried I'll just add another mediocre app to a crowded market. How should I think about whether to actually pursue this, given my background isn't in early childhood education?",
    },
    {
      text: "I've been offered a senior role at a nonprofit doing work I deeply care about. The pay is half what I make now. We have two kids and a mortgage. I have until next Friday. I want to plan out whether I should take it.",
    },
    {
      text: "I want to plan how to host Thanksgiving this year. I've never hosted before and I suck at cooking. My friend's parents are coming and they're Indian vegetarian. Honestly the whole thing is stressing me out. I want to figure out whether to actually pull this off or bail, because I have no idea how to make a vegetarian Thanksgiving everyone will actually enjoy.",
    },
  ];

  const startDecomposition = useCallback(
    async (goal: string, values: string[], constraints: string[], extraContext?: string) => {
      if (!goal.trim()) return;

      let fullGoal = goal;
      if (values.length > 0) {
        fullGoal +=
          `\n\n--- Values and priorities the user explicitly stated matter to them ---\n${values.join(", ")}\nWhen critiquing decisions, reference these stated values. Distinguish between values the user stated upfront vs. values you infer from their choices.`;
      }

      if (extraContext && extraContext.trim()) {
        fullGoal += `\n\n--- Insights from cast personas ---\n${extraContext.trim()}`;
      }

      if (constraints.length > 0) {
        useStore.getState().setConstraints(constraints);
      }

      setGoalText(goal);
      setHasStarted(true);
      setIsDecomposing(true);

      addNodes([
        {
          id: "goal-root",
          type: "goal",
          label: goal.length > 60 ? goal.slice(0, 57) + "..." : goal,
          description: goal,
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
          (n: { parentId: string | null;[key: string]: unknown }) => ({
            ...n,
            parentId: n.parentId || "goal-root",
          }),
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
    },
    [setGoalText, setHasStarted, setIsDecomposing, addNodes, addValues, setCritique],
  );

  // When a cast persona finishes, combine its summary with Setup's extracted goal
  // and start the tree decomposition with the enriched context.
  const handleCastComplete = useCallback(
    (_summary: string) => {
      const goal = briefExtracted.goal || "";
      const values = briefExtracted.values || [];
      const constraints = briefExtracted.constraints || [];

      // Pull summaries from every visited cast persona that has reached ready
      const summaries: string[] = [];
      for (const [pid, conv] of Object.entries(castConversations)) {
        if (conv.ready && conv.summary) {
          summaries.push(`[${pid}]: ${conv.summary}`);
        }
      }
      const extraContext = summaries.join("\n");

      setCurrentCastPersona(null);
      startDecomposition(goal, values, constraints, extraContext);
    },
    [briefExtracted, castConversations, setCurrentCastPersona, startDecomposition],
  );

  return (
    <div className="relative h-screen overflow-y-auto">
      <Starfield />

      {/* Top right: theme only. Language was removed; the app is English-only. */}
      {briefMessages.length === 0 && !currentCastPersona && (
        <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
          <div className="[&_button]:border-cosmos-glow/30 [&_button]:text-cosmos-text/70">
            <ThemeSwitcher />
          </div>
        </div>
      )}

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
                    @keyframes cascadeText {
                      0% { clip-path: inset(0 100% 0 0); }
                      60% { clip-path: inset(0 0 0 0); }
                      100% { clip-path: inset(0 0 0 0); }
                    }
                  `}</style>
                  <circle cx="12" cy="3" r="2" className="cn1" />
                  <line x1="10" y1="5" x2="4" y2="10" className="cl1" />
                  <line x1="12" y1="5" x2="12" y2="10" className="cl1" />
                  <line x1="14" y1="5" x2="20" y2="10" className="cl1" />
                  <circle cx="4" cy="12" r="2" className="cn2" fill={useStore.getState().theme === "nature" ? "#8B6914" : useStore.getState().theme === "starfield" ? "#E8730E" : "currentColor"} stroke={useStore.getState().theme === "nature" ? "#8B6914" : useStore.getState().theme === "starfield" ? "#E8730E" : "currentColor"} />
                  <circle cx="12" cy="12" r="2" className="cn2" fill={useStore.getState().theme === "nature" ? "#8B6914" : useStore.getState().theme === "starfield" ? "#E8730E" : "currentColor"} stroke={useStore.getState().theme === "nature" ? "#8B6914" : useStore.getState().theme === "starfield" ? "#E8730E" : "currentColor"} />
                  <circle cx="20" cy="12" r="2" className="cn2" fill={useStore.getState().theme === "nature" ? "#8B6914" : useStore.getState().theme === "starfield" ? "#E8730E" : "currentColor"} stroke={useStore.getState().theme === "nature" ? "#8B6914" : useStore.getState().theme === "starfield" ? "#E8730E" : "currentColor"} />
                  <line x1="4" y1="14" x2="8" y2="19" className="cl2" />
                  <line x1="12" y1="14" x2="12" y2="19" className="cl2" />
                  <line x1="20" y1="14" x2="16" y2="19" className="cl2" />
                  <circle cx="12" cy="21" r="2" className="cn3" />
                </svg>
              </div>
              <h1 className="text-4xl font-display font-bold tracking-tight text-cosmos-text cursor-default cascade-title">
                {"Cascade".split("").map((char, i) => (
                  <span
                    key={i}
                    className="cascade-letter inline-block"
                    style={{ "--cascade-i": i } as React.CSSProperties}
                  >
                    {char}
                  </span>
                ))}
              </h1>
            </div>
          </motion.div>

          {/* About dropdowns */}
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
                        Cascade is a structured deliberation tool. You describe a complex goal or decision, and instead of getting back a single confident answer, you talk it through with a small cast of personas before any structured plan is generated. Each persona pushes your thinking from a specific angle.
                      </p>
                      <p className="mt-2">
                        The difference from a typical AI conversation is what happens at the points that actually require you. Complex decisions are full of moments where the right answer depends on what you value, not on what is true. A normal chatbot quietly absorbs those moments and gives you a recommendation. Cascade does the opposite. When a persona reaches one of those moments,
                        <span className="text-cosmos-text"> it surfaces the conflict and the tradeoffs, flags it as a judgment moment, and adds it as a node on your decision tree right then.</span> The tree builds up live as you talk. You make every judgment call yourself.
                      </p>
                      <p className="mt-2">
                        The cast has two kinds of personas. The first kind is universal: <span className="text-cosmos-text/80">Skeptic</span> challenges your reasoning, <span className="text-cosmos-text/80">Pragmatist</span> asks what you actually do tomorrow morning, <span className="text-cosmos-text/80">Stress Test</span> imagines this has already failed and asks why. The second kind is domain-specific. Setup looks at your goal and recommends real subject matter experts (an early childhood educator if you are building for kids, a financial planner if you are weighing a job offer) with a generated dossier of the concepts and language a real practitioner thinks in. You can also add your own expert by describing them, and they get added to the cast.
                      </p>
                      <p className="mt-2">
                        Each persona has a voice (you can read their messages aloud, hold Space to talk back, or both). After at least two personas have pushed on you, a Panel mode unlocks where you can put any two of them in the same room and moderate a conversation between them. When you finish, you can also read a second-person narrative of what happened in your session, which the tool generates from your actual exchanges.
                      </p>
                      <p className="mt-2">
                        As you work, a <span className="text-cosmos-text/80">Values Mirror</span> tracks what your choices reveal about your priorities and where they are in tension. You can set constraints up front (budget, timeline, dealbreakers) and the personas will factor them in. The final output is a structured plan you can reference, document, or export as a prompt to build through your preferred AI tool.
                      </p>
                      <p className="mt-2 text-cosmos-muted/60 text-xs">
                        There is a quick mode if you are short on time, but the standard experience is where Cascade is most useful. Sitting with each decision, and being pushed before you commit, is the point.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-cosmos-text font-medium text-xs uppercase tracking-wider mb-1.5">
                        How to use it
                      </h3>
                      <ol className="space-y-2.5 text-cosmos-muted list-decimal list-inside">
                        <li><span className="text-cosmos-text/80">Setup asks what you are trying to decide.</span> Give it as much context as you want, a sentence or a paragraph both work. Setup pushes back on a few of the assumptions in your phrasing and helps you sharpen the question.</li>
                        <li><span className="text-cosmos-text/80">Setup hands you off to a recommended cast of personas.</span> Skeptic is almost always first, alongside two or three domain experts tailored to your goal. You can also add a specific expert of your own from the cast list.</li>
                        <li>You talk to each persona one at a time. They push from their specific angle, and along the way they may flag <span className="text-cosmos-judgment">judgment moments</span>. Those are the moments where the choice is yours, not the AI's. They get highlighted and added to your tree live.</li>
                        <li>After at least two personas have pushed on you, the tree opens. You can also enter <span className="text-cosmos-text/80">Panel mode</span> to put any two ready personas in the same room and moderate a conversation between them.</li>
                        <li>Each judgment node on the tree shows the options, tradeoffs, and what is at stake. You decide. If none of the options fit, you can clarify and redirect, and the tree grows from there.</li>
                        <li>When you are done, you can read the <span className="text-cosmos-text/80">story of what happened</span> in your session, a second-person narrative drawn from your actual exchanges, or export the structured plan.</li>
                      </ol>
                      <p className="mt-3 text-cosmos-muted/60 text-xs italic">
                        Tip: hold <kbd className="px-1 py-0.5 rounded border border-cosmos-border/50 text-cosmos-muted/70 font-mono text-[10px]">Space</kbd> anywhere in a persona conversation to talk instead of typing. Click the volume icon next to any persona message to hear it read aloud in their voice.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                        is uniquely human, and it comes from lived experience, caring about outcomes, and
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

          {/* Mode picker (Tree / Notebook / Dialogue) */}
          <ModePicker />

          {/* Depth selector removed. Cascade is always Standard depth.
              quickMode is forced to false on mount below. */}

          {/* Setup persona — replaces the textarea entry */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <SetupPanel
              onReady={startDecomposition}
              onSummonPersona={(id) => setCurrentCastPersona(id)}
              examples={examples}
            />
          </motion.div>

          {/* Forest, Gallery, and Upload-session links removed for the
              simplified-home iteration. Preserved on the wednesday-night
              branch (and earlier in git history) for reference. */}

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

      {/* Cast persona room — opens on top of SetupPanel when a persona is summoned */}
      {currentCastPersona && !panelMode && (() => {
        const rec = recommendedPersonas.find((p) => p.id === currentCastPersona);
        if (!rec) return null;
        const config = buildCastPersonaConfig(rec, briefExtracted.goal || "");
        // The key forces a remount when persona changes, so the on-mount
        // effect (markCastVisited + opening message seed) re-fires.
        return (
          <CastPersonaPanel
            key={config.id}
            persona={config}
            onComplete={handleCastComplete}
            onClose={() => setCurrentCastPersona(null)}
          />
        );
      })()}

      {/* Narrative view: end-of-experience second-person story of the session. */}
      {narrativeOpen && <NarrativeView onClose={() => setNarrativeOpen(false)} />}

      {/* Panel mode: two personas, user moderates. Only opens when user
          explicitly toggles it from CastPersonaPanel and at least 2 cast
          personas are ready. */}
      {panelMode && panelPersonaIds && (() => {
        const recA = recommendedPersonas.find((p) => p.id === panelPersonaIds[0]);
        const recB = recommendedPersonas.find((p) => p.id === panelPersonaIds[1]);
        if (!recA || !recB) {
          // Defensive: if a panel persona was lost (cast reset etc.), exit cleanly.
          exitPanelMode();
          return null;
        }
        const goal = briefExtracted.goal || "";
        const cfgA = buildCastPersonaConfig(recA, goal);
        const cfgB = buildCastPersonaConfig(recB, goal);
        return <PanelView configs={[cfgA, cfgB]} onClose={exitPanelMode} />;
      })()}
    </div>
  );
}
