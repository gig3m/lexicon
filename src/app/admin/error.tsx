"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-20">
      <h1 className="font-serif text-2xl mb-2">Admin Error</h1>
      <p className="text-muted mb-6">
        {error.message || "Something went wrong in the admin panel."}
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
