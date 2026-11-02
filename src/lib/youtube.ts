export function parseVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id.length === 11 ? id : null;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id && id.length === 11 ? id : null;
      }
      const shortsMatch = url.pathname.match(/\/(shorts|embed|live)\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[2];
    }
  } catch {
    // not a URL
  }
  return null;
}
