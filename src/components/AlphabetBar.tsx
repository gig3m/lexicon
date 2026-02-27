"use client";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface AlphabetBarProps {
  activeLetters: Set<string>;
}

export default function AlphabetBar({ activeLetters }: AlphabetBarProps) {
  return (
    <nav className="sticky top-[58px] z-10 bg-parchment border-b border-border py-2 mb-6">
      <div className="flex justify-between">
        {LETTERS.map((letter) => {
          const active = activeLetters.has(letter);
          return active ? (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="flex-1 h-8 flex items-center justify-center text-sm font-medium rounded hover:bg-accent hover:text-white transition-colors text-accent"
            >
              {letter}
            </a>
          ) : (
            <span
              key={letter}
              className="flex-1 h-8 flex items-center justify-center text-sm text-muted/40 cursor-default"
            >
              {letter}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
