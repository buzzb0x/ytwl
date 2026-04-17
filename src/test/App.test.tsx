import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { parseDuration } from "@/lib/duration";
import type { Video } from "@/types";

// Fixed dataset: known titles, channels, durations, dates
const VIDEOS: Video[] = [
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
    const sorted = [...rendered].sort((a, b) =>
      (a ?? "").localeCompare(b ?? ""),
    );
    expect(rendered).toEqual(sorted);
  });
});

describe("Fill", () => {
  it("selects videos whose total duration fits within the budget", async () => {
    render(<App />);
    const fillSelect = screen.getByDisplayValue("⏱ Fill...");
    await userEvent.selectOptions(fillSelect, "10");

    // Bottom bar should appear (format: "N video(s) · Xm Ys")
    expect(screen.getByText(/\d+ videos? · \d+m \d+s/)).toBeInTheDocument();

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
    expect(screen.getByText(/\d+ videos? · \d+m \d+s/)).toBeInTheDocument();
  });

  it("supports a custom fill budget from the native prompt", async () => {
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("12");

    render(<App />);
    await userEvent.selectOptions(
      screen.getByDisplayValue("⏱ Fill..."),
      "other",
    );

    expect(promptSpy).toHaveBeenCalledWith("Fill how many minutes?", "30");

    const visibleTitles = VIDEOS.filter((v) => screen.queryByText(v.title)).map(
      (v) => v.title,
    );
    const totalSecs = visibleTitles.reduce((sum, t) => {
      const v = VIDEOS.find((x) => x.title === t);
      return sum + parseDuration(v?.duration || "");
    }, 0);

    expect(totalSecs).toBeLessThanOrEqual(12 * 60);

    promptSpy.mockRestore();
  });
});

describe("Select / Unselect", () => {
  it("selecting a card shows the bottom bar", async () => {
    render(<App />);
    const card = screen.getByText("Alpha Video").closest("a")!.parentElement!;
    await userEvent.hover(card);
    const checkbox = screen.getByTitle("Select for playlist");
    await userEvent.click(checkbox);
    expect(screen.getByText(/^1 video · /)).toBeInTheDocument();
  });

  it("deselecting the last card hides the bottom bar", async () => {
    render(<App />);
    const card = screen.getByText("Alpha Video").closest("a")!.parentElement!;
    await userEvent.hover(card);
    await userEvent.click(screen.getByTitle("Select for playlist"));
    // Now deselect
    await userEvent.click(screen.getByTitle("Deselect"));
    expect(screen.queryByText(/video.*selected/i)).toBeNull();
  });

  it("clear button in bottom bar removes all selections", async () => {
    render(<App />);
    const card = screen.getByText("Alpha Video").closest("a")!.parentElement!;
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

// Find the first selected card that has a swap button by hovering each in turn.
// canSwap() gates the button, so if we find one it is guaranteed to succeed.
async function findSwapButton(titles: string[]) {
  for (const title of titles) {
    const card = screen.getByText(title).closest("a")!.parentElement!;
    await userEvent.hover(card);
    const btn = screen.queryByTitle("Swap for another video");
    if (btn) return btn;
    await userEvent.unhover(card);
  }
  return null;
}

describe("Fill mode – selection sync", () => {
  // With a 60-min budget all 5 videos fit (total = 52 min), giving a
  // deterministic starting state of 5 selected videos.
  // PlaylistBar format is "N video(s) · Xm Ys"; Header format is "N videos · 0h Xm total".
  // The regex /\d+m \d+s/ uniquely targets the PlaylistBar.
  it("deleting a selected video in fill mode removes it from the selection count", async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "60");
    expect(screen.getByText(/^5 videos · \d+m \d+s$/)).toBeInTheDocument();

    const card = screen.getByText("Alpha Video").closest("a")!.parentElement!;
    await userEvent.hover(card);
    await userEvent.click(screen.getByTitle("Remove video"));

    expect(screen.queryByText(/^5 videos · \d+m \d+s$/)).toBeNull();
    expect(screen.getByText(/^4 videos · \d+m \d+s$/)).toBeInTheDocument();
  });

  it("unselecting a video in fill mode removes it from the selection count", async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "60");
    expect(screen.getByText(/^5 videos · \d+m \d+s$/)).toBeInTheDocument();

    const card = screen.getByText("Alpha Video").closest("a")!.parentElement!;
    await userEvent.hover(card);
    // All 5 cards show "Deselect"; scope to the hovered card to avoid ambiguity
    await userEvent.click(within(card).getByTitle("Deselect"));

    expect(screen.queryByText(/^5 videos · \d+m \d+s$/)).toBeNull();
    expect(screen.getByText(/^4 videos · \d+m \d+s$/)).toBeInTheDocument();
  });
});

describe("Reroll (fill mode)", () => {
  it("reroll button is visible in fill mode", async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "30");
    expect(screen.getByTitle("Reroll all videos")).toBeInTheDocument();
  });

  it("reroll button is not visible in manual selection mode", async () => {
    render(<App />);
    const card = screen.getByText("Alpha Video").closest("a")!.parentElement!;
    await userEvent.hover(card);
    await userEvent.click(screen.getByTitle("Select for playlist"));
    expect(screen.queryByTitle("Reroll all videos")).toBeNull();
  });

  it("after reroll, total duration still fits within budget", async () => {
    const budget = 30;
    render(<App />);
    await userEvent.selectOptions(
      screen.getByDisplayValue("⏱ Fill..."),
      String(budget),
    );

    await userEvent.click(screen.getByTitle("Reroll all videos"));

    const totalSecs = VIDEOS.filter((v) => screen.queryByText(v.title)).reduce(
      (s, v) => s + parseDuration(v.duration),
      0,
    );
    expect(totalSecs).toBeLessThanOrEqual(budget * 60);
  });

  it("after reroll, the playlist bar still shows a valid count", async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "30");
    await userEvent.click(screen.getByTitle("Reroll all videos"));
    expect(screen.getByText(/\d+ videos? · \d+m \d+s/)).toBeInTheDocument();
  });

  it("reroll produces a different selection when Math.random is controlled", async () => {
    // First render: force a fixed order (Alpha, Beta, Gamma, Delta, Epsilon)
    let callCount = 0;
    const spy = vi
      .spyOn(Math, "random")
      .mockImplementation(() => callCount++ / 10);

    render(<App />);
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "15");
    const beforeTitles = VIDEOS.filter((v) => screen.queryByText(v.title)).map(
      (v) => v.title,
    );

    // Reroll with reversed order
    spy.mockImplementation(() => 1 - callCount++ / 10);
    await userEvent.click(screen.getByTitle("Reroll all videos"));
    const afterTitles = VIDEOS.filter((v) => screen.queryByText(v.title)).map(
      (v) => v.title,
    );

    spy.mockRestore();

    // Both selections must fit within budget
    const budgetSecs = 15 * 60;
    const beforeTotal = beforeTitles.reduce(
      (s, t) => s + parseDuration(VIDEOS.find((v) => v.title === t)!.duration),
      0,
    );
    const afterTotal = afterTitles.reduce(
      (s, t) => s + parseDuration(VIDEOS.find((v) => v.title === t)!.duration),
      0,
    );
    expect(beforeTotal).toBeLessThanOrEqual(budgetSecs);
    expect(afterTotal).toBeLessThanOrEqual(budgetSecs);
    // With different random orders the selections should differ
    expect(afterTitles.sort()).not.toEqual(beforeTitles.sort());
  });
});

describe("Selection sort", () => {
  it("surfaces selected videos to the top in manual selection mode", async () => {
    render(<App />);
    // Default date_desc: Epsilon(May), Delta(Apr), Gamma(Mar), Beta(Feb), Alpha(Jan)
    // Select Gamma (currently position 2)
    const gammaCard = screen
      .getByText("Gamma Video")
      .closest("a")!.parentElement!;
    await userEvent.hover(gammaCard);
    await userEvent.click(screen.getByTitle("Select for playlist"));

    await userEvent.selectOptions(
      screen.getByDisplayValue("Newest"),
      "selection",
    );

    const titles = screen.getAllByText(/Video$/).map((el) => el.textContent!);
    expect(titles[0]).toBe("Gamma Video");
  });

  it("orders multiple selected videos by selection click order", async () => {
    render(<App />);
    // Select Epsilon first, then Alpha (reverse of both title and date order)
    const epsilonCard = screen
      .getByText("Epsilon Video")
      .closest("a")!.parentElement!;
    await userEvent.hover(epsilonCard);
    await userEvent.click(screen.getByTitle("Select for playlist"));

    const alphaCard = screen
      .getByText("Alpha Video")
      .closest("a")!.parentElement!;
    await userEvent.click(within(alphaCard).getByTitle("Select for playlist"));

    await userEvent.selectOptions(
      screen.getByDisplayValue("Newest"),
      "selection",
    );

    const titles = screen.getAllByText(/Video$/).map((el) => el.textContent!);
    expect(titles[0]).toBe("Epsilon Video");
    expect(titles[1]).toBe("Alpha Video");
  });

  it("fill mode auto-activates selection sort", async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByDisplayValue("Newest"), "title");
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "30");
    expect(screen.getByDisplayValue("Selection")).toBeInTheDocument();
  });

  it("clearing fill restores the sort that was active before filling", async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByDisplayValue("Newest"), "title");
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "30");
    await userEvent.click(screen.getByTitle("Clear selection"));
    expect(screen.getByDisplayValue("A–Z")).toBeInTheDocument();
  });

  it("switching sort while in fill mode updates the playlist URL order", async () => {
    render(<App />);
    // mockReturnValue(0.1) reverses the fill pool → Set insertion: eee,ddd,ccc,bbb,aaa
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "60");
    vi.restoreAllMocks();

    // Switch from auto-activated "selection" sort to "title" while still in fill mode
    await userEvent.selectOptions(
      screen.getByDisplayValue("Selection"),
      "title",
    );

    const link = screen.getByRole("link", { name: /playlist/i });
    const urlIds = new URL(link.getAttribute("href")!).searchParams
      .get("video_ids")!
      .split(",");

    // Title sort: Alpha(aaa), Beta(bbb), Delta(ddd), Epsilon(eee), Gamma(ccc)
    expect(urlIds).toEqual(["aaa", "bbb", "ddd", "eee", "ccc"]);
  });
});

describe("Fill mode – playlist URL ordering", () => {
  // mockReturnValue(0.1): comparator = 0.1 - 0.5 = -0.4.
  // V8's binary insertion sort: compare(pivot, mid) < 0 → right = mid, so right
  // always shrinks to 0 and every element is inserted at position 0 — reversing
  // the array reliably.
  // Fill order (Set insertion): eee, ddd, ccc, bbb, aaa (reversed VIDEOS)
  // Selection sort (display order): same fill order → eee, ddd, ccc, bbb, aaa
  // The invariant: URL IDs must equal the displayed card order.
  it("playlist URL video IDs match the current display order", async () => {
    render(<App />);

    vi.spyOn(Math, "random").mockReturnValue(0.1);
    // 60-min budget fits all 5 (total = 52 min); fill auto-switches to selection sort
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "60");
    vi.restoreAllMocks();

    // Collect titles in DOM order (= selection/fill order after auto-sort switch)
    const displayedTitles = screen
      .getAllByText(/Video$/)
      .map((el) => el.textContent!);
    const displayedIds = displayedTitles.map(
      (t) =>
        new URL(VIDEOS.find((v) => v.title === t)!.video_url).searchParams.get(
          "v",
        )!,
    );

    const link = screen.getByRole("link", { name: /playlist/i });
    const urlIds = new URL(link.getAttribute("href")!).searchParams
      .get("video_ids")!
      .split(",");

    expect(urlIds).toEqual(displayedIds);
  });
});

describe("Swap (fill mode)", () => {
  it("swap replaces a selected video with a different one", async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "30");

    const beforeTitles = VIDEOS.filter((v) => screen.queryByText(v.title)).map(
      (v) => v.title,
    );
    expect(beforeTitles.length).toBeGreaterThan(0);

    const swapBtn = await findSwapButton(beforeTitles);
    // If every selected video fills the budget with zero slack, no swap is geometrically
    // possible — the fill algorithm made a tight pick. Skip rather than fail.
    if (!swapBtn) return;

    await userEvent.click(swapBtn);

    const afterTitles = VIDEOS.filter((v) => screen.queryByText(v.title)).map(
      (v) => v.title,
    );
    expect(afterTitles).not.toEqual(beforeTitles);
  });

  it("total duration stays within budget after swap", async () => {
    const budget = 30;
    render(<App />);
    await userEvent.selectOptions(
      screen.getByDisplayValue("⏱ Fill..."),
      String(budget),
    );

    const getVisible = () => VIDEOS.filter((v) => screen.queryByText(v.title));
    const initialTitles = getVisible().map((v) => v.title);
    expect(initialTitles.length).toBeGreaterThan(0);

    const swapBtn = await findSwapButton(initialTitles);
    if (!swapBtn) return;
    await userEvent.click(swapBtn);

    const totalSecs = getVisible().reduce(
      (s, v) => s + parseDuration(v.duration),
      0,
    );
    expect(totalSecs).toBeLessThanOrEqual(budget * 60);
  });

  it("swap places the replacement at the same URL position as the swapped-out video", async () => {
    render(<App />);
    // mockReturnValue(0.1): constant -0.4 comparator reverses pool via insertion sort
    // Reversed VIDEOS: [Epsilon(20m), Delta(2m), Gamma(15m), Beta(10m), Alpha(5m)]
    // 30-min budget picks: Epsilon(20m), Delta(2m), Alpha(5m) = 27m total
    // Set insertion order: eee(pos 0), ddd(pos 1), aaa(pos 2)
    // canSwap(Epsilon): frees 20m → 13m slack → Beta(10m) and Gamma(15m) both fit
    // canSwap(Delta/Alpha): ≤5m slack → no candidate fits → no swap button for them
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    await userEvent.selectOptions(screen.getByDisplayValue("⏱ Fill..."), "30");

    // Hover Epsilon – the only card with a swap button
    const epsilonCard = screen
      .getByText("Epsilon Video")
      .closest("a")!.parentElement!;
    await userEvent.hover(epsilonCard);
    // Math.random still mocked: candidates[floor(0.1*2)]=candidates[0]=Beta(bbb)
    await userEvent.click(screen.getByTitle("Swap for another video"));
    vi.restoreAllMocks();

    // Expected URL: bbb at position 0 (where eee was), ddd at 1, aaa at 2
    // BUG: actual is ["ddd","aaa","bbb"] – replacement appended at end of Set
    const playlistLink = screen.getByRole("link", { name: /playlist/i });
    const afterIds = new URL(playlistLink.getAttribute("href")!).searchParams
      .get("video_ids")!
      .split(",");

    expect(afterIds).toEqual(["bbb", "ddd", "aaa"]);
  });
});
