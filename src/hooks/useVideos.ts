import { useCallback } from "react";
import { parseCSV, serializeCSV } from "@/lib/csv";
import type { Video, VideoGroups } from "@/types";

export function useVideos(
  _videos: Video[] | null,
  setVideos: React.Dispatch<React.SetStateAction<Video[] | null>>,
) {
  const handleUpload = useCallback(
    (data: Video[]) => {
      setVideos(data);
    },
    [setVideos],
  );

  const handleMerge = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const incoming = parseCSV(e.target!.result as string);
          setVideos((prev) => {
            if (!prev) return incoming;
            const existingUrls = new Set(prev.map((v) => v.video_url));
            const newVideos = incoming.filter(
              (v) => !existingUrls.has(v.video_url),
            );
            return [...prev, ...newVideos];
          });
        } catch {
          alert("Failed to parse CSV.");
        }
      };
      reader.readAsText(file);
    },
    [setVideos],
  );

  const handleRemove = useCallback(
    (video: Video) => {
      setVideos((prev) => (prev ? prev.filter((v) => v !== video) : prev));
    },
    [setVideos],
  );

  const exportCSV = useCallback((groups: VideoGroups) => {
    const ordered = Object.values(groups).flat();
    const csv = serializeCSV(ordered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    a.download = `ytwl-webapp_${datePart}_${timePart}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const clearVideos = useCallback(() => {
    setVideos(null);
  }, [setVideos]);

  return { handleUpload, handleMerge, handleRemove, exportCSV, clearVideos };
}
