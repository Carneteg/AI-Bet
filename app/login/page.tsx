"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const password = inputRef.current?.value ?? "";

    const res = await fetch(`/api/auth?from=${encodeURIComponent(from)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      redirect: "follow",
    });

    if (res.ok || res.redirected) {
      window.location.href = res.url || from;
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError((data as { error?: string }).error ?? "Fel lösenord.");
    setLoading(false);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2">
            <span className="text-gradient">Stryktips Analys</span>
          </h1>
          <p className="text-slate-500 text-sm">Ange lösenord för att fortsätta</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-card border border-slate-700 rounded-2xl p-8 space-y-4"
        >
          <div>
            <label htmlFor="password" className="block text-sm text-slate-400 mb-2">
              Lösenord
            </label>
            <input
              ref={inputRef}
              id="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-surface border border-slate-600 focus:border-brand focus:outline-none rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 transition"
            />
          </div>

          {error && (
            <p className="text-accent-red text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark transition px-6 py-3 rounded-xl font-semibold text-white shadow-lg shadow-brand/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loggar in..." : "Logga in"}
          </button>
        </form>
      </div>
    </div>
  );
}
