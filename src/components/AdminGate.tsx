"use client";

import { useState, useEffect } from "react";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already authenticated via cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("admin_token="))
      ?.split("=")[1];

    if (token) {
      verifyToken(token);
    } else {
      setChecking(false);
    }
  }, []);

  async function verifyToken(token: string) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      setAuthenticated(true);
    }
    setChecking(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const { token } = await res.json();
      // Set cookie for 7 days
      document.cookie = `admin_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
      setAuthenticated(true);
    } else {
      setError("Incorrect password.");
    }
  }

  if (checking) {
    return <p className="text-muted text-center py-20">Checking access…</p>;
  }

  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto py-20">
        <h1 className="font-serif text-3xl mb-6 text-center">Admin Access</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            autoFocus
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors font-medium"
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
