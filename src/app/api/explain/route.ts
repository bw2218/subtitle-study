import { NextRequest, NextResponse } from "next/server";

const MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The AI key hasn't been set up yet. This feature will work once it is." },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => null);
  const sentence = body?.sentence;
  if (typeof sentence !== "string" || !sentence.trim()) {
    return NextResponse.json({ error: "sentence is required." }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `영어 학습자를 위해 아래 문장을 한국어로 쉽게 설명해줘. 문법 구조, 핵심 표현/숙어, 뉘앙스를 짧고 친절하게 설명해줘. 설명만 출력하고 다른 말은 하지 마.\n\n문장: "${sentence}"`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `AI call failed: ${res.status} ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const explanation = data?.content?.[0]?.text ?? "";
    return NextResponse.json({ explanation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
