"use client";

import { useState } from "react";
import type { MWDefinition } from "@/lib/types";

export default function CreateWordPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MWDefinition[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Record<number, Set<number>>>({});

  async function lookupWord(word?: string) {
    const searchWord = word || query;
    if (!searchWord.trim()) return;

    setSearching(true);
    setResults([]);
    setSuggestions([]);
    setError("");
    setSaved(false);
    setSelected({});

    try {
      const res = await fetch(`/api/dictionary?word=${encodeURIComponent(searchWord.trim())}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.definitions || []);
        setSuggestions(data.suggestions || []);
      }
    } catch {
      setError("Failed to look up word.");
    } finally {
      setSearching(false);
    }
  }

  function toggleDef(entryIdx: number, defIdx: number) {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[entryIdx] || []);
      if (set.has(defIdx)) {
        set.delete(defIdx);
      } else {
        set.add(defIdx);
      }
      if (set.size === 0) {
        delete next[entryIdx];
      } else {
        next[entryIdx] = set;
      }
      return next;
    });
  }

  const selectedCount = Object.values(selected).reduce((sum, s) => sum + s.size, 0);

  async function addSelected() {
    setSaving(true);
    setError("");

    try {
      for (const [entryIdxStr, defIndices] of Object.entries(selected)) {
        const entry = results[Number(entryIdxStr)];
        const defs = Array.from(defIndices)
          .sort((a, b) => a - b)
          .map((idx) => entry.definitions[idx]);
        const definition =
          defs.length === 1
            ? defs[0]
            : defs.map((d, i) => `${i + 1}. ${d}`).join("\n");

        const res = await fetch("/api/words", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: entry.word,
            definition,
            part_of_speech: entry.partOfSpeech,
            pronunciation: entry.pronunciation || null,
            source: "merriam-webster",
            notes: notes.trim() || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to save.");
          setSaving(false);
          return;
        }
      }

      setSaved(true);
      setQuery("");
      setResults([]);
      setNotes("");
      setSelected({});
    } catch {
      setError("Failed to save word.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-2">Add a Word</h1>
        <p className="text-muted text-sm">
          Search Merriam-Webster, pick a definition, and add it to your lexicon.
        </p>
      </div>

      {saved && (
        <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg text-accent text-sm">
          Word added to your lexicon!{" "}
          <a href="/admin/create" className="underline" onClick={() => setSaved(false)}>
            Add another
          </a>{" "}
          or{" "}
          <a href="/admin" className="underline">
            manage words
          </a>
        </div>
      )}

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookupWord();
        }}
        className="flex gap-3 mb-8"
      >
        <input
          type="text"
          placeholder="Type a word to look up…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg border border-border bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          autoFocus
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors font-medium disabled:opacity-50"
        >
          {searching ? "Looking up…" : "Look Up"}
        </button>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Suggestions (word not found) */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-muted mb-3">Word not found. Did you mean:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  lookupWord(s);
                }}
                className="px-3 py-1.5 bg-surface border border-border rounded-full text-sm hover:border-accent/50 hover:text-accent transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes field */}
      {results.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm text-muted mb-2">
            Personal notes (optional — added to whichever definition you select)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            rows={2}
            placeholder="Why this word matters to you, usage context, etc."
          />
        </div>
      )}

      {/* Results */}
      {results.map((entry, i) => (
        <div key={i} className="mb-6 bg-surface border border-border rounded-lg p-5">
          <div className="flex items-baseline gap-3 mb-1">
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

      {selectedCount > 0 && (
        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={addSelected}
            disabled={saving}
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? "Adding…" : `Add Selected (${selectedCount})`}
          </button>
        </div>
      )}
    </div>
  );
}
