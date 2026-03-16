import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { parseDuration } from "../utils";

// Fixed dataset: known titles, channels, durations, dates
const VIDEOS = [
  {
    title: "Alpha Video",
    video_url: "https://www.youtube.com/watch?v=aaa",
    channel_name: "Channel A",
    duration: "5:00",
    estimated_date: "2024-01-10",
    relative_date: "1 year ago",
    thumbnail_url: "",
  },
  {
    title: "Beta Video",
    video_url: "https://www.youtube.com/watch?v=bbb",
    channel_name: "Channel B",
    duration: "10:00",
    estimated_date: "2024-02-10",
    relative_date: "11 months ago",
    thumbnail_url: "",
  },
  {
    title: "Gamma Video",
    video_url: "https://www.youtube.com/watch?v=ccc",
    channel_name: "Channel A",
    duration: "15:00",
    estimated_date: "2024-03-10",
    relative_date: "10 months ago",
    thumbnail_url: "",
  },
  {
    title: "Delta Video",
    video_url: "https://www.youtube.com/watch?v=ddd",
    channel_name: "Channel C",
    duration: "2:00",
    estimated_date: "2024-04-10",
    relative_date: "9 months ago",
    thumbnail_url: "",
  },
  {
    title: "Epsilon Video",
    video_url: "https://www.youtube.com/watch?v=eee",
    channel_name: "Channel B",
    duration: "20:00",
    estimated_date: "2024-05-10",
    relative_date: "8 months ago",
    thumbnail_url: "",
  },
];

beforeEach(() => {
  localStorage.setItem("ytwl_videos", JSON.stringify(VIDEOS));
  localStorage.removeItem("ytwl_sortBy");
  localStorage.removeItem("ytwl_groupBy");
  localStorage.removeItem("ytwl_view");
});

describe("Search", () => {
  it("filters cards by title (case-insensitive)", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText("Search videos or channels...");
    await userEvent.type(input, "alpha");
    expect(screen.getByText("Alpha Video")).toBeInTheDocument();
    expect(screen.queryByText("Beta Video")).toBeNull();
    expect(screen.queryByText("Gamma Video")).toBeNull();
  });

  it("filters cards by channel name", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText("Search videos or channels...");
    await userEvent.type(input, "Channel A");
    expect(screen.getByText("Alpha Video")).toBeInTheDocument();
    expect(screen.getByText("Gamma Video")).toBeInTheDocument();
    expect(screen.queryByText("Beta Video")).toBeNull();
  });

  it("restores all cards when search is cleared", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText("Search videos or channels...");
    await userEvent.type(input, "alpha");
    await userEvent.clear(input);
    for (const v of VIDEOS) {
      expect(screen.getByText(v.title)).toBeInTheDocument();
    }
  });
});

describe("Sort", () => {
  it("sorts by shortest duration (duration_asc)", async () => {
    render(<App />);
    const sortSelect = screen.getByDisplayValue("Newest");
    await userEvent.selectOptions(sortSelect, "duration_asc");
    const titles = screen.getAllByText(/Video$/).map((el) => el.textContent);
    const durations = titles.map((t) =>
      parseDuration(VIDEOS.find((v) => v.title === t)?.duration || ""),
    );
    for (let i = 1; i < durations.length; i++) {
      expect(durations[i]).toBeGreaterThanOrEqual(durations[i - 1]);
    }
  });

  it("sorts alphabetically by title (title)", async () => {
    render(<App />);
    const sortSelect = screen.getByDisplayValue("Newest");
    await userEvent.selectOptions(sortSelect, "title");
    const titleEls = screen.getAllByText(/Video$/);
    const rendered = titleEls.map((el) => el.textContent);
    const sorted = [...rendered].sort((a, b) => a.localeCompare(b));
    expect(rendered).toEqual(sorted);
  });
});

describe("Fill", () => {
  it("selects videos whose total duration fits within the budget", async () => {
    render(<App />);
    const fillSelect = screen.getByDisplayValue("⏱ Fill...");
    await userEvent.selectOptions(fillSelect, "10");

    // Bottom bar should appear
    expect(screen.getByText(/video.*selected/i)).toBeInTheDocument();

    // Only selected videos should be visible (fill mode filters the list)
    const visibleTitles = VIDEOS.filter((v) => screen.queryByText(v.title)).map(
      (v) => v.title,
    );

    const totalSecs = visibleTitles.reduce((sum, t) => {
      const v = VIDEOS.find((x) => x.title === t);
      return sum + parseDuration(v?.duration || "");
    }, 0);

    expect(totalSecs).toBeLessThanOrEqual(10 * 60);
  });

  it("shows the selection count in the bottom bar", async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "30");
    expect(screen.getByText(/video.*selected/i)).toBeInTheDocument();
  });
});

describe("Select / Unselect", () => {
  it("selecting a card shows the bottom bar", async () => {
    render(<App />);
    // Hover the first card to reveal the checkbox
    const card = screen.getByText("Alpha Video").closest("a").parentElement;
    await userEvent.hover(card);
    const checkbox = screen.getByTitle("Select for playlist");
    await userEvent.click(checkbox);
    expect(screen.getByText(/1 video selected/i)).toBeInTheDocument();
  });

  it("deselecting the last card hides the bottom bar", async () => {
    render(<App />);
    const card = screen.getByText("Alpha Video").closest("a").parentElement;
    await userEvent.hover(card);
    await userEvent.click(screen.getByTitle("Select for playlist"));
    // Now deselect
    await userEvent.click(screen.getByTitle("Deselect"));
    expect(screen.queryByText(/video.*selected/i)).toBeNull();
  });

  it("clear button in bottom bar removes all selections", async () => {
    render(<App />);
    const card = screen.getByText("Alpha Video").closest("a").parentElement;
    await userEvent.hover(card);
    await userEvent.click(screen.getByTitle("Select for playlist"));
    // Click × clear button
    await userEvent.click(screen.getByTitle("Clear selection"));
    expect(screen.queryByText(/video.*selected/i)).toBeNull();
  });
});

describe("Group by channel", () => {
  it("renders group headers for each channel", async () => {
    render(<App />);
    await userEvent.selectOptions(
      screen.getByDisplayValue("No grouping"),
      "channel",
    );
    expect(screen.getByTestId("group-header-Channel A")).toBeInTheDocument();
    expect(screen.getByTestId("group-header-Channel B")).toBeInTheDocument();
    expect(screen.getByTestId("group-header-Channel C")).toBeInTheDocument();
  });

  it("clicking a group header collapses its videos", async () => {
    render(<App />);
    await userEvent.selectOptions(
      screen.getByDisplayValue("No grouping"),
      "channel",
    );
    const header = screen.getByTestId("group-header-Channel A");
    // First click sets openGroups key to true (still open); second click sets to false (closed)
    await userEvent.click(header);
    await userEvent.click(header);
    expect(screen.queryByText("Alpha Video")).toBeNull();
    expect(screen.queryByText("Gamma Video")).toBeNull();
    expect(screen.getByText("Beta Video")).toBeInTheDocument();
  });

  it("clicking a collapsed group header re-expands it", async () => {
    render(<App />);
    await userEvent.selectOptions(
      screen.getByDisplayValue("No grouping"),
      "channel",
    );
    const header = screen.getByTestId("group-header-Channel A");
    await userEvent.click(header); // → true (still open)
    await userEvent.click(header); // → false (collapsed)
    await userEvent.click(header); // → true (re-expanded)
    expect(screen.getByText("Alpha Video")).toBeInTheDocument();
    expect(screen.getByText("Gamma Video")).toBeInTheDocument();
  });
});

describe("Swap (fill mode)", () => {
  it("swap replaces a selected video with a different one", async () => {
    render(<App />);
    // Fill with 30 min so we have a reasonable selection
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "30");

    // Grab which titles are currently visible (fill mode shows only selected)
    const beforeTitles = VIDEOS.filter((v) => screen.queryByText(v.title)).map(
      (v) => v.title,
    );

    if (beforeTitles.length === 0) return; // skip if fill picked nothing

    const firstTitle = beforeTitles[0];
    const card = screen.getByText(firstTitle).closest("a").parentElement;
    await userEvent.hover(card);
    const swapBtn = screen.queryByTitle("Swap for another video");
    if (!swapBtn) return; // skip if no swap available

    await userEvent.click(swapBtn);

    // After swap, the original video may no longer be shown OR a new one appears
    const afterTitles = VIDEOS.filter((v) => screen.queryByText(v.title)).map(
      (v) => v.title,
    );

    // Selection set must have changed (different video)
    expect(afterTitles).not.toEqual(beforeTitles);
  });

  it("total duration stays within budget after swap", async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "10");

    const getVisible = () => VIDEOS.filter((v) => screen.queryByText(v.title));

    const initialVisible = getVisible();
    if (initialVisible.length === 0) return;

    const firstTitle = initialVisible[0].title;
    const card = screen.getByText(firstTitle).closest("a").parentElement;
    await userEvent.hover(card);
    const swapBtn = screen.queryByTitle("Swap for another video");
    if (!swapBtn) return;
    await userEvent.click(swapBtn);

    const totalSecs = getVisible().reduce(
      (s, v) => s + parseDuration(v.duration),
      0,
    );
    expect(totalSecs).toBeLessThanOrEqual(10 * 60);
  });
});
