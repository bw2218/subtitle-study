import { NextRequest, NextResponse } from "next/server";
import type { Sentence } from "@/lib/types";
import { fetchVideoTitle } from "@/lib/youtubeMeta";

type SupadataSegment = {
  text: string;
  offset: number; // ms
  duration: number; // ms
};

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId가 필요해요." }, { status: 400 });
  }

  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "자막 자동 추출 키가 아직 설정되지 않았어요. 아래에 자막을 직접 붙여넣어주세요." },
      { status: 501 }
    );
  }

  try {
    const res = await fetch(
      `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`
      )}`,
      { headers: { "x-api-key": apiKey } }
    );

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: `자막을 가져오지 못했어요 (${res.status}). 아래에 자막을 직접 붙여넣어주세요. ${body.slice(0, 150)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const segments: SupadataSegment[] = data.content ?? [];
    if (segments.length === 0) {
      return NextResponse.json(
        { error: "이 영상에는 자막이 없는 것 같아요. 아래에 자막을 직접 붙여넣어주세요." },
        { status: 404 }
      );
    }

    const sentences: Sentence[] = segments.map((seg, i) => ({
      id: i,
      start: seg.offset / 1000,
      end: (seg.offset + seg.duration) / 1000,
      text: seg.text,
    }));

    const title = await fetchVideoTitle(videoId);

    return NextResponse.json({ videoId, title: title ?? "", sentences });
  } catch (err) {
    const message = err instanceof Error ? err.message : "자막을 가져오는 중 오류가 발생했어요.";
    return NextResponse.json({ error: `${message} 아래에 자막을 직접 붙여넣어주세요.` }, { status: 500 });
  }
}
