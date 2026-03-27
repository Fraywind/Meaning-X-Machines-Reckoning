export async function safeFetch(url: string, body: Record<string, unknown>) {
  // Auto-inject language from localStorage for LLM API calls
  let language = "en";
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem("reckoning-language") : null;
    if (stored === "zh" || stored === "hi" || stored === "es") language = stored;
  } catch {}

  const enrichedBody = { ...body, language };

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
