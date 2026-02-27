"use client";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface AlphabetBarProps {
  activeLetters: Set<string>;
}

export default function AlphabetBar({ activeLetters }: AlphabetBarProps) {
  return (
    <nav className="sticky top-0 z-10 bg-parchment border-b border-border py-2 mb-6 -mx-4 px-4">
      <div className="flex justify-center gap-1 flex-wrap">
        {LETTERS.map((letter) => {
          const active = activeLetters.has(letter);
          return active ? (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-8 h-8 flex items-center justify-center text-sm font-medium rounded hover:bg-accent hover:text-white transition-colors text-accent"
            >
              {letter}
            </a>
          ) : (
            <span
              key={letter}
              className="w-8 h-8 flex items-center justify-center text-sm text-muted/40 cursor-default"
            >
              {letter}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
