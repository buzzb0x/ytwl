export interface Video {
  title: string;
  video_url: string;
  thumbnail_url: string;
  duration: string;
  channel_name: string;
  estimated_date: string;
  relative_date: string;
}

export type SortBy =
  | "date_desc"
  | "date_asc"
  | "duration_desc"
  | "duration_asc"
  | "title";

export type GroupBy = "none" | "channel" | "month";

export type ViewMode = "grid" | "list";

export type VideoGroups = Record<string, Video[]>;
