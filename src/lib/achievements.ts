import { Achievement, AchievementCategory, DecisionNode, UserValue } from "@/types";

interface AchievementDef {
  id: string;
  label: string;
  description: string;
  category: AchievementCategory;
  check: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  nodes: Record<string, DecisionNode>;
  values: UserValue[];
  treesShared: number;
  totalDecisions: number;
  existingAchievements: string[]; // ids already unlocked
}

const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  // Depth
  {
    id: "first-reckoning",
    label: "First Reckoning",
    description: "Completed your first deliberation tree",
    category: "depth",
    check: (ctx) => Object.keys(ctx.nodes).length >= 3,
  },
  {
    id: "deep-dive",
    label: "Deep Dive",
    description: "Explored a tree with 15+ nodes",
    category: "depth",
    check: (ctx) => Object.keys(ctx.nodes).length >= 15,
  },
  {
    id: "ten-decisions",
    label: "Decisive",
    description: "Made 10 judgment calls across all your trees",
    category: "depth",
    check: (ctx) => ctx.totalDecisions >= 10,
  },
  {
    id: "tension-navigator",
    label: "Tension Navigator",
    description: "Resolved all judgments in a tree with conflicting values",
    category: "depth",
    check: (ctx) => {
      const nodeList = Object.values(ctx.nodes);
      const hasConflicts = nodeList.some((n) => n.conflict);
      const pendingJudgments = nodeList.filter(
        (n) => n.type === "judgment" && n.status !== "resolved",
      );
      const resolvedCount = nodeList.filter((n) => n.type === "resolved").length;
      return hasConflicts && pendingJudgments.length === 0 && resolvedCount >= 2;
    },
  },

  // Insight
  {
    id: "blind-spot-acknowledged",
    label: "Blind Spot Acknowledged",
    description: "Completed a tree where blind spots were surfaced",
    category: "insight",
    check: (ctx) => {
      const nodeList = Object.values(ctx.nodes);
      return nodeList.some((n) => n.blindSpots && n.blindSpots.length > 0);
    },
  },
  {
    id: "values-revealed",
    label: "Mirror, Mirror",
    description: "Had 5+ values revealed through your decisions",
    category: "insight",
    check: (ctx) => ctx.values.length >= 5,
  },
  {
    id: "counterfactual-explorer",
    label: "What If?",
    description: "Explored a counterfactual path",
    category: "insight",
    check: (ctx) => {
      return Object.values(ctx.nodes).some((n) => n.type === "counterfactual");
    },
  },

  // Community
  {
    id: "first-share",
    label: "First Share",
    description: "Shared your first deliberation with the community",
    category: "community",
    check: (ctx) => ctx.treesShared >= 1,
  },
  {
    id: "prolific-sharer",
    label: "Prolific",
    description: "Shared 5 deliberations with the community",
    category: "community",
    check: (ctx) => ctx.treesShared >= 5,
  },

  // Consistency
  {
    id: "values-aligned",
    label: "True to Form",
    description: "Your revealed values closely matched your stated values",
    category: "consistency",
    check: (ctx) => {
      // This is checked externally via consistency score
      return false; // handled by consistency module
    },
  },
];

export function checkAchievements(ctx: AchievementContext): Achievement[] {
  const newAchievements: Achievement[] = [];

  for (const def of ACHIEVEMENT_CATALOG) {
    if (ctx.existingAchievements.includes(def.id)) continue;
    if (def.check(ctx)) {
      newAchievements.push({
        id: def.id,
        label: def.label,
        description: def.description,
        unlockedAt: Date.now(),
        category: def.category,
      });
    }
  }

  return newAchievements;
}

export function getAchievementCatalog(): Omit<AchievementDef, "check">[] {
  return ACHIEVEMENT_CATALOG.map(({ check, ...rest }) => rest);
}
