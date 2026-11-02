"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseVideoId } from "@/lib/youtube";
import { parseTranscript } from "@/lib/parseTranscript";
import { saveTranscript } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const videoId = parseVideoId(url);
    if (!videoId) {
      setError("유튜브 링크를 다시 확인해주세요.");
      return;
    }
    const sentences = parseTranscript(transcript);
    if (sentences.length === 0) {
      setError("자막을 읽지 못했어요. 아래 방법대로 다시 복사해서 붙여넣어주세요.");
      return;
    }
    saveTranscript(videoId, { title: "", sentences, savedAt: Date.now() });
    router.push(`/watch/${videoId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 px-4 py-10">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold mb-2 text-center">자막 영어 스터디</h1>
        <p className="text-neutral-400 text-center mb-8 text-sm">
          유튜브 링크 + 자막을 넣으면 문장별로 공부할 수 있어요.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-neutral-300 mb-1 block">1. 유튜브 링크</label>
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
          </div>

          <div>
            <label className="text-sm text-neutral-300 mb-1 block">2. 자막 붙여넣기</label>
            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                setError("");
              }}
              placeholder={"0:00\nso welcome to this video\n0:03\ntoday we're going to talk about..."}
              rows={8}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 px-4 py-3 text-xs text-neutral-400 leading-relaxed">
            <p className="text-neutral-300 font-medium mb-1">자막 복사하는 방법</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>유튜브에서 영상을 열고, 설명란 아래 &quot;⋯ 더보기&quot; 또는 &quot;스크립트 표시&quot; 버튼을 눌러요.</li>
              <li>열린 자막 패널 안을 클릭하고 Ctrl+A(전체선택) → Ctrl+C(복사)를 눌러요.</li>
              <li>여기 위 칸에 Ctrl+V로 붙여넣어요.</li>
            </ol>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors py-3 font-medium"
          >
            시작하기
          </button>
        </form>
      </div>
    </div>
  );
}
