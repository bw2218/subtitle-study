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
    return NextResponse.json({ error: "videoId is required." }, { status: 400 });
  }

  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Automatic transcript fetching isn't set up yet. Please paste the transcript below." },
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
        { error: `Couldn't fetch the transcript (${res.status}). Please paste it below. ${body.slice(0, 150)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const segments: SupadataSegment[] = data.content ?? [];
    if (segments.length === 0) {
      return NextResponse.json(
        { error: "This video doesn't seem to have a transcript. Please paste it below." },
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
    const message = err instanceof Error ? err.message : "Something went wrong while fetching the transcript.";
    return NextResponse.json({ error: `${message} Please paste it below.` }, { status: 500 });
  }
}
