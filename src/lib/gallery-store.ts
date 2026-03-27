import { SharedTree, GamificationProfile, CommunityChallenge } from "@/types";

/**
 * Gallery storage abstraction.
 * Uses Vercel KV when available (production), falls back to in-memory for dev.
 * To enable KV: add KV_REST_API_URL and KV_REST_API_TOKEN env vars in Vercel.
 */

let kv: {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  keys: (pattern: string) => Promise<string[]>;
} | null = null;

async function getKv() {
  if (kv) return kv;

  if (process.env.KV_REST_API_URL) {
    try {
      const vercelKv = await import("@vercel/kv");
      kv = vercelKv.kv;
      return kv;
    } catch {
      console.warn("Vercel KV not available, using in-memory store");
    }
  }

  // In-memory fallback for development
  const store = new Map<string, unknown>();
  kv = {
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: unknown) => { store.set(key, value); },
    del: async (key: string) => { store.delete(key); },
    keys: async (pattern: string) => {
      const prefix = pattern.replace("*", "");
      return Array.from(store.keys()).filter((k) => k.startsWith(prefix));
    },
  };
  return kv;
}

// --- Tree operations ---

export async function saveSharedTree(tree: SharedTree): Promise<void> {
  const store = await getKv();
  await store.set(`tree:${tree.id}`, tree);

  // Add to recent gallery index
  const recentIds: string[] = (await store.get("gallery:recent") as string[]) || [];
  recentIds.unshift(tree.id);
  await store.set("gallery:recent", recentIds.slice(0, 200));

  // Add to goal group
  const goalKey = `goal:${tree.goalSlug}`;
  const goalIds: string[] = (await store.get(goalKey) as string[]) || [];
  if (!goalIds.includes(tree.id)) {
    goalIds.push(tree.id);
    await store.set(goalKey, goalIds);
  }
}

export async function getSharedTree(id: string): Promise<SharedTree | null> {
  const store = await getKv();
  return (await store.get(`tree:${id}`)) as SharedTree | null;
}

export async function getRecentTrees(limit = 20, offset = 0): Promise<SharedTree[]> {
  const store = await getKv();
  const recentIds: string[] = (await store.get("gallery:recent") as string[]) || [];
  const slice = recentIds.slice(offset, offset + limit);

  const trees: SharedTree[] = [];
  for (const id of slice) {
    const tree = await getSharedTree(id);
    if (tree) trees.push(tree);
  }
  return trees;
}

export async function getTreesByGoal(goalSlug: string): Promise<SharedTree[]> {
  const store = await getKv();
  const goalIds: string[] = (await store.get(`goal:${goalSlug}`) as string[]) || [];

  const trees: SharedTree[] = [];
  for (const id of goalIds) {
    const tree = await getSharedTree(id);
    if (tree) trees.push(tree);
  }
  return trees;
}

export async function getGalleryStats(): Promise<{ totalTrees: number; totalGoals: number }> {
  const store = await getKv();
  const recentIds: string[] = (await store.get("gallery:recent") as string[]) || [];
  const goalKeys = await store.keys("goal:*");
  return { totalTrees: recentIds.length, totalGoals: goalKeys.length };
}

// --- Profile operations ---

export async function getProfile(userId: string): Promise<GamificationProfile | null> {
  const store = await getKv();
  return (await store.get(`profile:${userId}`)) as GamificationProfile | null;
}

export async function saveProfile(profile: GamificationProfile): Promise<void> {
  const store = await getKv();
  await store.set(`profile:${profile.userId}`, profile);
}

// --- Challenge operations ---

export async function getActiveChallenges(): Promise<CommunityChallenge[]> {
  const store = await getKv();
  const challenges: CommunityChallenge[] = (await store.get("challenges:active") as CommunityChallenge[]) || [];
  const now = Date.now();
  return challenges.filter((c) => c.endsAt > now);
}

export async function addChallenge(challenge: CommunityChallenge): Promise<void> {
  const store = await getKv();
  const challenges: CommunityChallenge[] = (await store.get("challenges:active") as CommunityChallenge[]) || [];
  challenges.push(challenge);
  await store.set("challenges:active", challenges);
}
