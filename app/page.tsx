"use client";

import { useState } from "react";

interface MoodResult {
  mood: string;
  insight: string;
  encouragement: string;
}

export default function Home() {
  const [entry, setEntry] = useState("");
  const [result, setResult] = useState<MoodResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
    } else {
      setResult(data);
    }

    setLoading(false);
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📓</div>
          <h1 className="text-3xl font-bold text-gray-800">AI Mood Journal</h1>
          <p className="text-gray-500 mt-1 text-sm">{today}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
            <textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="How was your day? Write freely — what happened, how you feel, what's on your mind..."
              className="w-full h-44 p-4 text-gray-700 placeholder-gray-400 resize-none rounded-2xl focus:outline-none text-base leading-relaxed"
              maxLength={2000}
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-xs text-gray-400">{entry.length}/2000</span>
              <button
                type="submit"
                disabled={loading || entry.trim().length < 10}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
              >
                {loading ? "Analyzing..." : "Analyze Mood"}
              </button>
            </div>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 animate-in fade-in">
            <div className="text-center">
              <div className="text-4xl font-semibold text-gray-800">
                {result.mood}
              </div>
            </div>

            <div className="border-t border-gray-50 pt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-1">
                  What I notice
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {result.insight}
                </p>
              </div>

              <div className="bg-indigo-50 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-indigo-400 uppercase tracking-wide mb-1">
                  Encouragement
                </p>
                <p className="text-indigo-800 text-sm leading-relaxed">
                  {result.encouragement}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setResult(null);
                setEntry("");
              }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
            >
              Write another entry
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Your entries are never stored. Powered by Ringo Innovations.
        </p>
      </div>
    </main>
  );
}