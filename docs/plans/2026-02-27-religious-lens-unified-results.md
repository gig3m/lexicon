# Religious Lens + Unified Results Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a biblical studies lens to AI word lookups and replace the tabbed MW/AI results UI with a unified checklist where users pick any combination of definitions, with AI content always attached.

**Architecture:** Two changes — (1) update the AI system prompt to include biblical/theological context, (2) rewrite the create page from tabs to a flat checklist with source badges and unified save logic.

**Tech Stack:** Next.js 15, React 19, Anthropic API, Tailwind CSS 4

---

### Task 1: Update AI prompt with biblical studies lens

**Files:**
- Modify: `src/app/api/ai/route.ts:25-38` (system prompt)

**Step 1: Edit the system prompt**

In `src/app/api/ai/route.ts`, update the system prompt string (lines 25-38). Insert a new paragraph after the `content` field description, before the "IMPORTANT" line. The new instruction reads:

```
Where relevant, explore the word's connection to biblical languages (Hebrew, Greek, Latin), its usage in Scripture or theological discourse, and any spiritual or theological significance. Weave this naturally into the etymology and explanation — do not create a separate "Religious" section.
```

The full `content` instruction becomes (showing only the changed portion):

```typescript
  First, a flowing explanation with NO header. Weave together the word's etymology (including original language roots in italics), how and when it is used, what distinguishes it from related terms, and natural example usage — all in connected prose paragraphs. Where relevant, explore the word's connection to biblical languages (Hebrew, Greek, Latin), its usage in Scripture or theological discourse, and any spiritual or theological significance. Write in a clear, authoritative but accessible style. Aim for 2-4 paragraphs. Think of this as the explanatory essay a well-read friend would write, not a rigid dictionary entry.
```

**Step 2: Verify the route still works**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add src/app/api/ai/route.ts
git commit -m "Add biblical studies lens to AI word lookup prompt"
```

---

### Task 2: Replace tabbed UI with unified checklist — state and types

**Files:**
- Modify: `src/app/admin/create/page.tsx`

**Step 1: Remove tab state, add AI checkbox state**

Remove `activeTab` state (line 25). Add `aiSelected` boolean state:

Replace:
```tsx
const [activeTab, setActiveTab] = useState<"dictionary" | "ai">("dictionary");
```

With:
```tsx
const [aiSelected, setAiSelected] = useState(false);
```

In `lookupWord()`, remove `setActiveTab("dictionary")` (line 39).

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: Build fails (references to `activeTab` in JSX) — that's expected, we'll fix in Task 3.

**Step 3: Commit**

```bash
git add src/app/admin/create/page.tsx
git commit -m "Replace tab state with AI checkbox state"
```

---

### Task 3: Rewrite JSX — unified checklist layout

**Files:**
- Modify: `src/app/admin/create/page.tsx` (lines 270-386, the tabs and results sections)

**Step 1: Replace the entire tab + results section**

Remove everything from the `{/* Tabs */}` comment (line 270) through the end of the AI tab section (line 386). Replace with this unified layout:

```tsx
      {/* Results — unified checklist */}
      {(results.length > 0 || aiResult || aiError) && (
        <div className="space-y-4">
          {/* MW definitions */}
          {results.map((entry, i) => (
            <div key={`mw-${i}`} className="bg-surface border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/10 text-muted">
                  MW
                </span>
                <h3 className="font-serif text-xl font-semibold">{entry.word}</h3>
                <span className="text-xs italic text-muted">{entry.partOfSpeech}</span>
              </div>
              {entry.pronunciation && (
                <p className="text-sm text-muted mb-3 font-mono">/{entry.pronunciation}/</p>
              )}
              <div className="space-y-2">
                {entry.definitions.map((def, j) => (
                  <label
                    key={j}
                    className="flex items-start gap-3 p-3 rounded border border-transparent hover:border-accent/20 hover:bg-surface-hover transition-all cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected[i]?.has(j) ?? false}
                      onChange={() => toggleDef(i, j)}
                      className="mt-1 accent-accent"
                    />
                    <p className="text-ink/80 flex-1">
                      <span className="text-muted text-xs mr-2">{j + 1}.</span>
                      {def}
                    </p>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* AI definition */}
          {aiError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {aiError}
            </div>
          )}
          {!aiResult && !aiError && results.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                  AI
                </span>
                <p className="text-muted text-sm">Loading AI response…</p>
              </div>
            </div>
          )}
          {aiResult && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSelected}
                  onChange={() => setAiSelected((prev) => !prev)}
                  className="mt-2 accent-accent"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                      AI
                    </span>
                    <h3 className="font-serif text-xl font-semibold">{aiResult.word}</h3>
                    {aiResult.part_of_speech && (
                      <span className="text-xs italic text-muted">{aiResult.part_of_speech}</span>
                    )}
                  </div>
                  {aiResult.pronunciation && (
                    <p className="text-sm text-muted mb-3 font-mono">/{aiResult.pronunciation}/</p>
                  )}
                  <p className="text-ink/80">{aiResult.definition}</p>
                </div>
              </label>
              {aiResult.content && (
                <details className="mt-3 ml-9">
                  <summary className="text-sm text-muted cursor-pointer hover:text-ink transition-colors">
                    Show full content
                  </summary>
                  <div className="mt-3 prose prose-sm prose-stone max-w-none border-t border-border pt-3">
                    <ReactMarkdown>{aiResult.content}</ReactMarkdown>
                  </div>
                </details>
              )}
            </div>
          )}

          {/* AI content notice */}
          {aiResult && (
            <p className="text-xs text-muted text-center">
              AI content (etymology, usage, related terms) is always included with saved words.
            </p>
          )}
        </div>
      )}
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds (no more references to `activeTab`)

**Step 3: Commit**

```bash
git add src/app/admin/create/page.tsx
git commit -m "Replace tabbed results with unified checklist UI"
```

---

### Task 4: Rewrite save logic — unified save function

**Files:**
- Modify: `src/app/admin/create/page.tsx`

**Step 1: Replace `addSelected` and `addAiWord` with a single `saveWord` function**

Remove both `addSelected()` (lines 94-139) and `addAiWord()` (lines 142-178). Replace with:

```tsx
  const totalSelected = selectedCount + (aiSelected ? 1 : 0);

  async function saveWord() {
    if (totalSelected === 0) return;
    setSaving(true);
    setError("");

    try {
      // Build definition text from selections
      const parts: string[] = [];
      let partOfSpeech: string | null = null;
      let pronunciation: string | null = null;

      // Collect MW definitions
      for (const [entryIdxStr, defIndices] of Object.entries(selected)) {
        const entry = results[Number(entryIdxStr)];
        if (!partOfSpeech) partOfSpeech = entry.partOfSpeech;
        if (!pronunciation) pronunciation = entry.pronunciation || null;
        const defs = Array.from(defIndices)
          .sort((a, b) => a - b)
          .map((idx) => entry.definitions[idx]);
        parts.push(...defs);
      }

      // Collect AI definition
      if (aiSelected && aiResult) {
        if (!partOfSpeech) partOfSpeech = aiResult.part_of_speech || null;
        if (!pronunciation) pronunciation = aiResult.pronunciation;
        parts.push(aiResult.definition);
      }

      // Prefer AI pronunciation when available
      if (aiResult?.pronunciation) {
        pronunciation = aiResult.pronunciation;
      }

      const definition =
        parts.length === 1
          ? parts[0]
          : parts.map((d, i) => `${i + 1}. ${d}`).join("\n");

      // Determine source
      let source: string;
      if (selectedCount > 0 && aiSelected) {
        source = "combined";
      } else if (aiSelected) {
        source = "claude";
      } else {
        source = "merriam-webster";
      }

      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: aiResult?.word || results[0]?.word || query,
          definition,
          part_of_speech: partOfSpeech,
          pronunciation,
          source,
          content: aiResult?.content || null,
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
        setAiSelected(false);
      }
    } catch {
      setError("Failed to save word.");
    } finally {
      setSaving(false);
    }
  }
```

**Step 2: Update the save button**

Remove the old `selectedCount > 0` sticky button block. Add a new save button after the results section (after the AI content notice `</p>` closing, before the final `</div>`):

```tsx
          {/* Save button */}
          {totalSelected > 0 && (
            <div className="sticky bottom-6 flex justify-center pt-4">
              <button
                onClick={saveWord}
                disabled={saving}
                className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors font-medium shadow-lg disabled:opacity-50"
              >
                {saving ? "Adding…" : `Add to Lexicon (${totalSelected} selected)`}
              </button>
            </div>
          )}
```

**Step 3: Also reset `aiSelected` in `lookupWord()`**

In the `lookupWord` function, add `setAiSelected(false);` alongside the other reset calls (near line 37).

**Step 4: Update the `selectedCount` line**

The existing `selectedCount` line stays as-is. Add `totalSelected` right after it (this was shown in the function above).

**Step 5: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/app/admin/create/page.tsx
git commit -m "Unify save logic for MW + AI definition selection"
```

---

### Task 5: Update subtitle text

**Files:**
- Modify: `src/app/admin/create/page.tsx`

**Step 1: Update the page subtitle**

Change line 186:
```tsx
<p className="text-muted text-sm">
  Search Merriam-Webster, pick a definition, and add it to your lexicon.
</p>
```

To:
```tsx
<p className="text-muted text-sm">
  Look up a word, pick definitions from Merriam-Webster and AI, and add it to your lexicon.
</p>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/admin/create/page.tsx
git commit -m "Update create page subtitle for unified lookup"
```

---

### Task 6: Manual smoke test

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test the flow**

1. Navigate to `/admin` and log in
2. Go to `/admin/create`
3. Search for a word (e.g., "grace")
4. Verify: MW definitions appear with "MW" badges and checkboxes
5. Verify: AI definition appears with "AI" badge and checkbox
6. Verify: AI content preview is expandable
7. Check some MW definitions + the AI definition
8. Click "Add to Lexicon"
9. Verify: Word saved with combined definition and AI content

**Step 3: Test edge cases**

- Search a word with no MW match but AI result → only AI checkbox shows
- Check only MW defs → saved with source "merriam-webster" but AI content attached
- Check only AI def → saved with source "claude"

**Step 4: Commit any fixes if needed**
