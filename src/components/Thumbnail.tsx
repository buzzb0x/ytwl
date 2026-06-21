import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/duration";
import type { Video } from "@/types";

interface ThumbnailProps {
  video: Video;
  compact: boolean;
}

export function Thumbnail({ video, compact }: ThumbnailProps) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-[#111]",
        compact ? "w-[140px] h-[82px]" : "w-full aspect-video",
      )}
    >
      {!imgErr && video.thumbnail_url ? (
        <img
          src={video.thumbnail_url}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover block"
        />
      ) : (
        <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
          <Play size={24} className="opacity-20" />
        </div>
      )}
      <div className="absolute bottom-1 right-1 bg-black/85 text-white font-mono text-[11px] px-[5px] py-px rounded-[3px]">
        {formatDuration(video.duration)}
      </div>
    </div>
  );
}
