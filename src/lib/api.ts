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
    // Distinguish the common causes so the error message points at the
    // actual problem instead of always blaming the API key.
    let hint: string;
    if (res.status === 404) {
      hint =
        "Route returned 404. This usually means the Next.js dev server was hot-rebuilding when the request fired. Try the action again in a moment.";
    } else if (res.status >= 500) {
      hint = `Server error (${res.status}). Check the dev server logs. If the error mentions Anthropic, your ANTHROPIC_API_KEY in .env.local may be missing or invalid.`;
    } else if (res.status === 401 || res.status === 403) {
      hint = `Auth error (${res.status}). Your ANTHROPIC_API_KEY in .env.local is missing or invalid.`;
    } else {
      hint = `Unexpected response (${res.status}). Check the dev server logs.`;
    }
    return { error: hint };
  }

  return res.json();
}
