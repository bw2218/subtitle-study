"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseVideoId } from "@/lib/youtube";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const videoId = parseVideoId(url);
    if (!videoId) {
      setError("Please check the YouTube link and try again.");
      return;
    }
    router.push(`/watch/${videoId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2 text-center">Subtitle English Study</h1>
        <p className="text-neutral-400 text-center mb-8">
          Paste a YouTube link and study the video sentence by sentence.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors py-3 font-medium"
          >
            Start
          </button>
        </form>
        <p className="text-neutral-500 text-xs text-center mt-6">
          Works best with videos that have English captions (CC). If it can&apos;t be fetched automatically, you&apos;ll get a screen to paste the transcript yourself.
        </p>
      </div>
    </div>
  );
}
