// @vitest-environment node
// Corpus-based threshold calibration tests using the real model.
// These are NOT run in CI (too slow / requires network).
// Run manually: npm run test:run -- src/test/semanticSearchCorpus.test.ts

import { describe, it, expect, beforeAll } from "vitest";
import {
  computeEmbedding,
  cosineSimilarity,
  _setPipelineForTesting,
} from "@/lib/semanticSearch";

const CORPUS = [
  "The Invisible Layer of Tech | HYPE DESK",
  "The Greek tragedy of Oedipus' daughter - Stephen Esposito",
  "Why it's hard for Americans to retire",
  "How Robert Frost Writes A Poem",
  "The dark history of arsenic - Neil Bradbury",
  "How to balance paying debt vs. investing",
  "The day women shut down Iceland",
  "Would you eat a ghost pepper for a prize? - Dan Kwartler",
];

async function semanticSearch(
  query: string,
  corpus: string[],
  threshold: number,
): Promise<{ title: string; score: number }[]> {
  const queryVec = await computeEmbedding(query);
  const scored = await Promise.all(
    corpus.map(async (title) => ({
      title,
      score: cosineSimilarity(queryVec, await computeEmbedding(title)),
    })),
  );
  const all = scored.sort((a, b) => b.score - a.score);
  // Log all scores so we can tune the threshold
  console.log(all.map((r) => `  ${r.score.toFixed(3)} ${r.title}`).join("\n"));
  return all.filter(({ score }) => score >= threshold);
}

describe("corpus threshold calibration (real model)", () => {
  const THRESHOLD = 0.25;

  beforeAll(() => {
    // Ensure the real pipeline is used (not any injected mock)
    _setPipelineForTesting(null);
  });

  it("'technology news' matches the tech video", async () => {
    console.log("\ntechnology news →");
    const results = await semanticSearch("technology news", CORPUS, THRESHOLD);
    const titles = results.map((r) => r.title);
    expect(titles).toContain("The Invisible Layer of Tech | HYPE DESK");
    expect(titles).not.toContain(
      "Would you eat a ghost pepper for a prize? - Dan Kwartler",
    );
  }, 60_000);

  it("'greek mythology' matches the Oedipus video", async () => {
    console.log("\ngreek mythology →");
    const results = await semanticSearch("greek mythology", CORPUS, THRESHOLD);
    const titles = results.map((r) => r.title);
    expect(titles).toContain(
      "The Greek tragedy of Oedipus' daughter - Stephen Esposito",
    );
    expect(titles).not.toContain(
      "Would you eat a ghost pepper for a prize? - Dan Kwartler",
    );
  }, 60_000);

  it("'personal finance' matches the debt/investing video", async () => {
    console.log("\npersonal finance →");
    const results = await semanticSearch("personal finance", CORPUS, THRESHOLD);
    const titles = results.map((r) => r.title);
    expect(titles).toContain("How to balance paying debt vs. investing");
    expect(titles).not.toContain("How Robert Frost Writes A Poem");
    expect(titles).not.toContain(
      "Would you eat a ghost pepper for a prize? - Dan Kwartler",
    );
  }, 60_000);

  it("'retirement savings' matches the retirement video", async () => {
    console.log("\nretirement savings →");
    const results = await semanticSearch(
      "retirement savings",
      CORPUS,
      THRESHOLD,
    );
    const titles = results.map((r) => r.title);
    expect(titles).toContain("Why it's hard for Americans to retire");
    expect(titles).not.toContain(
      "Would you eat a ghost pepper for a prize? - Dan Kwartler",
    );
  }, 60_000);

  it("'history' matches the arsenic video", async () => {
    console.log("\nhistory →");
    const results = await semanticSearch("history", CORPUS, THRESHOLD);
    const titles = results.map((r) => r.title);
    expect(titles).toContain("The dark history of arsenic - Neil Bradbury");
    expect(titles).not.toContain("How Robert Frost Writes A Poem");
  }, 60_000);

  it("'women policy' matches the Iceland video", async () => {
    console.log("\nwomen policy →");
    const results = await semanticSearch("women policy", CORPUS, THRESHOLD);
    const titles = results.map((r) => r.title);
    expect(titles).toContain("The day women shut down Iceland");
    expect(titles).not.toContain(
      "Would you eat a ghost pepper for a prize? - Dan Kwartler",
    );
  }, 60_000);
});
