/**
 * Attempt to repair common JSON issues from LLM output:
 * - Trailing commas before ] or }
 * - Truncated JSON (unclosed brackets)
 * - Extra text before/after JSON
 */
export function repairJson(raw: string): string {
  // Extract the outermost JSON object
  const start = raw.indexOf("{");
  if (start === -1) throw new Error("No JSON object found");

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth--;

    if (depth === 0) {
      end = i;
      break;
    }
  }

  let json: string;

  if (end === -1) {
    // JSON was truncated — try to close it
    json = raw.slice(start);
    // Close any unclosed strings
    const quoteCount = (json.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) json += '"';
    // Close brackets
    while (depth > 0) {
      // Guess what needs closing based on last opened
      const lastOpen = findLastUnmatched(json);
      json += lastOpen === "[" ? "]" : "}";
      depth--;
    }
  } else {
    json = raw.slice(start, end + 1);
  }

  // Fix trailing commas: ,] or ,}
  json = json.replace(/,\s*([\]}])/g, "$1");

  return json;
}

function findLastUnmatched(s: string): string {
  const stack: string[] = [];
  let inStr = false;
  let esc = false;

  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    if (ch === "}" || ch === "]") stack.pop();
  }

  return stack.length > 0 ? stack[stack.length - 1] : "{";
}

export function safeParseJson(raw: string) {
  // First try straight parse
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // Fall through to repair
  }

  // Try repair
  try {
    const repaired = repairJson(raw);
    return JSON.parse(repaired);
  } catch (e) {
    throw new Error(`Failed to parse AI response even after repair: ${e}`);
  }
}
