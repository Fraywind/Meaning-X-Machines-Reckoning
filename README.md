# Reckoning

**An AI Deliberation Engine for Human Judgment**

Reckoning decomposes complex goals into decision trees, surfaces hidden conflicts and cascading consequences, and returns control to the human at every inflection point.

The AI does the **reckoning** — decomposition, enumeration, logical inference.
The human does the **judging** — deciding what matters, what's acceptable, what aligns with their deepest priorities.

## Core Features

- **Decision Tree Visualization**: Goals expand into interactive constellations of interconnected nodes
- **Judgment Points**: The AI pauses at value-laden forks and asks for your decision
- **Blind Spot Detection**: Surfaces consequences you haven't considered
- **Constructive Criticism**: Flags contradictions in your stated values
- **Counterfactual Exploration**: Revisit any decision to explore "what if I had chosen differently?"
- **Values Mirror**: A sidebar that builds a model of your priorities from your choices — not your words

## Getting Started

```bash
# Install dependencies
npm install

# Set your Anthropic API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **State your goal** — Type what you want to accomplish in plain language
2. **The AI decomposes** — Your goal expands into sub-tasks, trade-offs, and consequences
3. **Conflicts surface** — When the AI finds a fork that depends on your values, it pauses and asks
4. **You judge** — Review the trade-offs and decide. Your choice cascades forward
5. **Explore alternatives** — Click any resolved decision to ask "what if?"

## Tech Stack

- **Next.js 15** with App Router
- **React Flow** for interactive decision tree visualization
- **Claude API** (Anthropic) for AI decomposition and deliberation
- **Zustand** for state management
- **Framer Motion** for animations
- **Tailwind CSS** for the dark cosmos aesthetic
