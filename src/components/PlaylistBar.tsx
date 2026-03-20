import { Play, Shuffle, X } from "lucide-react";

interface PlaylistBarProps {
  selectedCount: number;
  selectedDuration: string;
  playlistUrl: string | null;
  fillMode?: boolean;
  onReroll?: () => void;
  onClear: () => void;
}

export function PlaylistBar({
  selectedCount,
  selectedDuration,
  playlistUrl,
  fillMode,
  onReroll,
  onClear,
}: PlaylistBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[rgba(20,20,20,0.97)] border border-accent/40 rounded-[10px] px-4 py-[10px] flex items-center gap-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-[8px] font-mono">
      <span className="text-[12px] text-[#aaa]">
        {selectedCount} video{selectedCount !== 1 ? "s" : ""} ·{" "}
        {selectedDuration}
      </span>
      {fillMode && onReroll && (
        <button
          onClick={onReroll}
          title="Reroll all videos"
          className="bg-transparent border border-white/15 rounded-md px-[10px] py-1.5 text-[12px] text-[#aaa] cursor-pointer flex items-center gap-1.5 hover:text-white hover:border-white/30 transition-colors"
        >
          <Shuffle size={13} />
          Reroll
        </button>
      )}
      {playlistUrl && (
        <a
          href={playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-accent text-white rounded-md px-[14px] py-1.5 text-[12px] font-medium no-underline whitespace-nowrap flex items-center gap-1.5"
        >
          <Play size={14} />
          Open as Playlist
        </a>
      )}
      <button
        onClick={onClear}
        title="Clear selection"
        className="bg-transparent border-none text-dimmed cursor-pointer p-0 flex items-center"
      >
        <X size={16} />
      </button>
    </div>
  );
}
