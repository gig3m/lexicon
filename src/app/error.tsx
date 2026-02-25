"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-20">
      <h1 className="font-serif text-2xl mb-2">Something went wrong</h1>
      <p className="text-muted mb-6">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors text-sm"
      >
        Try again
      </button>
    </div>
  );
}
