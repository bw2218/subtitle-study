import { NextRequest, NextResponse } from "next/server";
import { fetchVideoTitle } from "@/lib/youtubeMeta";

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId is required." }, { status: 400 });
  }
  const title = await fetchVideoTitle(videoId);
  return NextResponse.json({ title });
}
