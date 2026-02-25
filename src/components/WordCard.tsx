import type { Word } from "@/lib/types";

export default function WordCard({ word }: { word: Word }) {
  return (
    <div className="bg-surface rounded-lg border border-border p-5 hover:border-accent/30 transition-colors">
      <div className="flex items-baseline gap-3 mb-1">
        <h3 className="font-serif text-xl font-semibold">{word.word}</h3>
        {word.part_of_speech && (
          <span className="text-xs italic text-muted">{word.part_of_speech}</span>
        )}
      </div>
      {word.pronunciation && (
        <p className="text-sm text-muted mb-2 font-mono">/{word.pronunciation}/</p>
      )}
      <p className="text-ink/80 leading-relaxed">{word.definition}</p>
      {word.notes && (
        <p className="mt-3 text-sm text-muted italic border-t border-border/50 pt-3">
          {word.notes}
        </p>
      )}
    </div>
  );
}
