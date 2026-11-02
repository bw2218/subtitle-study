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
      setError("유튜브 링크를 다시 확인해주세요.");
      return;
    }
    router.push(`/watch/${videoId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2 text-center">자막 영어 스터디</h1>
        <p className="text-neutral-400 text-center mb-8">
          유튜브 링크를 넣으면 자막을 보면서 공부할 수 있어요.
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
            시작하기
          </button>
        </form>
        <p className="text-neutral-500 text-xs text-center mt-6">
          영어 자막(CC)이 있는 영상만 지원돼요. 자동으로 안 가져와지면 직접 붙여넣을 수 있는 화면이 나와요.
        </p>
      </div>
    </div>
  );
}
