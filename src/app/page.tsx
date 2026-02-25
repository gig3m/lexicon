"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Word } from "@/lib/types";
import WordCard from "@/components/WordCard";
import SearchBar from "@/components/SearchBar";

export default function IndexPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [filtered, setFiltered] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWords() {
      const { data, error } = await supabase
        .from("words")
        .select("*")
        .order("word", { ascending: true });

      if (error) {
        setFetchError(error.message);
      } else if (data) {
        setWords(data);
        setFiltered(data);
      }
      setLoading(false);
    }
    fetchWords();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(words);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      words.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.definition.toLowerCase().includes(q)
      )
    );
  }, [search, words]);

  // Group words by first letter
  const grouped = filtered.reduce<Record<string, Word[]>>((acc, word) => {
    const letter = word.word[0]?.toUpperCase() || "#";
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(word);
    return acc;
  }, {});

  const letters = Object.keys(grouped).sort();

  if (loading) {
    return <p className="text-muted text-center py-20">Loading lexicon…</p>;
  }

  return (
    <div>
      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Failed to load words: {fetchError}
        </div>
      )}
      <div className="mb-8">
        <h1 className="font-serif text-4xl mb-2">Word Index</h1>
        <p className="text-muted">
          {words.length} {words.length === 1 ? "word" : "words"} collected
        </p>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      {letters.length === 0 ? (
        <p className="text-muted text-center py-12">
          {words.length === 0
            ? "No words yet. Add some from the admin panel."
            : "No words match your search."}
        </p>
      ) : (
        <div className="space-y-10">
          {letters.map((letter) => (
            <section key={letter}>
              <h2 className="font-serif text-3xl text-accent border-b border-border pb-2 mb-4">
                {letter}
              </h2>
              <div className="space-y-4">
                {grouped[letter].map((word) => (
                  <WordCard key={word.id} word={word} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
