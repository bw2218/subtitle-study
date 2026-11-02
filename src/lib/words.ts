export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function normalizeWord(token: string): string {
  return token.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/gi, "");
}
