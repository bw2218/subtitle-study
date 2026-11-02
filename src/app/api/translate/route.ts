import { NextRequest, NextResponse } from "next/server";

const CONCURRENCY = 8;
const TIMEOUT_MS = 8000;

async function translateOne(text: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(
      text
    )}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return "";
    const data = await res.json();
    const chunks = data?.[0];
    if (!Array.isArray(chunks)) return "";
    return chunks.map((c: unknown[]) => c?.[0] ?? "").join("");
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

async function translateAll(texts: string[]): Promise<string[]> {
  const results = new Array<string>(texts.length).fill("");
  let next = 0;

  async function worker() {
    while (next < texts.length) {
      const i = next++;
      results[i] = await translateOne(texts[i]);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, texts.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const texts = body?.texts;
  if (!Array.isArray(texts) || texts.some((t) => typeof t !== "string")) {
    return NextResponse.json({ error: "A texts array is required." }, { status: 400 });
  }
  if (texts.length > 1000) {
    return NextResponse.json({ error: "Too many sentences at once." }, { status: 400 });
  }
  const translations = await translateAll(texts);
  return NextResponse.json({ translations });
}
