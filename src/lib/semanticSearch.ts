import type { FeatureExtractionPipeline } from "@huggingface/transformers";

let _pipeline: FeatureExtractionPipeline | null = null;

async function getPipeline(): Promise<FeatureExtractionPipeline> {
  if (!_pipeline) {
    const { pipeline } = await import("@huggingface/transformers");
    _pipeline = await pipeline<"feature-extraction">(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
  }
  return _pipeline;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function computeEmbedding(text: string): Promise<number[]> {
  const pipe = await getPipeline();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

export async function computeEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(computeEmbedding));
}

// Exposed for testing — allows injecting a mock pipeline
export function _setPipelineForTesting(mock: FeatureExtractionPipeline | null) {
  _pipeline = mock;
}
