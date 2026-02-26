# AI Word Lookup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Claude API route that returns a definition + rich markdown content for a word, and display it in a tabbed view alongside MW results on the create page.

**Architecture:** New `/api/ai` server route calls Anthropic SDK with a lexicographer prompt, returns structured JSON. The create page fires both `/api/dictionary` and `/api/ai` in parallel on search, rendering results in "Dictionary" | "AI" tabs.

**Tech Stack:** Anthropic SDK (`@anthropic-ai/sdk`), Next.js API routes, React tabs

---

### Task 1: Install Anthropic SDK

**Step 1: Install**

Run: `npm install @anthropic-ai/sdk`

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add @anthropic-ai/sdk dependency"
```

---

### Task 2: Create AI API route

**Files:**
- Create: `src/app/api/ai/route.ts`

**Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const word = req.nextUrl.searchParams.get("word");
  if (!word) {
    return NextResponse.json({ error: "Missing word parameter" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are a concise, knowledgeable lexicographer. When given a word, return a JSON object with exactly these fields:

- "word": the word as a string
- "definition": a clear, concise definition (1-2 sentences)
- "part_of_speech": the primary part of speech (e.g. "noun", "verb", "adjective")
- "pronunciation": the pronunciation key (e.g. "ih-FEM-er-ul")
- "content": a markdown string with these sections:
  ## Etymology
  Brief origin of the word (2-3 sentences)

  ## Examples
  2-3 example sentences using the word naturally

  ## Usage Notes
  When and how this word is typically used, register, any common confusions (2-3 sentences)

  ## Related Words
  3-5 related words or synonyms, each with a brief note on how it differs

Return ONLY valid JSON. No markdown fences, no explanation outside the JSON.`,
      messages: [
        {
          role: "user",
          content: `Define the word: "${word}"`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text);

    return NextResponse.json({
      word: parsed.word || word,
      definition: parsed.definition || "",
      part_of_speech: parsed.part_of_speech || "",
      pronunciation: parsed.pronunciation || null,
      content: parsed.content || "",
    });
  } catch (err) {
    const errorMessage = err instanceof SyntaxError
      ? "Failed to parse AI response"
      : "AI lookup failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
```

**Step 2: Add `ANTHROPIC_API_KEY` to `.env.local.example`**

Add the line: `ANTHROPIC_API_KEY=your_anthropic_api_key_here`

**Step 3: Commit**

```bash
git add src/app/api/ai/route.ts .env.local.example
git commit -m "Add /api/ai route for Claude word lookups"
```

---

### Task 3: Add tabbed view to create page

**Files:**
- Modify: `src/app/admin/create/page.tsx`

This is the largest task. The create page needs:

1. New state for AI results and active tab
2. Parallel fetch to `/api/ai` alongside the existing `/api/dictionary` call
3. Tab switcher UI above results
4. AI tab content with definition display and "Add" button

**Step 1: Add new state variables**

After the existing state declarations, add:

```tsx
const [aiResult, setAiResult] = useState<{
  word: string;
  definition: string;
  part_of_speech: string;
  pronunciation: string | null;
  content: string;
} | null>(null);
const [aiLoading, setAiLoading] = useState(false);
const [aiError, setAiError] = useState("");
const [activeTab, setActiveTab] = useState<"dictionary" | "ai">("dictionary");
```

**Step 2: Update `lookupWord` to call both APIs in parallel**

Replace the try block inside `lookupWord` with:

```tsx
try {
  const [dictRes, aiRes] = await Promise.allSettled([
    fetch(`/api/dictionary?word=${encodeURIComponent(searchWord.trim())}`),
    fetch(`/api/ai?word=${encodeURIComponent(searchWord.trim())}`),
  ]);

  // Handle dictionary result
  if (dictRes.status === "fulfilled") {
    const data = await dictRes.value.json();
    if (data.error) {
      setError(data.error);
    } else {
      setResults(data.definitions || []);
      setSuggestions(data.suggestions || []);
    }
  } else {
    setError("Failed to look up word.");
  }

  // Handle AI result
  if (aiRes.status === "fulfilled" && aiRes.value.ok) {
    const data = await aiRes.value.json();
    setAiResult(data);
  } else {
    setAiError("AI lookup unavailable.");
  }
} catch {
  setError("Failed to look up word.");
}
```

Also clear AI state in the reset block at the top of `lookupWord`:

```tsx
setAiResult(null);
setAiError("");
setAiLoading(false);
setActiveTab("dictionary");
```

**Step 3: Add `addAiWord` function**

After the `addSelected` function, add:

```tsx
async function addAiWord() {
  if (!aiResult) return;
  setSaving(true);
  setError("");

  try {
    const res = await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word: aiResult.word,
        definition: aiResult.definition,
        part_of_speech: aiResult.part_of_speech || null,
        pronunciation: aiResult.pronunciation || null,
        source: "claude",
        content: aiResult.content || null,
        notes: notes.trim() || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save.");
    } else {
      setSaved(true);
      setQuery("");
      setResults([]);
      setAiResult(null);
      setNotes("");
      setSelected({});
    }
  } catch {
    setError("Failed to save word.");
  } finally {
    setSaving(false);
  }
}
```

**Step 4: Add tab switcher UI**

Above the results section (before `{/* Results */}`), add tabs when there are results or an AI result:

```tsx
{(results.length > 0 || aiResult || aiError) && (
  <div className="flex gap-1 mb-6 border-b border-border">
    <button
      onClick={() => setActiveTab("dictionary")}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
        activeTab === "dictionary"
          ? "border-accent text-accent"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      Dictionary
    </button>
    <button
      onClick={() => setActiveTab("ai")}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
        activeTab === "ai"
          ? "border-accent text-accent"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      AI
    </button>
  </div>
)}
```

**Step 5: Wrap existing MW results in dictionary tab conditional**

Wrap the existing results `{results.map(...)}` block and the "Add Selected" sticky button in:

```tsx
{activeTab === "dictionary" && (
  <>
    {/* existing results.map and Add Selected button */}
  </>
)}
```

**Step 6: Add AI tab content**

After the dictionary tab block, add:

```tsx
{activeTab === "ai" && (
  <div>
    {aiError && (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {aiError}
      </div>
    )}
    {!aiResult && !aiError && (
      <p className="text-muted text-center py-12">Loading AI response…</p>
    )}
    {aiResult && (
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-baseline gap-3 mb-1">
          <h3 className="font-serif text-xl font-semibold">{aiResult.word}</h3>
          {aiResult.part_of_speech && (
            <span className="text-xs italic text-muted">{aiResult.part_of_speech}</span>
          )}
        </div>
        {aiResult.pronunciation && (
          <p className="text-sm text-muted mb-3 font-mono">/{aiResult.pronunciation}/</p>
        )}
        <p className="text-ink/80 mb-4">{aiResult.definition}</p>
        {aiResult.content && (
          <details className="mb-4">
            <summary className="text-sm text-muted cursor-pointer hover:text-ink transition-colors">
              Show full content
            </summary>
            <div className="mt-3 prose prose-sm prose-stone max-w-none border-t border-border pt-3">
              <ReactMarkdown>{aiResult.content}</ReactMarkdown>
            </div>
          </details>
        )}
        <button
          onClick={addAiWord}
          disabled={saving}
          className="px-5 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors font-medium text-sm disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add to Lexicon"}
        </button>
      </div>
    )}
  </div>
)}
```

**Step 7: Add ReactMarkdown import**

At the top of the file, add:

```tsx
import ReactMarkdown from "react-markdown";
```

**Step 8: Commit**

```bash
git add src/app/admin/create/page.tsx
git commit -m "Add tabbed Dictionary/AI view to create page"
```

---

### Task 4: Update .env.local.example and CLAUDE.md

**Files:**
- Modify: `.env.local.example`
- Modify: `CLAUDE.md`

**Step 1: Add ANTHROPIC_API_KEY to .env.local.example**

Add line: `ANTHROPIC_API_KEY=your_anthropic_api_key_here`

**Step 2: Add ANTHROPIC_API_KEY to the Environment Variables table in CLAUDE.md**

Add row: `| \`ANTHROPIC_API_KEY\` | Anthropic API key for AI word lookups (server-only) |`

**Step 3: Commit**

```bash
git add .env.local.example CLAUDE.md
git commit -m "Document ANTHROPIC_API_KEY env variable"
```

---

### Task 5: Build verification

**Step 1: Run build**

Run: `npm run build`
Expected: Clean compilation, no errors.

**Step 2: Push**

```bash
git push
```
