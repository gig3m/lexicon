"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Word } from "@/lib/types";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch words on first open
  useEffect(() => {
    if (!open || loaded) return;

    let mounted = true;

    async function fetchWords() {
      const { data } = await supabase
        .from("words")
        .select("*")
        .order("word", { ascending: true });
      if (!mounted) return;
      if (data) {
        setWords(data);
        setLoaded(true);
      }
    }
    fetchWords();

    return () => {
      mounted = false;
    };
  }, [open, loaded]);

  const selectWord = useCallback(
    (word: string) => {
      setOpen(false);
      router.push(`/word/${encodeURIComponent(word)}`);
    },
    [router]
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search your lexicon"
      className="fixed inset-0 z-50"
    >
      <DialogTitle className="sr-only">Search your lexicon</DialogTitle>
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
        <Command.Input
          placeholder="Search your lexicon…"
          className="w-full px-4 py-3 border-b border-border bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 text-base"
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="px-4 py-8 text-center text-muted text-sm">
            No words found.
          </Command.Empty>
          {words.map((word) => (
            <Command.Item
              key={word.id}
              value={word.word}
              onSelect={() => selectWord(word.word)}
              className="px-3 py-2 rounded-lg cursor-pointer text-ink data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent transition-colors"
            >
              <span className="font-serif font-semibold">{word.word}</span>
            </Command.Item>
          ))}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
