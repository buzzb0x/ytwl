import { useState, useRef, useCallback, useEffect } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');`;

function getVideoId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

function parseDuration(str) {
  if (!str) return 0;
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

function formatDuration(str) {
  return str || "—";
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0]
    .match(/(".*?"|[^,]+)/g)
    .map((h) => h.replace(/^"|"$/g, ""));
  return lines
    .slice(1)
    .map((line) => {
      const vals = [];
      let cur = "",
        inQ = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          inQ = !inQ;
          continue;
        }
        if (line[i] === "," && !inQ) {
          vals.push(cur);
          cur = "";
          continue;
        }
        cur += line[i];
      }
      vals.push(cur);
      const obj = {};
      headers.forEach((h, i) => (obj[h] = (vals[i] || "").trim()));
      return obj;
    })
    .filter((r) => r.title);
}

function Thumbnail({ video, compact }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div
      style={{
        position: "relative",
        width: compact ? 140 : "100%",
        minWidth: compact ? 140 : undefined,
        aspectRatio: compact ? undefined : "16/9",
        height: compact ? 82 : undefined,
        background: "#111",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {!imgErr ? (
        <img
          src={video.thumbnail_url}
          alt=""
          onError={() => setImgErr(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 24, opacity: 0.2 }}>▶</span>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 4,
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          padding: "1px 5px",
          borderRadius: 3,
        }}
      >
        {formatDuration(video.duration)}
      </div>
    </div>
  );
}

function VideoCard({
  video,
  compact,
  onRemove,
  selected,
  onToggleSelect,
  anySelected,
}) {
  const [hovered, setHovered] = useState(false);
  const showCheckbox = hovered || anySelected;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: compact ? "row" : "column",
        background: selected
          ? "rgba(255,80,80,0.08)"
          : hovered
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.03)",
        border: `1px solid ${selected ? "rgba(255,80,80,0.45)" : hovered ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 8,
        overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s, transform 0.15s",
        transform: hovered ? "translateY(-1px)" : "none",
        cursor: "default",
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showCheckbox && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(video);
          }}
          title={selected ? "Deselect" : "Select for playlist"}
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            zIndex: 5,
            width: 18,
            height: 18,
            borderRadius: 4,
            background: selected ? "#ff5050" : "rgba(0,0,0,0.75)",
            border: `1px solid ${selected ? "#ff5050" : "rgba(255,255,255,0.3)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 11,
            color: "#fff",
          }}
        >
          {selected ? "✓" : ""}
        </div>
      )}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(video);
          }}
          title="Remove video"
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 5,
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 4,
            color: "#ff5050",
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 13,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      )}
      <Thumbnail video={video} compact={compact} />
      <a
        href={video.video_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: compact ? "8px 10px" : "10px 12px",
          flex: 1,
          minWidth: 0,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: compact ? 12 : 13,
            color: "#f0f0f0",
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: 6,
          }}
        >
          {video.title}
        </div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "#888",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {!compact && (
            <span style={{ color: "#ff5050", opacity: 0.8 }}>
              {video.channel_name}
            </span>
          )}
          <span>{video.estimated_date || video.relative_date}</span>
        </div>
      </a>
    </div>
  );
}

function UploadScreen({ onUpload }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);

  const handle = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          onUpload(parseCSV(e.target.result));
        } catch {
          alert("Failed to parse CSV.");
        }
      };
      reader.readAsText(file);
    },
    [onUpload],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 38,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: -1,
          marginBottom: 8,
        }}
      >
        Watch<span style={{ color: "#ff5050" }}>Later</span>
      </div>
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          color: "#555",
          fontSize: 13,
          marginBottom: 48,
        }}
      >
        your youtube queue, offline
      </div>
      <div
        onClick={() => ref.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files[0]);
        }}
        style={{
          border: `2px dashed ${dragging ? "#ff5050" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 16,
          padding: "64px 80px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging
            ? "rgba(255,80,80,0.05)"
            : "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
          maxWidth: 480,
          width: "100%",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 16 }}>📋</div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            color: "#ccc",
            marginBottom: 8,
          }}
        >
          Drop your CSV here
        </div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            color: "#555",
            fontSize: 12,
          }}
        >
          or click to browse
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={(e) => handle(e.target.files[0])}
      />
    </div>
  );
}

function serializeCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

export default function App() {
  const [videos, setVideos] = useState(() => {
    try {
      const saved = localStorage.getItem("ytwl_videos");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(
    () => localStorage.getItem("ytwl_sortBy") ?? "date_desc",
  );
  const [groupBy, setGroupBy] = useState(
    () => localStorage.getItem("ytwl_groupBy") ?? "none",
  );
  const [view, setView] = useState(
    () => localStorage.getItem("ytwl_view") ?? "grid",
  );
  const [openGroups, setOpenGroups] = useState({});
  const [selectedUrls, setSelectedUrls] = useState(new Set());
  const [fillMode, setFillMode] = useState(false);

  const handleToggleSelect = useCallback((video) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(video.video_url)) next.delete(video.video_url);
      else next.add(video.video_url);
      if (next.size === 0) setFillMode(false);
      return next;
    });
  }, []);

  const playlistUrl = (() => {
    const ids = [...selectedUrls].map(getVideoId).filter(Boolean);
    return ids.length
      ? `https://www.youtube.com/watch_videos?video_ids=${ids.join(",")}`
      : null;
  })();

  useEffect(() => {
    if (videos === null) {
      localStorage.removeItem("ytwl_videos");
    } else {
      localStorage.setItem("ytwl_videos", JSON.stringify(videos));
    }
  }, [videos]);

  useEffect(() => {
    localStorage.setItem("ytwl_sortBy", sortBy);
  }, [sortBy]);
  useEffect(() => {
    localStorage.setItem("ytwl_groupBy", groupBy);
  }, [groupBy]);
  useEffect(() => {
    localStorage.setItem("ytwl_view", view);
  }, [view]);

  const importRef = useRef();

  const handleMerge = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const incoming = parseCSV(e.target.result);
        setVideos((prev) => {
          const existingUrls = new Set(prev.map((v) => v.video_url));
          const newVideos = incoming.filter(
            (v) => !existingUrls.has(v.video_url),
          );
          return [...prev, ...newVideos];
        });
      } catch {
        alert("Failed to parse CSV.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleRemove = useCallback(
    (video) => setVideos((prev) => prev.filter((v) => v !== video)),
    [],
  );

  const handleFill = useCallback(
    (minutes) => {
      const budget = minutes * 60;
      const pool = [...videos].sort(() => Math.random() - 0.5);
      let remaining = budget;
      const picked = new Set();
      for (const v of pool) {
        const dur = parseDuration(v.duration);
        if (dur > 0 && dur <= remaining) {
          picked.add(v.video_url);
          remaining -= dur;
        }
      }
      setSelectedUrls(picked);
      setFillMode(true);
    },
    [videos],
  );

  if (!videos)
    return (
      <>
        <style>{FONTS}</style>
        <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
          <UploadScreen
            onUpload={(data) => {
              setVideos(data);
              setOpenGroups({});
            }}
          />
        </div>
      </>
    );

  const filtered = videos.filter(
    (v) =>
      !search ||
      v.title?.toLowerCase().includes(search.toLowerCase()) ||
      v.channel_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "duration_asc")
      return parseDuration(a.duration) - parseDuration(b.duration);
    if (sortBy === "duration_desc")
      return parseDuration(b.duration) - parseDuration(a.duration);
    if (sortBy === "date_asc")
      return (a.estimated_date || "").localeCompare(b.estimated_date || "");
    if (sortBy === "date_desc")
      return (b.estimated_date || "").localeCompare(a.estimated_date || "");
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return 0;
  });

  const totalSecs = filtered.reduce((s, v) => s + parseDuration(v.duration), 0);
  const totalH = Math.floor(totalSecs / 3600),
    totalM = Math.floor((totalSecs % 3600) / 60);

  const displayed =
    fillMode && selectedUrls.size > 0
      ? sorted.filter((v) => selectedUrls.has(v.video_url))
      : sorted;

  let groups = {};
  if (groupBy === "channel") {
    displayed.forEach((v) => {
      const k = v.channel_name || "Unknown";
      (groups[k] = groups[k] || []).push(v);
    });
  } else if (groupBy === "month") {
    displayed.forEach((v) => {
      const d = v.estimated_date?.slice(0, 7) || "Unknown";
      (groups[d] = groups[d] || []).push(v);
    });
  } else {
    groups = { all: displayed };
  }

  const compact = view === "list";

  const gridStyle = compact
    ? {
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }
    : {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 12,
      };

  const toggleGroup = (k) =>
    setOpenGroups((prev) => ({ ...prev, [k]: !prev[k] }));

  const exportCSV = () => {
    const ordered = Object.values(groups).flat();
    const csv = serializeCSV(ordered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "watch-later.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>
        {FONTS}
        {`* { box-sizing: border-box; }
         ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
         input, select { outline: none; }`}
      </style>
      <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(10,10,10,0.95)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "12px 20px",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  flexShrink: 0,
                }}
              >
                Watch<span style={{ color: "#ff5050" }}>Later</span>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search videos or channels..."
                style={{
                  flex: 1,
                  minWidth: 160,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  padding: "7px 12px",
                  color: "#fff",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexShrink: 0,
                  flexWrap: "wrap",
                }}
              >
                {[
                  {
                    label: "Group",
                    key: "groupBy",
                    value: groupBy,
                    set: setGroupBy,
                    opts: [
                      ["none", "No grouping"],
                      ["channel", "By channel"],
                      ["month", "By month"],
                    ],
                  },
                  {
                    label: "Sort",
                    key: "sortBy",
                    value: sortBy,
                    set: setSortBy,
                    opts: [
                      ["date_desc", "Newest"],
                      ["date_asc", "Oldest"],
                      ["duration_desc", "Longest"],
                      ["duration_asc", "Shortest"],
                      ["title", "A–Z"],
                    ],
                  },
                ].map(({ label, value, set, opts }) => (
                  <select
                    key={label}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      padding: "7px 10px",
                      color: "#ccc",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    {opts.map(([v, l]) => (
                      <option
                        key={v}
                        value={v}
                        style={{ background: "#1a1a1a" }}
                      >
                        {l}
                      </option>
                    ))}
                  </select>
                ))}

                <div
                  style={{
                    display: "flex",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  {[
                    ["grid", "⊞"],
                    ["list", "≡"],
                  ].map(([v, icon]) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      style={{
                        background:
                          view === v ? "rgba(255,80,80,0.2)" : "transparent",
                        border: "none",
                        color: view === v ? "#ff5050" : "#666",
                        padding: "7px 11px",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleFill(Number(e.target.value));
                    e.target.value = "";
                  }}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    padding: "7px 10px",
                    color: "#ccc",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <option value="" style={{ background: "#1a1a1a" }}>
                    ⏱ Fill...
                  </option>
                  {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
                    <option key={m} value={m} style={{ background: "#1a1a1a" }}>
                      {m} min
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => importRef.current.click()}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    color: "#aaa",
                    padding: "7px 11px",
                    cursor: "pointer",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  Import CSV
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept=".csv"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    handleMerge(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={exportCSV}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    color: "#aaa",
                    padding: "7px 11px",
                    cursor: "pointer",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    if (confirm("Clear all videos? This cannot be undone."))
                      setVideos(null);
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,80,80,0.25)",
                    borderRadius: 6,
                    color: "#ff5050",
                    opacity: 0.6,
                    padding: "7px 11px",
                    cursor: "pointer",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#555",
                marginTop: 8,
              }}
            >
              {filtered.length} videos · {totalH}h {totalM}m total
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "20px 20px 60px",
          }}
        >
          {groupBy === "none" ? (
            <div style={gridStyle}>
              {displayed.map((v, i) => (
                <VideoCard
                  key={i}
                  video={v}
                  compact={compact}
                  onRemove={handleRemove}
                  selected={selectedUrls.has(v.video_url)}
                  onToggleSelect={handleToggleSelect}
                  anySelected={selectedUrls.size > 0}
                />
              ))}
            </div>
          ) : (
            Object.entries(groups).map(([groupKey, items]) => {
              const isOpen = openGroups[groupKey] !== false;
              const groupSecs = items.reduce(
                (s, v) => s + parseDuration(v.duration),
                0,
              );
              const gH = Math.floor(groupSecs / 3600),
                gM = Math.floor((groupSecs % 3600) / 60);
              return (
                <div key={groupKey} style={{ marginBottom: 24 }}>
                  <div
                    onClick={() => toggleGroup(groupKey)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                      marginBottom: isOpen ? 14 : 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#eee",
                      }}
                    >
                      {groupKey}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        color: "#555",
                      }}
                    >
                      {items.length} · {gH > 0 ? `${gH}h ` : ""}
                      {gM}m
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "#555",
                        fontSize: 12,
                        transition: "transform 0.2s",
                        transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                        display: "inline-block",
                      }}
                    >
                      ▾
                    </span>
                  </div>
                  {isOpen && (
                    <div style={gridStyle}>
                      {items.map((v, i) => (
                        <VideoCard
                          key={i}
                          video={v}
                          compact={compact}
                          onRemove={handleRemove}
                          selected={selectedUrls.has(v.video_url)}
                          onToggleSelect={handleToggleSelect}
                          anySelected={selectedUrls.size > 0}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedUrls.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            background: "rgba(20,20,20,0.97)",
            border: "1px solid rgba(255,80,80,0.4)",
            borderRadius: 10,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          <span style={{ fontSize: 12, color: "#aaa" }}>
            {selectedUrls.size} video{selectedUrls.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <a
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#ff5050",
              color: "#fff",
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            ▶ Open as Playlist
          </a>
          <button
            onClick={() => {
              setSelectedUrls(new Set());
              setFillMode(false);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#555",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: 0,
            }}
            title="Clear selection"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
