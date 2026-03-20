import { useRef } from "react";
import {
  Search,
  LayoutGrid,
  List,
  Upload,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import type { SortBy, GroupBy, ViewMode } from "@/types";

interface HeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  sortBy: SortBy;
  onSortChange: (v: SortBy) => void;
  groupBy: GroupBy;
  onGroupChange: (v: GroupBy) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onFill: (minutes: number) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onClear: () => void;
  filteredCount: number;
  totalH: number;
  totalM: number;
}

export function Header({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  groupBy,
  onGroupChange,
  view,
  onViewChange,
  onFill,
  onImport,
  onExport,
  onClear,
  filteredCount,
  totalH,
  totalM,
}: HeaderProps) {
  const importRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-0 z-10 bg-[rgba(10,10,10,0.95)] backdrop-blur-[12px] border-b border-white/7 px-4 sm:px-5 py-3">
      <div className="max-w-[1200px] mx-auto space-y-2">
        {/* Logo + Search + Filter controls — single wrapping row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-syne text-[20px] font-extrabold tracking-tight shrink-0">
            Watch<span className="text-accent">Later</span>
          </div>

          <div className="flex-[3_1_200px] relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dimmed pointer-events-none"
            />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search videos or channels..."
              className="w-full pl-8"
            />
          </div>

          <Select
            value={groupBy}
            onChange={(e) => onGroupChange(e.target.value as GroupBy)}
            className="flex-[1_1_100px]"
          >
            <option value="none" style={{ background: "#1a1a1a" }}>
              No grouping
            </option>
            <option value="channel" style={{ background: "#1a1a1a" }}>
              By channel
            </option>
            <option value="month" style={{ background: "#1a1a1a" }}>
              By month
            </option>
          </Select>

          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortBy)}
            className="flex-[1_1_90px]"
          >
            <option value="date_desc" style={{ background: "#1a1a1a" }}>
              Newest
            </option>
            <option value="date_asc" style={{ background: "#1a1a1a" }}>
              Oldest
            </option>
            <option value="duration_desc" style={{ background: "#1a1a1a" }}>
              Longest
            </option>
            <option value="duration_asc" style={{ background: "#1a1a1a" }}>
              Shortest
            </option>
            <option value="title" style={{ background: "#1a1a1a" }}>
              A–Z
            </option>
            <option value="selection" style={{ background: "#1a1a1a" }}>
              Selection
            </option>
          </Select>

          <div className="flex border border-white/10 rounded-md overflow-hidden shrink-0">
            <button
              onClick={() => onViewChange("grid")}
              className={cn(
                "px-[11px] py-[7px] cursor-pointer border-none transition-colors",
                view === "grid"
                  ? "bg-accent/20 text-accent"
                  : "bg-transparent text-[#666] hover:text-[#aaa]",
              )}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => onViewChange("list")}
              className={cn(
                "px-[11px] py-[7px] cursor-pointer border-none transition-colors",
                view === "list"
                  ? "bg-accent/20 text-accent"
                  : "bg-transparent text-[#666] hover:text-[#aaa]",
              )}
            >
              <List size={14} />
            </button>
          </div>

          <Select
            value=""
            onChange={(e) => {
              if (e.target.value) onFill(Number(e.target.value));
              e.target.value = "";
            }}
            className="flex-[1_1_70px]"
          >
            <option value="" style={{ background: "#1a1a1a" }}>
              ⏱ Fill...
            </option>
            {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
              <option key={m} value={m} style={{ background: "#1a1a1a" }}>
                {m} min
              </option>
            ))}
          </Select>
        </div>

        {/* Stats + Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] text-dimmed whitespace-nowrap flex-1">
            {filteredCount} videos · {totalH}h {totalM}m total
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Upload size={13} />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <input
              ref={importRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                e.target.value = "";
              }}
            />

            <Button
              variant="ghost"
              onClick={onExport}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </Button>

            <Button
              variant="danger"
              onClick={() => {
                if (confirm("Clear all videos? This cannot be undone."))
                  onClear();
              }}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
