import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoCard } from "../App";

const video = {
  title: "Test Video",
  video_url: "https://www.youtube.com/watch?v=abc123",
  channel_name: "Test Channel",
  duration: "5:30",
  estimated_date: "2024-01-15",
  relative_date: "2 months ago",
  thumbnail_url: "",
};

function renderCard(props = {}) {
  const defaults = {
    video,
    compact: false,
    onRemove: vi.fn(),
    selected: false,
    onToggleSelect: vi.fn(),
    anySelected: false,
    fillMode: false,
    onSwap: vi.fn(),
  };
  return render(<VideoCard {...defaults} {...props} />);
}

describe("VideoCard — hover actions", () => {
  it("shows remove button on hover in normal mode", async () => {
    renderCard();
    const card = screen.getByText("Test Video").closest("div[style]");
    await userEvent.hover(card.parentElement);
    expect(screen.getByTitle("Remove video")).toBeInTheDocument();
  });

  it("does NOT show swap button on hover when fillMode is false", async () => {
    renderCard({ fillMode: false });
    const card = screen.getByText("Test Video").closest("div[style]");
    await userEvent.hover(card.parentElement);
    expect(screen.queryByTitle("Swap for another video")).toBeNull();
  });

  it("shows swap button on hover when fillMode is true", async () => {
    renderCard({ fillMode: true });
    const card = screen.getByText("Test Video").closest("div[style]");
    await userEvent.hover(card.parentElement);
    expect(screen.getByTitle("Swap for another video")).toBeInTheDocument();
  });

  it("hides action buttons when not hovered", () => {
    renderCard();
    expect(screen.queryByTitle("Remove video")).toBeNull();
    expect(screen.queryByTitle("Swap for another video")).toBeNull();
  });
});

describe("VideoCard — checkbox", () => {
  it("does NOT show checkbox before hover when anySelected is false", () => {
    renderCard({ anySelected: false });
    expect(screen.queryByTitle(/Select|Deselect/)).toBeNull();
  });

  it("shows checkbox when anySelected is true (even without hover)", () => {
    renderCard({ anySelected: true });
    expect(screen.getByTitle("Select for playlist")).toBeInTheDocument();
  });

  it("shows checkmark when selected is true", () => {
    renderCard({ anySelected: true, selected: true });
    expect(screen.getByTitle("Deselect")).toBeInTheDocument();
    expect(screen.getByTitle("Deselect")).toHaveTextContent("✓");
  });

  it("calls onToggleSelect when checkbox is clicked", async () => {
    const onToggleSelect = vi.fn();
    renderCard({ anySelected: true, onToggleSelect });
    await userEvent.click(screen.getByTitle("Select for playlist"));
    expect(onToggleSelect).toHaveBeenCalledWith(video);
  });
});

describe("VideoCard — button callbacks", () => {
  it("calls onRemove with the video when remove is clicked", async () => {
    const onRemove = vi.fn();
    renderCard({ onRemove });
    const card = screen.getByText("Test Video").closest("div[style]");
    await userEvent.hover(card.parentElement);
    await userEvent.click(screen.getByTitle("Remove video"));
    expect(onRemove).toHaveBeenCalledWith(video);
  });

  it("calls onSwap with the video when swap is clicked in fill mode", async () => {
    const onSwap = vi.fn();
    renderCard({ fillMode: true, onSwap });
    const card = screen.getByText("Test Video").closest("div[style]");
    await userEvent.hover(card.parentElement);
    await userEvent.click(screen.getByTitle("Swap for another video"));
    expect(onSwap).toHaveBeenCalledWith(video);
  });
});
