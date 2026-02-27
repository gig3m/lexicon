"use client";

import { useEffect, useState } from "react";
import type { Word } from "@/lib/types";
import AlphabetBar from "@/components/AlphabetBar";

export default function AdminPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ word: "", definition: "", part_of_speech: "", pronunciation: "", notes: "", content: "" });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchWords();
  }, []);

  async function fetchWords() {
    setFetchError(null);
    try {
      const res = await fetch("/api/words");
      if (!res.ok) {
        const err = await res.json();
        setFetchError(err.error || "Failed to load words");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setWords(data);
    } catch {
      setFetchError("Failed to connect to server");
    }
    setLoading(false);
  }

  function startEdit(word: Word) {
    setEditing(word.id);
    setEditForm({
      word: word.word,
      definition: word.definition,
      part_of_speech: word.part_of_speech || "",
      pronunciation: word.pronunciation || "",
      notes: word.notes || "",
      content: word.content || "",
    });
  }

  async function saveEdit(id: string) {
    setActionError(null);
    try {
      const res = await fetch("/api/words", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      });
      if (!res.ok) {
        const err = await res.json();
        setActionError(err.error || "Failed to save changes");
        return;
      }
      setEditing(null);
      fetchWords();
    } catch {
      setActionError("Failed to connect to server");
    }
  }

  async function deleteWord(id: string) {
    if (!confirm("Delete this word?")) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/words?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        setActionError(err.error || "Failed to delete word");
        return;
      }
      fetchWords();
    } catch {
      setActionError("Failed to connect to server");
    }
  }

  if (loading) {
    return <p className="text-muted text-center py-20">Loading…</p>;
  }

  return (
    <div>
      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {fetchError}
        </div>
      )}
      {actionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 ml-4 text-xs font-medium">
            Dismiss
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl">Manage Lexicon</h1>
          <p className="text-muted text-sm mt-1">{words.length} words</p>
        </div>
        <a
          href="/admin/create"
          className="px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors font-medium text-sm"
        >
          + Add Word
        </a>
      </div>

      {words.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg mb-2">Your lexicon is empty.</p>
          <a href="/admin/create" className="text-accent hover:underline">
            Add your first word →
          </a>
        </div>
      ) : (() => {
        const grouped = words.reduce<Record<string, Word[]>>((acc, w) => {
          const letter = w.word[0]?.toUpperCase() || "#";
          if (!acc[letter]) acc[letter] = [];
          acc[letter].push(w);
          return acc;
        }, {});
        const sortedLetters = Object.keys(grouped).sort();
        return (
          <>
            <AlphabetBar activeLetters={new Set(sortedLetters)} />
            <div className="space-y-8">
              {sortedLetters.map((letter) => (
                <section key={letter}>
                  <h2 id={`letter-${letter}`} className="font-serif text-2xl text-accent border-b border-border pb-2 mb-3 scroll-mt-32">
                    {letter}
                  </h2>
                  <div className="space-y-3">
                    {grouped[letter].map((word) => (
            <div key={word.id} className="bg-surface border border-border rounded-lg p-4">
              {editing === word.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={editForm.word}
                      onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                      className="px-3 py-2 border border-border rounded bg-parchment text-sm"
                      placeholder="Word"
                    />
                    <input
                      value={editForm.part_of_speech}
                      onChange={(e) => setEditForm({ ...editForm, part_of_speech: e.target.value })}
                      className="px-3 py-2 border border-border rounded bg-parchment text-sm"
                      placeholder="Part of speech"
                    />
                  </div>
                  <input
                    value={editForm.pronunciation}
                    onChange={(e) => setEditForm({ ...editForm, pronunciation: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-parchment text-sm"
                    placeholder="Pronunciation"
                  />
                  <textarea
                    value={editForm.definition}
                    onChange={(e) => setEditForm({ ...editForm, definition: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-parchment text-sm"
                    rows={2}
                    placeholder="Definition"
                  />
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-parchment text-sm"
                    rows={2}
                    placeholder="Personal notes"
                  />
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-parchment text-sm font-mono"
                    rows={6}
                    placeholder="Markdown content (optional)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(word.id)}
                      className="px-4 py-1.5 bg-accent text-white rounded text-sm hover:bg-accent-light transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-1.5 border border-border rounded text-sm hover:bg-surface-hover transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif font-semibold">{word.word}</span>
                      {word.part_of_speech && (
                        <span className="text-xs italic text-muted">{word.part_of_speech}</span>
                      )}
                    </div>
                    <p className="text-sm text-ink/70 mt-1 line-clamp-2">{word.definition}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(word)}
                      className="px-3 py-1 text-xs border border-border rounded hover:bg-surface-hover transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteWord(word.id)}
                      className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
}
