import { useState, useCallback } from "react";
import { parseDuration } from "@/lib/duration";
import { getVideoId } from "@/lib/youtube";
import type { Video } from "@/types";

export function useFill(videos: Video[] | null) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [fillMode, setFillMode] = useState(false);
  const [fillBudget, setFillBudget] = useState(0);

  const playlistUrl = (() => {
    const ids = [...selectedUrls].map(getVideoId).filter(Boolean);
    return ids.length
      ? `https://www.youtube.com/watch_videos?video_ids=${ids.join(",")}`
      : null;
  })();

  const handleToggleSelect = useCallback((video: Video) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(video.video_url)) next.delete(video.video_url);
      else next.add(video.video_url);
      if (next.size === 0) setFillMode(false);
      return next;
    });
  }, []);

  const handleFill = useCallback(
    (minutes: number) => {
      if (!videos) return;
      const budget = minutes * 60;
      const pool = [...videos].sort(() => Math.random() - 0.5);
      let remaining = budget;
      const picked = new Set<string>();
      for (const v of pool) {
        const dur = parseDuration(v.duration);
        if (dur > 0 && dur <= remaining) {
          picked.add(v.video_url);
          remaining -= dur;
        }
      }
      setSelectedUrls(picked);
      setFillBudget(budget);
      setFillMode(true);
    },
    [videos],
  );

  const handleSwap = useCallback(
    (video: Video) => {
      if (!videos) return;
      setSelectedUrls((prev) => {
        const currentTotal = [...prev].reduce(
          (s, url) =>
            s +
            parseDuration(videos.find((v) => v.video_url === url)?.duration),
          0,
        );
        const freed = parseDuration(video.duration);
        const available = fillBudget - (currentTotal - freed);
        const candidates = videos.filter(
          (v) =>
            !prev.has(v.video_url) && parseDuration(v.duration) <= available,
        );
        if (candidates.length === 0) return prev;
        const replacement =
          candidates[Math.floor(Math.random() * candidates.length)];
        const next = new Set(prev);
        next.delete(video.video_url);
        next.add(replacement.video_url);
        return next;
      });
    },
    [videos, fillBudget],
  );

  const canSwap = useCallback(
    (video: Video): boolean => {
      if (!videos) return false;
      const currentTotal = [...selectedUrls].reduce(
        (s, url) =>
          s + parseDuration(videos.find((v) => v.video_url === url)?.duration),
        0,
      );
      const freed = parseDuration(video.duration);
      const available = fillBudget - (currentTotal - freed);
      return videos.some(
        (v) =>
          !selectedUrls.has(v.video_url) &&
          parseDuration(v.duration) <= available,
      );
    },
    [videos, selectedUrls, fillBudget],
  );

  const handleDeselect = useCallback((video: Video) => {
    setSelectedUrls((prev) => {
      if (!prev.has(video.video_url)) return prev;
      const next = new Set(prev);
      next.delete(video.video_url);
      if (next.size === 0) setFillMode(false);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUrls(new Set());
    setFillMode(false);
  }, []);

  return {
    selectedUrls,
    fillMode,
    fillBudget,
    playlistUrl,
    handleToggleSelect,
    handleDeselect,
    handleFill,
    handleSwap,
    canSwap,
    clearSelection,
  };
}
