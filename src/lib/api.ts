export async function safeFetch(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error(`API returned non-JSON (${res.status}):`, text.slice(0, 200));
    return { error: `Server error (${res.status}). Check that your ANTHROPIC_API_KEY is set in .env.local` };
  }

  return res.json();
}
