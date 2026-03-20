import { useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useVideos } from "@/hooks/useVideos";
import { useFill } from "@/hooks/useFill";
import { parseDuration } from "@/lib/duration";
import type { Video } from "@/types";
import { Header } from "@/components/Header";
import { VideoGrid } from "@/components/VideoGrid";
import { UploadScreen } from "@/components/UploadScreen";
import { PlaylistBar } from "@/components/PlaylistBar";
import type { SortBy, GroupBy, ViewMode, VideoGroups } from "@/types";

export default function App() {
  const [videos, setVideos] = useLocalStorage<Video[] | null>(
    "ytwl_videos",
    null,
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useLocalStorage<SortBy>(
    "ytwl_sortBy",
    "date_desc",
  );
  const [groupBy, setGroupBy] = useLocalStorage<GroupBy>(
    "ytwl_groupBy",
    "none",
  );
  const [view, setView] = useLocalStorage<ViewMode>("ytwl_view", "grid");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const { handleUpload, handleMerge, handleRemove, exportCSV, clearVideos } =
    useVideos(videos, setVideos);

  const {
    selectedUrls,
    fillMode,
    playlistUrl,
    handleToggleSelect,
    handleDeselect,
    handleFill,
    handleRerollAll,
    handleSwap,
    canSwap,
    clearSelection,
  } = useFill(videos);

  const handleRemoveAndDeselect = useCallback(
    (video: Video) => {
      handleRemove(video);
      handleDeselect(video);
    },
    [handleRemove, handleDeselect],
  );

  if (!videos) {
    return (
      <UploadScreen
        onUpload={(data) => {
          handleUpload(data);
          setOpenGroups({});
        }}
      />
    );
  }

  const filtered = videos.filter(
    (v) =>
      !search ||
      v.title?.toLowerCase().includes(search.toLowerCase()) ||
      v.channel_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "duration_asc")
      return parseDuration(a.duration) - parseDuration(b.duration);
    if (sortBy === "duration_desc")
      return parseDuration(b.duration) - parseDuration(a.duration);
    if (sortBy === "date_asc")
      return (a.estimated_date || "").localeCompare(b.estimated_date || "");
    if (sortBy === "date_desc")
      return (b.estimated_date || "").localeCompare(a.estimated_date || "");
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return 0;
  });

  const totalSecs = filtered.reduce((s, v) => s + parseDuration(v.duration), 0);
  const totalH = Math.floor(totalSecs / 3600);
  const totalM = Math.floor((totalSecs % 3600) / 60);

  const displayed =
    fillMode && selectedUrls.size > 0
      ? sorted.filter((v) => selectedUrls.has(v.video_url))
      : sorted;

  const groups: VideoGroups = {};
  if (groupBy === "channel") {
    displayed.forEach((v) => {
      const k = v.channel_name || "Unknown";
      (groups[k] = groups[k] || []).push(v);
    });
  } else if (groupBy === "month") {
    displayed.forEach((v) => {
      const d = v.estimated_date?.slice(0, 7) || "Unknown";
      (groups[d] = groups[d] || []).push(v);
    });
  } else {
    groups["all"] = displayed;
  }

  const toggleGroup = (k: string) =>
    setOpenGroups((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="bg-bg min-h-screen text-white">
      <Header
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        groupBy={groupBy}
        onGroupChange={setGroupBy}
        view={view}
        onViewChange={setView}
        onFill={handleFill}
        onImport={handleMerge}
        onExport={() => exportCSV(groups)}
        onClear={clearVideos}
        filteredCount={filtered.length}
        totalH={totalH}
        totalM={totalM}
      />

      <main className="max-w-[1200px] mx-auto px-5 pt-5 pb-16">
        <VideoGrid
          groups={groups}
          groupBy={groupBy}
          view={view}
          openGroups={openGroups}
          selectedUrls={selectedUrls}
          fillMode={fillMode}
          onRemove={handleRemoveAndDeselect}
          onToggleSelect={handleToggleSelect}
          onSwap={handleSwap}
          canSwap={canSwap}
          onToggleGroup={toggleGroup}
        />
      </main>

      {selectedUrls.size > 0 &&
        (() => {
          const selSecs = videos
            .filter((v) => selectedUrls.has(v.video_url))
            .reduce((s, v) => s + parseDuration(v.duration), 0);
          const selH = Math.floor(selSecs / 3600);
          const selM = Math.floor((selSecs % 3600) / 60);
          const selS = selSecs % 60;
          return (
            <PlaylistBar
              selectedCount={selectedUrls.size}
              selectedDuration={
                selH > 0
                  ? `${selH}h ${selM}m`
                  : selM > 0
                    ? `${selM}m ${selS}s`
                    : `${selS}s`
              }
              playlistUrl={playlistUrl}
              fillMode={fillMode}
              onReroll={handleRerollAll}
              onClear={clearSelection}
            />
          );
        })()}
    </div>
  );
}
