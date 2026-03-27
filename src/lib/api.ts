export async function safeFetch(url: string, body: Record<string, unknown>) {
  // Auto-inject language, quickMode, and constraints from store for LLM API calls
  let language = "en";
  let quickMode = false;
  let constraints: string[] = [];
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("reckoning-language");
      if (stored === "zh" || stored === "hi" || stored === "es") language = stored;
    }
    // Import store dynamically to avoid circular deps
    const { useStore } = await import("@/store/useStore");
    const state = useStore.getState();
    quickMode = state.quickMode;
    constraints = state.constraints;
  } catch {}

  const enrichedBody = { ...body, language, quickMode, constraints };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enrichedBody),
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error(`API returned non-JSON (${res.status}):`, text.slice(0, 200));
    return { error: `Server error (${res.status}). Check that your ANTHROPIC_API_KEY is set in .env.local` };
  }

  return res.json();
}
