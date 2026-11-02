type DictEntry = {
  phonetic?: string;
  phonetics?: { text?: string; audio?: string }[];
};

export async function fetchIpa(word: string): Promise<string | null> {
  if (!word) return null;
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) return null;
    const data: DictEntry[] = await res.json();
    for (const entry of data) {
      const uk = entry.phonetics?.find((p) => p.audio?.toLowerCase().includes("uk") && p.text);
      if (uk?.text) return uk.text;
    }
    for (const entry of data) {
      const withText = entry.phonetics?.find((p) => p.text);
      if (withText?.text) return withText.text;
    }
    const first = data.find((e) => e.phonetic);
    return first?.phonetic ?? null;
  } catch {
    return null;
  }
}
