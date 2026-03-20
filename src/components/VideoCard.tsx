import { useState } from "react";
import { X, ArrowLeftRight, Check } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Thumbnail } from "./Thumbnail";
import type { Video } from "@/types";

const cardVariants = cva(
  "flex relative rounded-lg overflow-hidden border transition-all duration-200 cursor-default",
  {
    variants: {
      state: {
        selected: "bg-accent/8 border-accent/45",
        hovered: "bg-white/6 border-accent/50 -translate-y-px",
        default: "bg-white/3 border-white/7",
      },
      layout: {
        grid: "flex-col",
        list: "flex-row",
      },
    },
    defaultVariants: {
      state: "default",
      layout: "grid",
    },
  },
);

const checkboxVariants = cva(
  "absolute top-1.5 left-1.5 z-[5] w-[18px] h-[18px] rounded-[4px] flex items-center justify-center cursor-pointer",
  {
    variants: {
      selected: {
        true: "bg-accent border border-accent",
        false: "bg-black/75 border border-white/30",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export interface VideoCardProps {
  video: Video;
  compact: boolean;
  onRemove: (video: Video) => void;
  selected: boolean;
  onToggleSelect: (video: Video) => void;
  anySelected: boolean;
  fillMode: boolean;
  onSwap: (video: Video) => void;
}

export function VideoCard({
  video,
  compact,
  onRemove,
  selected,
  onToggleSelect,
  anySelected,
  fillMode,
  onSwap,
}: VideoCardProps) {
  const [hovered, setHovered] = useState(false);
  const showCheckbox = hovered || anySelected;

  return (
    <div
      className={cardVariants({
        state: selected ? "selected" : hovered ? "hovered" : "default",
        layout: compact ? "list" : "grid",
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showCheckbox && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(video);
          }}
          title={selected ? "Deselect" : "Select for playlist"}
          className={checkboxVariants({ selected })}
        >
          {selected && <Check size={10} className="text-white" />}
        </div>
      )}

      {hovered && (
        <div className="absolute top-1.5 right-1.5 z-[5] flex gap-1">
          {fillMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwap(video);
              }}
              title="Swap for another video"
              className="bg-black/75 border border-white/15 rounded-[4px] text-[#aaa] w-[22px] h-[22px] flex items-center justify-center cursor-pointer p-0"
            >
              <ArrowLeftRight size={13} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(video);
            }}
            title="Remove video"
            className="bg-black/75 border border-white/15 rounded-[4px] text-accent w-[22px] h-[22px] flex items-center justify-center cursor-pointer p-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <Thumbnail video={video} compact={compact} />

      <a
        href={video.video_url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex-1 min-w-0 no-underline",
          compact ? "px-[10px] py-2" : "px-3 py-[10px]",
        )}
      >
        <div
          className={cn(
            "font-syne font-semibold text-[#f0f0f0] leading-[1.35] line-clamp-2 mb-1.5",
            compact ? "text-[12px]" : "text-[13px]",
          )}
          title={video.title}
        >
          {video.title}
        </div>
        <div className="font-mono text-[10px] text-muted flex gap-2 flex-wrap">
          {!compact && (
            <span className="text-accent opacity-80">{video.channel_name}</span>
          )}
          <span>{video.estimated_date || video.relative_date}</span>
        </div>
      </a>
    </div>
  );
}
