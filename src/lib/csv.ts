import Papa from "papaparse";
import type { Video } from "@/types";

export function parseCSV(text: string): Video[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data.filter((row) => Boolean(row.title)) as unknown as Video[];
}

export function serializeCSV(rows: Video[]): string {
  return Papa.unparse(rows);
}
