"use client";

import { useEffect, useRef } from "react";
import type { Sentence } from "@/lib/types";
import type { TimedWord } from "@/lib/words";

export type ExplainState = {
  loading: boolean;
  text?: string;
  error?: string;
};

type Props = {
  sentences: Sentence[];
  wordsBySentence: TimedWord[][];
  translations: string[];
  translationsLoaded: boolean;
  activeSentenceId: number | null;
  activeWordIndex: number | null;
  repeatId: number | null;
  onToggleRepeat: (id: number) => void;
  onSeekSentence: (sentence: Sentence) => void;
  onWordClick: (rawWord: string) => void;
  explainState: Record<number, ExplainState>;
  onExplain: (sentence: Sentence) => void;
};

export default function TranscriptPanel({
  sentences,
  wordsBySentence,
  translations,
  translationsLoaded,
  activeSentenceId,
  activeWordIndex,
  repeatId,
  onToggleRepeat,
  onSeekSentence,
  onWordClick,
  explainState,
  onExplain,
}: Props) {
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSentenceId]);

  return (
    <div className="divide-y divide-neutral-800">
      {sentences.map((sentence, i) => {
        const isActive = sentence.id === activeSentenceId;
        const isRepeating = sentence.id === repeatId;
        const translation = translations[i];
        const explain = explainState[sentence.id];

        return (
          <div
            key={sentence.id}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSeekSentence(sentence)}
            className={`px-4 py-3 cursor-pointer transition-colors ${
              isActive ? "bg-neutral-800" : "hover:bg-neutral-900"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-base leading-relaxed flex-1">
                {wordsBySentence[i]?.map((word, wi) => {
                  const highlight = isActive && wi === activeWordIndex;
                  return (
                    <span
                      key={wi}
                      onClick={(e) => {
                        e.stopPropagation();
                        onWordClick(word.text);
                      }}
                      className={`inline-block mr-1 rounded px-0.5 cursor-pointer hover:bg-neutral-700 ${
                        highlight ? "bg-emerald-500/30 ring-1 ring-emerald-400" : ""
                      }`}
                    >
                      {word.text}
                    </span>
                  );
                })}
              </p>
              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onToggleRepeat(sentence.id)}
                  title="Repeat this sentence"
                  className={`text-xs px-2 py-1 rounded border ${
                    isRepeating
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  {isRepeating ? "Repeating" : "Repeat"}
                </button>
                <button
                  onClick={() => onExplain(sentence)}
                  title="AI explanation"
                  className="text-xs px-2 py-1 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                >
                  Explain
                </button>
              </div>
            </div>

            <p className="text-sm text-neutral-400 mt-1">
              {translation
                ? translation
                : translationsLoaded
                ? "Translation failed"
                : "Translating..."}
            </p>

            {explain && (
              <div className="mt-2 text-sm rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2">
                {explain.loading && <span className="text-neutral-400">Generating explanation...</span>}
                {explain.error && <span className="text-amber-400">{explain.error}</span>}
                {explain.text && <span className="text-neutral-200 whitespace-pre-wrap">{explain.text}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
