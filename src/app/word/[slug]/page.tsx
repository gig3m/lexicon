import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase-server";
import type { Word } from "@/lib/types";
import Markdown from "react-markdown";
import Link from "next/link";

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("words")
    .select("*")
    .ilike("word", decodeURIComponent(slug))
    .limit(1)
    .single();

  if (!data) {
    notFound();
  }

  const word = data as Word;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/"
        className="text-sm text-muted hover:text-accent transition-colors mb-6 inline-block"
      >
        ← Back to Lexicon
      </Link>

      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="font-serif text-4xl font-semibold">{word.word}</h1>
          {word.part_of_speech && (
            <span className="text-sm italic text-muted">
              {word.part_of_speech}
            </span>
          )}
        </div>
        {word.pronunciation && (
          <p className="text-muted font-mono">/{word.pronunciation}/</p>
        )}
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xs uppercase tracking-wide text-muted mb-3">
          Definition
        </h2>
        <p className="text-ink/80 leading-relaxed whitespace-pre-line">
          {word.definition}
        </p>
      </div>

      {word.notes && (
        <div className="bg-surface border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xs uppercase tracking-wide text-muted mb-3">
            Notes
          </h2>
          <p className="text-ink/70 italic">{word.notes}</p>
        </div>
      )}

      {word.content && (
        <div className="bg-surface border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xs uppercase tracking-wide text-muted mb-3">
            Content
          </h2>
          <div className="prose prose-sm prose-stone max-w-none">
            <Markdown>{word.content}</Markdown>
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        Source: {word.source} · Added{" "}
        {new Date(word.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
