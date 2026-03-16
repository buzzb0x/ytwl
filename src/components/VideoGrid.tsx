import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseDuration } from "@/lib/duration";
import { VideoCard } from "./VideoCard";
import type { Video, VideoGroups, ViewMode, GroupBy } from "@/types";

interface VideoGridProps {
  groups: VideoGroups;
  groupBy: GroupBy;
  view: ViewMode;
  openGroups: Record<string, boolean>;
  selectedUrls: Set<string>;
  fillMode: boolean;
  onRemove: (video: Video) => void;
  onToggleSelect: (video: Video) => void;
  onSwap: (video: Video) => void;
  onToggleGroup: (key: string) => void;
}

function VideoList({
  videos,
  compact,
  selectedUrls,
  fillMode,
  onRemove,
  onToggleSelect,
  onSwap,
  anySelected,
}: {
  videos: Video[];
  compact: boolean;
  selectedUrls: Set<string>;
  fillMode: boolean;
  onRemove: (v: Video) => void;
  onToggleSelect: (v: Video) => void;
  onSwap: (v: Video) => void;
  anySelected: boolean;
}) {
  return (
    <div
      className={cn(
        compact
          ? "flex flex-col gap-1.5"
          : "grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3",
      )}
    >
      {videos.map((v, i) => (
        <VideoCard
          key={i}
          video={v}
          compact={compact}
          onRemove={onRemove}
          selected={selectedUrls.has(v.video_url)}
          onToggleSelect={onToggleSelect}
          anySelected={anySelected}
          fillMode={fillMode}
          onSwap={onSwap}
        />
      ))}
    </div>
  );
}

export function VideoGrid({
  groups,
  groupBy,
  view,
  openGroups,
  selectedUrls,
  fillMode,
  onRemove,
  onToggleSelect,
  onSwap,
  onToggleGroup,
}: VideoGridProps) {
  const compact = view === "list";
  const anySelected = selectedUrls.size > 0;

  if (groupBy === "none") {
    return (
      <VideoList
        videos={groups["all"] ?? []}
        compact={compact}
        selectedUrls={selectedUrls}
        fillMode={fillMode}
        onRemove={onRemove}
        onToggleSelect={onToggleSelect}
        onSwap={onSwap}
        anySelected={anySelected}
      />
    );
  }

  return (
    <>
      {Object.entries(groups).map(([groupKey, items]) => {
        const isOpen = openGroups[groupKey] !== false;
        const groupSecs = items.reduce(
          (s, v) => s + parseDuration(v.duration),
          0,
        );
        const gH = Math.floor(groupSecs / 3600);
        const gM = Math.floor((groupSecs % 3600) / 60);

        return (
          <div key={groupKey} className="mb-6">
            <div
              data-testid={`group-header-${groupKey}`}
              onClick={() => onToggleGroup(groupKey)}
              className={cn(
                "flex items-center gap-[10px] py-[10px] cursor-pointer border-b border-white/7",
                isOpen ? "mb-[14px]" : "mb-0",
              )}
            >
              <span className="font-syne font-bold text-[15px] text-[#eee]">
                {groupKey}
              </span>
              <span className="font-mono text-[11px] text-dimmed">
                {items.length} · {gH > 0 ? `${gH}h ` : ""}
                {gM}m
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  "text-dimmed ml-auto transition-transform duration-200",
                  !isOpen && "-rotate-90",
                )}
              />
            </div>
            {isOpen && (
              <VideoList
                videos={items}
                compact={compact}
                selectedUrls={selectedUrls}
                fillMode={fillMode}
                onRemove={onRemove}
                onToggleSelect={onToggleSelect}
                onSwap={onSwap}
                anySelected={anySelected}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
