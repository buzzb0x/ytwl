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
  const hasActions = (fillMode && onReroll) || playlistUrl;

  return (
    <div
      className="fixed bottom-0 inset-x-0 xs:bottom-6 xs:left-1/2 xs:-translate-x-1/2 xs:inset-x-auto
        flex flex-wrap xs:flex-nowrap items-center gap-2 px-3 py-2.5
        border-t border-accent/40 xs:border xs:rounded-[10px]
        backdrop-blur-md shadow-lg font-mono z-50"
      style={{ background: "rgba(20,20,20,0.97)" }}
    >
      {/* Caption — grows to fill row 1 on narrow, pushing X to its right */}
      <span className="whitespace-nowrap flex-1 text-[12px] text-[#aaa]">
        {selectedCount} video{selectedCount !== 1 ? "s" : ""} &middot;{" "}
        {selectedDuration}
      </span>

      {/* Clear — row 1 right of caption on narrow, last on wide */}
      <button
        onClick={onClear}
        className="xs:order-last bg-transparent border-none text-dimmed cursor-pointer p-0
          flex items-center hover:text-white transition-colors"
      >
        <X size={16} />
      </button>

      {/* Actions — full-width row 2 on narrow, inline on wide */}
      {hasActions && (
        <div className="w-full xs:w-auto flex gap-2">
          {fillMode && onReroll && (
            <button
              onClick={onReroll}
              className="flex-1 xs:flex-none
                bg-transparent border border-white/15 rounded-md px-[10px] py-1.5
                text-[12px] text-[#aaa] cursor-pointer
                flex items-center justify-center gap-1.5
                hover:text-white hover:border-white/30 transition-colors"
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
              className="flex-1 xs:flex-none
                bg-accent text-white rounded-md px-[14px] py-1.5
                text-[12px] font-medium no-underline whitespace-nowrap
                flex items-center justify-center gap-1.5"
            >
              <Play size={13} />
              <span className="hidden xs:inline">Open as </span>Playlist
            </a>
          )}
        </div>
      )}
    </div>
  );
}
