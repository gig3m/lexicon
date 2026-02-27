import type { Metadata } from "next";
import "./globals.css";
import CommandPalette from "@/components/CommandPalette";

export const metadata: Metadata = {
  title: "Lexicon — Personal Word Collection",
  description: "A curated collection of words and their definitions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-serif text-2xl tracking-tight text-ink hover:text-accent transition-colors">
              Lexicon
            </a>
            <nav className="flex gap-6 text-sm text-muted">
              <a href="/" className="hover:text-ink transition-colors">Index</a>
              <a href="/admin" className="hover:text-ink transition-colors">Admin</a>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-muted border border-border rounded bg-parchment">
                ⌘K
              </kbd>
            </nav>
          </div>
        </header>
        <CommandPalette />
        <main className="max-w-4xl mx-auto px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
