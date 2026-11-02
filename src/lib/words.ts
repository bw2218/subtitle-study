export type TimedWord = {
  text: string;
  start: number;
  end: number;
};

export function splitWords(text: string, start: number, end: number): TimedWord[] {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const weights = tokens.map((t) => Math.max(t.length, 2));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const duration = Math.max(end - start, 0.1);

  let cursor = start;
  return tokens.map((token, i) => {
    const wordDuration = (weights[i] / totalWeight) * duration;
    const wStart = cursor;
    const wEnd = cursor + wordDuration;
    cursor = wEnd;
    return { text: token, start: wStart, end: wEnd };
  });
}

export function normalizeWord(token: string): string {
  return token.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/gi, "");
}
