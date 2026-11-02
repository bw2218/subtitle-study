import type { Sentence } from "./types";

const TIME_ONLY = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
const TIME_PREFIX = /^((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(\S.*)$/;

function parseTimeToSeconds(t: string): number {
  return t.split(":").reduce((sec, part) => sec * 60 + Number(part), 0);
}

type RawCue = { start: number; text: string };

function parseCues(raw: string): RawCue[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const cues: RawCue[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (TIME_ONLY.test(line)) {
      const start = parseTimeToSeconds(line);
      i++;
      const textParts: string[] = [];
      while (i < lines.length && !TIME_ONLY.test(lines[i]) && !TIME_PREFIX.test(lines[i])) {
        textParts.push(lines[i]);
        i++;
      }
      if (textParts.length > 0) cues.push({ start, text: textParts.join(" ") });
      continue;
    }

    const m = line.match(TIME_PREFIX);
    if (m) {
      cues.push({ start: parseTimeToSeconds(m[1]), text: m[2] });
      i++;
      continue;
    }

    i++;
  }
  return cues;
}

export function parseTranscript(raw: string): Sentence[] {
  const cues = parseCues(raw).sort((a, b) => a.start - b.start);
  const sentences: Sentence[] = [];
  for (let i = 0; i < cues.length; i++) {
    const cur = cues[i];
    const next = cues[i + 1];
    const fallbackDuration = Math.max(2, Math.min(6, cur.text.length * 0.06));
    const end = next ? Math.max(next.start, cur.start + 0.3) : cur.start + fallbackDuration;
    sentences.push({ id: i, start: cur.start, end, text: cur.text });
  }
  return sentences;
}
