"use client";

import { useEffect, useRef } from "react";
import { loadYouTubeApi } from "@/lib/loadYouTubeApi";
import type { YTPlayer } from "@/types/youtube-iframe";

type Props = {
  videoId: string;
  onReady: (player: YTPlayer) => void;
};

export default function YouTubePlayer({ videoId, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let destroyed = false;

    loadYouTubeApi().then(() => {
      if (destroyed || !containerRef.current || !window.YT) return;
      const player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            onReady(e.target);
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      destroyed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
