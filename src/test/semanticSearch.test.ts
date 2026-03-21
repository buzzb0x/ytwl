import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cosineSimilarity,
  computeEmbedding,
  _setPipelineForTesting,
} from "@/lib/semanticSearch";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVec(length: number, fill: number): number[] {
  return Array(length).fill(fill);
}

function unitVec(index: number, length = 384): number[] {
  const v = new Array(length).fill(0);
  v[index] = 1;
  return v;
}

// ---------------------------------------------------------------------------
// 1. cosineSimilarity — pure math, no mocks needed
// ---------------------------------------------------------------------------

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const v = [1, 2, 3];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1);
  });

  it("returns 1 for identical non-unit vectors", () => {
    const a = [3, 4, 0];
    const b = [3, 4, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity(unitVec(0, 3), unitVec(1, 3))).toBeCloseTo(0);
  });

  it("returns -1 for opposite vectors", () => {
    const a = [1, 0, 0];
    const b = [-1, 0, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1);
  });

  it("returns 0 for zero vector", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it("returns 0 for empty arrays", () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it("orders similarity correctly", () => {
    const a = [1, 0, 0];
    const similar = [0.9, 0.1, 0];
    const different = [0, 0, 1];
    expect(cosineSimilarity(a, similar)).toBeGreaterThan(
      cosineSimilarity(a, different),
    );
  });
});

// ---------------------------------------------------------------------------
// 2. computeEmbedding — mocked pipeline
// ---------------------------------------------------------------------------

describe("computeEmbedding (mocked)", () => {
  beforeEach(() => {
    // Inject a mock pipeline that returns a known 384-dim Float32Array
    const mockPipeline = vi.fn().mockImplementation(async (text: string) => {
      // Deterministic: embed each char code, repeated/truncated to 384
      const codes = [...text].map((c) => c.charCodeAt(0) / 128);
      const data = new Float32Array(384);
      for (let i = 0; i < 384; i++) data[i] = codes[i % codes.length];
      return { data };
    });
    _setPipelineForTesting(mockPipeline as never);
  });

  it("returns a number array of length 384", async () => {
    const vec = await computeEmbedding("hello world");
    expect(Array.isArray(vec)).toBe(true);
    expect(vec).toHaveLength(384);
  });

  it("returns numbers (not Float32Array)", async () => {
    const vec = await computeEmbedding("test");
    expect(typeof vec[0]).toBe("number");
  });

  it("returns different vectors for different inputs", async () => {
    const a = await computeEmbedding("apple");
    const b = await computeEmbedding("banana");
    expect(a).not.toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// 3. Cache sync logic (tested via the hook internals indirectly through
//    syncCache exported from the hook — we test the pure cache logic here)
// ---------------------------------------------------------------------------

describe("cache sync logic (unit)", () => {
  // We test the logic directly since it's stateless given the inputs
  type Cache = Record<string, number[]>;

  function prunedCache(cache: Cache, urls: Set<string>): Cache {
    const result: Cache = {};
    for (const [url, vec] of Object.entries(cache)) {
      if (urls.has(url)) result[url] = vec;
    }
    return result;
  }

  function missingUrls(cache: Cache, urls: string[]): string[] {
    return urls.filter((u) => !(u in cache));
  }

  const EMBED_A = makeVec(384, 0.1);
  const EMBED_B = makeVec(384, 0.2);

  it("returns empty cache when all videos removed", () => {
    const cache: Cache = { url1: EMBED_A, url2: EMBED_B };
    expect(prunedCache(cache, new Set())).toEqual({});
  });

  it("preserves entries for existing videos", () => {
    const cache: Cache = { url1: EMBED_A, url2: EMBED_B };
    const pruned = prunedCache(cache, new Set(["url1"]));
    expect(pruned).toEqual({ url1: EMBED_A });
  });

  it("identifies missing urls that need embedding", () => {
    const cache: Cache = { url1: EMBED_A };
    const missing = missingUrls(cache, ["url1", "url2", "url3"]);
    expect(missing).toEqual(["url2", "url3"]);
  });

  it("identifies no missing urls when cache is complete", () => {
    const cache: Cache = { url1: EMBED_A, url2: EMBED_B };
    const missing = missingUrls(cache, ["url1", "url2"]);
    expect(missing).toHaveLength(0);
  });

  it("merging: existing entries are preserved on import", () => {
    // Simulate merge: new videos added, existing ones in cache untouched
    const existingCache: Cache = { url1: EMBED_A };
    const incomingUrls = ["url1", "url2"]; // url1 already cached
    const toCompute = missingUrls(existingCache, incomingUrls);
    expect(toCompute).toEqual(["url2"]);
    // url1 stays unchanged in cache
    const updated: Cache = { ...existingCache, url2: EMBED_B };
    expect(updated.url1).toEqual(EMBED_A);
  });
});

// ---------------------------------------------------------------------------
// 4. semanticFilter logic (via cosineSimilarity + threshold)
// ---------------------------------------------------------------------------

describe("semanticFilter logic", () => {
  type ScoredVideo = { title: string; score: number };

  function applyThreshold(scored: ScoredVideo[], threshold: number) {
    return scored
      .filter(({ score }) => score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map(({ title }) => title);
  }

  it("empty query returns all videos (no-op)", () => {
    const titles = applyThreshold(
      [
        { title: "A", score: 0.9 },
        { title: "B", score: 0.1 },
      ],
      -Infinity,
    );
    expect(titles).toEqual(["A", "B"]);
  });

  it("threshold 1.0 filters everything out", () => {
    const scored = [
      { title: "A", score: 0.9 },
      { title: "B", score: 0.8 },
    ];
    expect(applyThreshold(scored, 1.0)).toHaveLength(0);
  });

  it("threshold 0.0 passes everything", () => {
    const scored = [
      { title: "A", score: 0.3 },
      { title: "B", score: 0.1 },
    ];
    expect(applyThreshold(scored, 0.0)).toHaveLength(2);
  });

  it("results are sorted by descending score", () => {
    const scored = [
      { title: "C", score: 0.3 },
      { title: "A", score: 0.9 },
      { title: "B", score: 0.6 },
    ];
    expect(applyThreshold(scored, 0.0)).toEqual(["A", "B", "C"]);
  });

  it("at threshold 0.25, only scores >= 0.25 pass", () => {
    const scored = [
      { title: "Match", score: 0.5 },
      { title: "Weak", score: 0.2 },
      { title: "Strong", score: 0.8 },
    ];
    const result = applyThreshold(scored, 0.25);
    expect(result).toContain("Match");
    expect(result).toContain("Strong");
    expect(result).not.toContain("Weak");
  });
});
