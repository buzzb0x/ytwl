import { describe, it, expect } from "vitest";
import {
  getVideoId,
  parseDuration,
  formatDuration,
  parseCSV,
  serializeCSV,
} from "../utils";

describe("getVideoId", () => {
  it("extracts ID from youtu.be URL", () => {
    expect(getVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from youtube.com?v= URL", () => {
    expect(getVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from URL with extra query params", () => {
    expect(
      getVideoId(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc&index=2",
      ),
    ).toBe("dQw4w9WgXcQ");
  });

  it("returns null for empty string", () => {
    expect(getVideoId("")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(getVideoId("not-a-url")).toBeNull();
  });
});

describe("parseDuration", () => {
  it("parses HH:MM:SS", () => {
    expect(parseDuration("1:30:00")).toBe(5400);
  });

  it("parses MM:SS (no hours)", () => {
    expect(parseDuration("5:00")).toBe(300);
  });

  it("parses short duration", () => {
    expect(parseDuration("0:45")).toBe(45);
  });

  it("returns 0 for empty string", () => {
    expect(parseDuration("")).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(parseDuration(undefined)).toBe(0);
  });
});

describe("formatDuration", () => {
  it("returns the string as-is when present", () => {
    expect(formatDuration("1:30:00")).toBe("1:30:00");
  });

  it("returns em dash for empty string", () => {
    expect(formatDuration("")).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(formatDuration(undefined)).toBe("—");
  });
});

describe("parseCSV / serializeCSV", () => {
  const videos = [
    {
      title: "Video One",
      video_url: "https://youtu.be/aaa",
      channel_name: "Chan A",
      duration: "5:00",
      estimated_date: "2024-01-01",
      relative_date: "1 year ago",
      thumbnail_url: "",
    },
    {
      title: "Video, With Comma",
      video_url: "https://youtu.be/bbb",
      channel_name: "Chan B",
      duration: "10:30",
      estimated_date: "2024-02-01",
      relative_date: "11 months ago",
      thumbnail_url: "",
    },
  ];

  it("parses basic CSV rows", () => {
    const csv =
      "title,video_url,channel_name,duration,estimated_date,relative_date,thumbnail_url\nVideo One,https://youtu.be/aaa,Chan A,5:00,2024-01-01,1 year ago,";
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Video One");
    expect(result[0].duration).toBe("5:00");
  });

  it("handles quoted fields containing commas", () => {
    const csv =
      'title,video_url,channel_name\n"Video, With Comma",https://youtu.be/bbb,Chan B';
    const result = parseCSV(csv);
    expect(result[0].title).toBe("Video, With Comma");
  });

  it("filters out rows without a title", () => {
    const csv =
      "title,video_url\nValid Video,https://youtu.be/aaa\n,https://youtu.be/bbb";
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
  });

  it("round-trips through serializeCSV → parseCSV", () => {
    const csv = serializeCSV(videos);
    const result = parseCSV(csv);
    expect(result).toHaveLength(videos.length);
    expect(result[0].title).toBe(videos[0].title);
    expect(result[1].title).toBe(videos[1].title);
    expect(result[1].channel_name).toBe(videos[1].channel_name);
  });

  it("serializeCSV escapes commas in field values", () => {
    const csv = serializeCSV(videos);
    // The second video title has a comma — should be quoted
    expect(csv).toContain('"Video, With Comma"');
  });

  it("returns empty string for empty array", () => {
    expect(serializeCSV([])).toBe("");
  });
});
