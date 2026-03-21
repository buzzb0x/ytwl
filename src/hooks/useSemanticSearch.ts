import { useState, useCallback, useRef, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { computeEmbedding, cosineSimilarity } from "@/lib/semanticSearch";
import type { Video } from "@/types";

export function useSemanticSearch(query: string) {
  const [isEnabled, setIsEnabledRaw] = useLocalStorage<boolean>(
    "ytwl_isSemanticSearchEnabled",
    false,
  );
  const [threshold, setThreshold] = useLocalStorage<number>(
    "ytwl_semanticThreshold",
    0.25,
  );
  const [embeddings, setEmbeddings] = useLocalStorage<Record<string, number[]>>(
    "ytwl_embeddings",
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [queryEmbedding, setQueryEmbedding] = useState<number[] | null>(null);

  // Keep a ref so callbacks always see the latest embeddings without re-creating
  const embeddingsRef = useRef(embeddings);
  embeddingsRef.current = embeddings;

  // Recompute query embedding whenever query or enabled changes
  useEffect(() => {
    if (!isEnabled || !query) {
      setQueryEmbedding(null);
      return;
    }
    let cancelled = false;
    computeEmbedding(query).then((vec) => {
      if (!cancelled) setQueryEmbedding(vec);
    });
    return () => {
      cancelled = true;
    };
  }, [isEnabled, query]);

  const syncCache = useCallback(
    async (videos: Video[]) => {
      if (!isEnabled) return;

      const current = embeddingsRef.current;
      const videoUrls = new Set(videos.map((v) => v.video_url));

      // Prune stale entries
      const pruned: Record<string, number[]> = {};
      for (const [url, vec] of Object.entries(current)) {
        if (videoUrls.has(url)) pruned[url] = vec;
      }

      const missing = videos.filter((v) => !(v.video_url in pruned));
      if (missing.length === 0) {
        if (Object.keys(pruned).length !== Object.keys(current).length) {
          setEmbeddings(pruned);
        }
        return;
      }

      setIsLoading(true);
      try {
        const updated = { ...pruned };
        for (const video of missing) {
          updated[video.video_url] = await computeEmbedding(video.title);
        }
        setEmbeddings(updated);
      } finally {
        setIsLoading(false);
      }
    },
    [isEnabled, setEmbeddings],
  );

  const setIsEnabled = useCallback(
    (value: boolean) => {
      setIsEnabledRaw(value);
    },
    [setIsEnabledRaw],
  );

  // Sync filter — uses pre-computed queryEmbedding so it stays side-effect free
  const semanticFilter = useCallback(
    (videos: Video[]): Video[] => {
      if (!query || !queryEmbedding) return videos;
      const cache = embeddingsRef.current;
      return videos
        .map((v) => ({
          video: v,
          score: cache[v.video_url]
            ? cosineSimilarity(queryEmbedding, cache[v.video_url])
            : 0,
        }))
        .filter(({ score }) => score >= threshold)
        .sort((a, b) => b.score - a.score)
        .map(({ video }) => video);
    },
    [query, queryEmbedding, threshold],
  );

  return {
    isEnabled,
    setIsEnabled,
    isLoading,
    threshold,
    setThreshold,
    syncCache,
    semanticFilter,
  };
}
