import type { Sentence } from "./types";

export type StoredTranscript = {
  title: string;
  sentences: Sentence[];
  savedAt: number;
};

function key(videoId: string): string {
  return `subtitle-study:${videoId}`;
}

export function saveTranscript(videoId: string, data: StoredTranscript) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(videoId), JSON.stringify(data));
  } catch {
    // storage full or unavailable; ignore
  }
}

export function loadTranscript(videoId: string): StoredTranscript | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(videoId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredTranscript;
  } catch {
    return null;
  }
}
