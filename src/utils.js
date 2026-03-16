export function getVideoId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

export function parseDuration(str) {
  if (!str) return 0;
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

export function formatDuration(str) {
  return str || "—";
}

export function parseCSV(text) {
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

export function serializeCSV(rows) {
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
