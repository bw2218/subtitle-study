"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import YouTubePlayer from "@/components/YouTubePlayer";
import TranscriptPanel, { ExplainState } from "@/components/TranscriptPanel";
import type { YTPlayer } from "@/types/youtube-iframe";
import type { Sentence, TranscriptResponse } from "@/lib/types";
import { splitWords, normalizeWord, TimedWord } from "@/lib/words";
import { fetchIpa } from "@/lib/dictionary";
import { loadTranscript, saveTranscript } from "@/lib/storage";
import { parseTranscript } from "@/lib/parseTranscript";

const RATES = [0.5, 0.75, 1, 1.25, 1.5];

export default function WatchPage() {
  const params = useParams<{ videoId: string }>();
  const videoId = params.videoId;

  const [title, setTitle] = useState("");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const [translations, setTranslations] = useState<string[]>([]);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  const [player, setPlayer] = useState<YTPlayer | null>(null);
  const [rate, setRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [repeatId, setRepeatId] = useState<number | null>(null);
  const repeatIdRef = useRef<number | null>(null);

  const [selectedWord, setSelectedWord] = useState<{ word: string; ipa: string | null; loading: boolean } | null>(
    null
  );
  const ipaCache = useRef<Map<string, string | null>>(new Map());

  const [explainState, setExplainState] = useState<Record<number, ExplainState>>({});
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState("");

  // load transcript: try the local cache first, then auto-fetch, else fall back to manual paste
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    const stored = loadTranscript(videoId);
    if (stored && stored.sentences.length > 0) {
      setTitle(stored.title);
      setSentences(stored.sentences);
      setLoading(false);
      return;
    }

    fetch(`/api/transcript?videoId=${encodeURIComponent(videoId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn't fetch the transcript.");
        return data as TranscriptResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setTitle(data.title);
        setSentences(data.sentences);
        saveTranscript(videoId, { title: data.title, sentences: data.sentences, savedAt: Date.now() });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Couldn't fetch the transcript automatically.");
        fetch(`/api/title?videoId=${encodeURIComponent(videoId)}`)
          .then((res) => res.json())
          .then((data) => {
            if (!cancelled && data.title) setTitle(data.title);
          })
          .catch(() => {});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseTranscript(pasteText);
    if (parsed.length === 0) {
      setPasteError("Couldn't read that transcript. Please check the format.");
      return;
    }
    setSentences(parsed);
    setLoadError("");
    saveTranscript(videoId, { title, sentences: parsed, savedAt: Date.now() });
  }

  // fetch translations once sentences are ready
  useEffect(() => {
    if (sentences.length === 0) return;
    let cancelled = false;
    setTranslationsLoaded(false);
    fetch("/api/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ texts: sentences.map((s) => s.text) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setTranslations(data.translations || []);
      })
      .catch(() => {
        if (!cancelled) setTranslations([]);
      })
      .finally(() => {
        if (!cancelled) setTranslationsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sentences]);

  const wordsBySentence = useMemo<TimedWord[][]>(
    () => sentences.map((s) => splitWords(s.text, s.start, s.end)),
    [sentences]
  );

  useEffect(() => {
    repeatIdRef.current = repeatId;
  }, [repeatId]);

  // playback loop
  useEffect(() => {
    if (!player) return;
    let raf = 0;
    let lastUpdate = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - lastUpdate < 120) return;
      lastUpdate = now;

      let t = 0;
      try {
        t = player.getCurrentTime();
      } catch {
        return;
      }
      setCurrentTime(t);

      const rId = repeatIdRef.current;
      if (rId != null) {
        const s = sentences.find((s) => s.id === rId);
        if (s && t >= s.end - 0.05) {
          player.seekTo(s.start, true);
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [player, sentences]);

  const activeSentence = useMemo(() => {
    for (let i = sentences.length - 1; i >= 0; i--) {
      if (currentTime >= sentences[i].start && currentTime < sentences[i].end) {
        return sentences[i];
      }
    }
    return null;
  }, [sentences, currentTime]);

  const activeWordIndex = useMemo(() => {
    if (!activeSentence) return null;
    const idx = sentences.findIndex((s) => s.id === activeSentence.id);
    const words = wordsBySentence[idx];
    if (!words) return null;
    for (let i = 0; i < words.length; i++) {
      if (currentTime >= words[i].start && currentTime < words[i].end) return i;
    }
    return words.length - 1;
  }, [activeSentence, sentences, wordsBySentence, currentTime]);

  const handleReady = useCallback((p: YTPlayer) => {
    setPlayer(p);
  }, []);

  function handleRateChange(r: number) {
    setRate(r);
    player?.setPlaybackRate(r);
  }

  function handleSeekSentence(sentence: Sentence) {
    player?.seekTo(sentence.start, true);
    player?.playVideo();
  }

  function handleToggleRepeat(id: number) {
    setRepeatId((prev) => (prev === id ? null : id));
  }

  async function handleWordClick(rawWord: string) {
    const key = normalizeWord(rawWord);
    if (!key) return;
    if (ipaCache.current.has(key)) {
      setSelectedWord({ word: rawWord, ipa: ipaCache.current.get(key) ?? null, loading: false });
      return;
    }
    setSelectedWord({ word: rawWord, ipa: null, loading: true });
    const ipa = await fetchIpa(key);
    ipaCache.current.set(key, ipa);
    setSelectedWord({ word: rawWord, ipa, loading: false });
  }

  async function handleExplain(sentence: Sentence) {
    setExplainState((prev) => ({ ...prev, [sentence.id]: { loading: true } }));
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sentence: sentence.text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExplainState((prev) => ({ ...prev, [sentence.id]: { loading: false, error: data.error } }));
        return;
      }
      setExplainState((prev) => ({ ...prev, [sentence.id]: { loading: false, text: data.explanation } }));
    } catch {
      setExplainState((prev) => ({
        ...prev,
        [sentence.id]: { loading: false, error: "Couldn't get the explanation." },
      }));
    }
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-neutral-800 shrink-0 overflow-x-auto">
        <Link href="/" className="text-neutral-400 hover:text-white text-sm shrink-0">
          ← Back
        </Link>
        <h1 className="text-sm font-medium truncate flex-1 min-w-[80px]">{title || "Loading..."}</h1>
        <div className="flex items-center gap-1 shrink-0">
          {RATES.map((r) => (
            <button
              key={r}
              onClick={() => handleRateChange(r)}
              className={`text-xs px-2 py-1 rounded ${
                rate === r ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 py-2 border-b border-neutral-800 shrink-0 text-sm min-h-[2.5rem] flex items-center">
        {selectedWord ? (
          <span>
            <span className="text-emerald-400 font-medium">{selectedWord.word}</span>{" "}
            {selectedWord.loading ? (
              <span className="text-neutral-500">Looking up pronunciation...</span>
            ) : selectedWord.ipa ? (
              <span className="text-neutral-300">{selectedWord.ipa}</span>
            ) : (
              <span className="text-neutral-500">Couldn&apos;t find a pronunciation</span>
            )}
          </span>
        ) : (
          <span className="text-neutral-500">Tap a word in the transcript to see its pronunciation here</span>
        )}
      </div>

      <div className="shrink-0 basis-[40vh] min-h-[200px] overflow-hidden">
        <YouTubePlayer videoId={videoId} onReady={handleReady} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && <p className="p-4 text-neutral-400 text-sm">Loading transcript...</p>}
        {!loading && loadError && sentences.length === 0 && (
          <form onSubmit={handlePasteSubmit} className="p-4 flex flex-col gap-3">
            <p className="text-amber-400 text-sm">{loadError}</p>
            <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 px-4 py-3 text-xs text-neutral-400 leading-relaxed">
              <p className="text-neutral-300 font-medium mb-1">How to copy the transcript</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Open this video on YouTube, and under the description click &quot;...more&quot; then &quot;Show transcript&quot;.</li>
                <li>Click inside the transcript panel, then press Ctrl+A (select all) and Ctrl+C (copy).</li>
                <li>Paste it below with Ctrl+V.</li>
              </ol>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.target.value);
                setPasteError("");
              }}
              placeholder={"0:00\nso welcome to this video\n0:03\ntoday we're going to talk about..."}
              rows={8}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm outline-none focus:border-emerald-500 font-mono"
            />
            {pasteError && <p className="text-red-400 text-sm">{pasteError}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors py-3 font-medium"
            >
              Start with this transcript
            </button>
          </form>
        )}
        {!loading && sentences.length > 0 && (
          <TranscriptPanel
            sentences={sentences}
            wordsBySentence={wordsBySentence}
            translations={translations}
            translationsLoaded={translationsLoaded}
            activeSentenceId={activeSentence?.id ?? null}
            activeWordIndex={activeWordIndex}
            repeatId={repeatId}
            onToggleRepeat={handleToggleRepeat}
            onSeekSentence={handleSeekSentence}
            onWordClick={handleWordClick}
            explainState={explainState}
            onExplain={handleExplain}
          />
        )}
      </div>
    </div>
  );
}
