// ==UserScript==
// @name         YouTube Watch Later - Export to CSV
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Exports your YouTube Watch Later playlist to a CSV file, with optional per-video selection
// @author       You
// @match        https://www.youtube.com/playlist?list=WL*
// @grant        none
// ==/UserScript==
(function () {
  "use strict";
  var CRLF = String.fromCharCode(13, 10);
  var BOM = String.fromCharCode(0xfeff);
  /* ── helpers ─────────────────────────────────────────────────────── */
  function estimateAbsoluteDate(relative) {
    var now = new Date();
    var re = /([0-9]+)[ ]+(second|minute|hour|day|week|month|year)s?[ ]+ago/i;
    var match = relative.match(re);
    if (!match) return "";
    var num = parseInt(match[1], 10);
    var unit = match[2].toLowerCase();
    var result = new Date(now);
    if (unit === "second") result.setSeconds(result.getSeconds() - num);
    else if (unit === "minute") result.setMinutes(result.getMinutes() - num);
    else if (unit === "hour") result.setHours(result.getHours() - num);
    else if (unit === "day") result.setDate(result.getDate() - num);
    else if (unit === "week") result.setDate(result.getDate() - num * 7);
    else if (unit === "month") result.setMonth(result.getMonth() - num);
    else if (unit === "year") result.setFullYear(result.getFullYear() - num);
    return result.toISOString().split("T")[0];
  }
  function csvEscape(value) {
    var str = (value == null ? "" : String(value)).replace(/"/g, '""');
    return '"' + str + '"';
  }
  function extractRow(el) {
    var d = el.data || el.__data;
    if (!d || !d.videoId) return null;
    var videoId = d.videoId;
    var videoUrl = "https://www.youtube.com/watch?v=" + videoId;
    var title =
      (d.title && d.title.runs && d.title.runs[0] && d.title.runs[0].text) ||
      (d.title && d.title.simpleText) ||
      "";
    var duration = (d.lengthText && d.lengthText.simpleText) || "";
    var thumbs = (d.thumbnail && d.thumbnail.thumbnails) || [];
    var thumbnailUrl = thumbs.length
      ? (thumbs[thumbs.length - 1].url || "").split("?")[0]
      : "";
    var channelRun =
      d.shortBylineText && d.shortBylineText.runs && d.shortBylineText.runs[0];
    var channelName = channelRun ? channelRun.text : "";
    var channelPath =
      (channelRun &&
        channelRun.navigationEndpoint &&
        channelRun.navigationEndpoint.browseEndpoint &&
        channelRun.navigationEndpoint.browseEndpoint.canonicalBaseUrl) ||
      (channelRun &&
        channelRun.navigationEndpoint &&
        channelRun.navigationEndpoint.commandMetadata &&
        channelRun.navigationEndpoint.commandMetadata.webCommandMetadata &&
        channelRun.navigationEndpoint.commandMetadata.webCommandMetadata.url) ||
      "";
    var channelUrl = channelPath ? "https://www.youtube.com" + channelPath : "";
    var infoRuns = (d.videoInfo && d.videoInfo.runs) || [];
    var relativeDate = (infoRuns[2] && infoRuns[2].text) || "";
    var estimatedDate = estimateAbsoluteDate(relativeDate);
    return [
      title,
      videoUrl,
      duration,
      thumbnailUrl,
      channelName,
      channelUrl,
      relativeDate,
      estimatedDate,
    ]
      .map(csvEscape)
      .join(",");
  }
  function downloadCSV(content, filename) {
    var blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function getFilename() {
    var now = new Date();
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    var datePart =
      now.getFullYear() +
      "-" +
      pad(now.getMonth() + 1) +
      "-" +
      pad(now.getDate());
    var timePart =
      pad(now.getHours()) +
      "-" +
      pad(now.getMinutes()) +
      "-" +
      pad(now.getSeconds());
    return "youtube-watch-later_" + datePart + "_" + timePart + ".csv";
  }
  /* ── selection state ─────────────────────────────────────────────── */
  // We key selections by videoId so they survive DOM re-renders
  var selectedIds = new Set();
  // CSV comparison state: Set of video IDs from loaded CSV, or null if none loaded
  var csvVideoIds = null;
  var csvFilename = "";
  function updateCountLabel() {
    var lbl = document.getElementById("wl-export-count");
    if (lbl) lbl.textContent = selectedIds.size + " selected";
  }
  /* ── CSV comparison helpers ──────────────────────────────────────── */
  function parseCsvToIdSet(text) {
    // Strip UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    // State machine CSV parser
    var records = [];
    var curRecord = [];
    var curField = "";
    var state = 0; // 0=FIELD_START, 1=IN_UNQUOTED, 2=IN_QUOTED, 3=AFTER_CLOSE_QUOTE
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (state === 0) {
        if (ch === '"') { state = 2; }
        else if (ch === ",") { curRecord.push(curField); curField = ""; state = 0; }
        else if (ch === "\r" || ch === "\n") {
          if (ch === "\r" && text[i + 1] === "\n") i++;
          curRecord.push(curField); curField = "";
          records.push(curRecord); curRecord = []; state = 0;
        } else { curField += ch; state = 1; }
      } else if (state === 1) {
        if (ch === ",") { curRecord.push(curField); curField = ""; state = 0; }
        else if (ch === "\r" || ch === "\n") {
          if (ch === "\r" && text[i + 1] === "\n") i++;
          curRecord.push(curField); curField = "";
          records.push(curRecord); curRecord = []; state = 0;
        } else { curField += ch; }
      } else if (state === 2) {
        if (ch === '"') {
          if (text[i + 1] === '"') { curField += '"'; i++; }
          else { state = 3; }
        } else { curField += ch; }
      } else if (state === 3) {
        if (ch === ",") { curRecord.push(curField); curField = ""; state = 0; }
        else if (ch === "\r" || ch === "\n") {
          if (ch === "\r" && text[i + 1] === "\n") i++;
          curRecord.push(curField); curField = "";
          records.push(curRecord); curRecord = []; state = 0;
        }
      }
    }
    // Flush remaining
    if (curField || curRecord.length) { curRecord.push(curField); records.push(curRecord); }
    if (records.length < 1) return new Set();
    // Find video_url column index
    var header = records[0];
    var urlIdx = -1;
    for (var h = 0; h < header.length; h++) {
      if (header[h].trim().toLowerCase() === "video_url") { urlIdx = h; break; }
    }
    if (urlIdx === -1) return null;
    // Extract video IDs
    var ids = new Set();
    for (var r = 1; r < records.length; r++) {
      var url = (records[r][urlIdx] || "").trim();
      if (!url) continue;
      var id = null;
      try {
        var u = new URL(url);
        if (u.hostname === "youtu.be") id = u.pathname.slice(1);
        else id = u.searchParams.get("v");
      } catch (e) {
        var m = url.match(/[?&]v=([^&]+)/);
        if (m) id = m[1];
      }
      if (id) ids.add(id);
    }
    return ids;
  }
  function applyHighlights() {
    if (csvVideoIds === null) return;
    var items = document.querySelectorAll("ytd-playlist-video-renderer");
    items.forEach(function (el) {
      var d = el.data || el.__data;
      if (!d || !d.videoId) return;
      var existing = el.querySelector(".wl-csv-highlight");
      if (!csvVideoIds.has(d.videoId)) {
        if (!existing) {
          var ribbon = document.createElement("div");
          ribbon.className = "wl-csv-highlight";
          ribbon.style.cssText = [
            "position:absolute",
            "top:0",
            "left:0",
            "bottom:0",
            "width:5px",
            "background:#ff4444",
            "z-index:10",
            "pointer-events:none",
            "border-radius:0 3px 3px 0",
          ].join(";");
          el.style.position = "relative";
          el.appendChild(ribbon);
        }
      } else {
        if (existing) existing.parentNode.removeChild(existing);
      }
    });
  }
  function clearHighlights() {
    var existing = document.querySelectorAll(".wl-csv-highlight");
    existing.forEach(function (el) { el.parentNode.removeChild(el); });
  }
  function updateCsvLabel() {
    var lbl = document.getElementById("wl-csv-count");
    var clearBtn = document.getElementById("wl-csv-clear-btn");
    if (!lbl || !clearBtn) return;
    if (csvVideoIds === null) {
      lbl.style.display = "none";
      clearBtn.style.display = "none";
      return;
    }
    var items = document.querySelectorAll("ytd-playlist-video-renderer");
    var notInCsv = 0;
    items.forEach(function (el) {
      var d = el.data || el.__data;
      if (d && d.videoId && !csvVideoIds.has(d.videoId)) notInCsv++;
    });
    lbl.textContent = notInCsv + " not in CSV (visible)";
    lbl.style.display = "block";
    clearBtn.style.display = "block";
  }
  function runClearCsv() {
    csvVideoIds = null;
    csvFilename = "";
    clearHighlights();
    updateCsvLabel();
    console.log("[WL Export] CSV comparison cleared.");
  }
  /* ── checkbox injection ──────────────────────────────────────────── */
  function injectCheckboxes() {
    var items = document.querySelectorAll("ytd-playlist-video-renderer");
    items.forEach(function (el) {
      // Avoid duplicating
      if (el.querySelector(".wl-checkbox")) return;
      var d = el.data || el.__data;
      if (!d || !d.videoId) return;
      var videoId = d.videoId;
      var wrapper = document.createElement("label");
      wrapper.style.cssText = [
        "position:absolute",
        "top:8px",
        "left:8px",
        "z-index:100",
        "cursor:pointer",
        "background:rgba(0,0,0,0.55)",
        "border-radius:4px",
        "padding:3px 5px",
        "display:flex",
        "align-items:center",
        "gap:4px",
        "user-select:none",
      ].join(";");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "wl-checkbox";
      cb.dataset.videoId = videoId;
      cb.checked = selectedIds.has(videoId);
      cb.style.cssText =
        "width:16px;height:16px;cursor:pointer;accent-color:#ff0000;";
      cb.addEventListener("change", function (e) {
        e.stopPropagation();
        if (cb.checked) selectedIds.add(videoId);
        else selectedIds.delete(videoId);
        updateCountLabel();
      });
      // Prevent the label click from navigating to the video
      wrapper.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      wrapper.appendChild(cb);
      wrapper.appendChild(
        Object.assign(document.createElement("span"), {
          textContent: "✓",
          style: "color:#fff;font-size:11px;pointer-events:none;",
        }),
      );
      // Make the item container relatively positioned so we can anchor the label
      el.style.position = "relative";
      el.appendChild(wrapper);
    });
  }
  /* ── export functions ────────────────────────────────────────────── */
  var HEADER = [
    "title",
    "video_url",
    "duration",
    "thumbnail_url",
    "channel_name",
    "channel_url",
    "relative_date",
    "estimated_date",
  ]
    .map(csvEscape)
    .join(",");
  function runExportAll() {
    var items = document.querySelectorAll("ytd-playlist-video-renderer");
    if (items.length === 0) {
      alert(
        "No Watch Later items found. Make sure the playlist has fully loaded.",
      );
      return;
    }
    var rows = [];
    items.forEach(function (el) {
      var row = extractRow(el);
      if (row) rows.push(row);
    });
    downloadCSV([HEADER].concat(rows).join(CRLF), getFilename());
    console.log("[WL Export] All done - " + rows.length + " videos exported.");
  }
  function runExportSelected() {
    if (selectedIds.size === 0) {
      alert(
        "No videos selected. Use the checkboxes on each video to make a selection.",
      );
      return;
    }
    var items = document.querySelectorAll("ytd-playlist-video-renderer");
    var rows = [];
    items.forEach(function (el) {
      var d = el.data || el.__data;
      if (!d || !d.videoId) return;
      if (!selectedIds.has(d.videoId)) return;
      var row = extractRow(el);
      if (row) rows.push(row);
    });
    if (rows.length === 0) {
      alert(
        "Could not find data for the selected videos. Try scrolling through the list first.",
      );
      return;
    }
    downloadCSV([HEADER].concat(rows).join(CRLF), getFilename());
    console.log(
      "[WL Export] Selected done - " + rows.length + " videos exported.",
    );
  }
  /* ── UI panel ────────────────────────────────────────────────────── */
  function injectUI() {
    if (document.getElementById("wl-export-panel")) return;
    var panel = document.createElement("div");
    panel.id = "wl-export-panel";
    panel.style.cssText = [
      "position:fixed",
      "bottom:24px",
      "right:24px",
      "z-index:9999",
      "display:flex",
      "flex-direction:column",
      "align-items:stretch",
      "gap:6px",
      "background:#1a1a1a",
      "border:1px solid #444",
      "border-radius:8px",
      "padding:10px 12px",
      "font-family:Roboto,Arial,sans-serif",
      "box-shadow:0 4px 16px rgba(0,0,0,0.5)",
    ].join(";");
    /* --- select-all toggle --- */
    var toggleLabel = document.createElement("label");
    toggleLabel.style.cssText =
      "display:flex;align-items:center;gap:8px;cursor:pointer;color:#ccc;font-size:13px;";
    var toggleCb = document.createElement("input");
    toggleCb.type = "checkbox";
    toggleCb.id = "wl-select-all";
    toggleCb.style.cssText =
      "width:15px;height:15px;cursor:pointer;accent-color:#ff0000;";
    toggleCb.addEventListener("change", function () {
      var checked = toggleCb.checked;
      var items = document.querySelectorAll("ytd-playlist-video-renderer");
      items.forEach(function (el) {
        var d = el.data || el.__data;
        if (!d || !d.videoId) return;
        if (checked) selectedIds.add(d.videoId);
        else selectedIds.delete(d.videoId);
        var cb = el.querySelector(".wl-checkbox");
        if (cb) cb.checked = checked;
      });
      updateCountLabel();
    });
    toggleLabel.appendChild(toggleCb);
    toggleLabel.appendChild(document.createTextNode("Select All"));
    /* --- count label --- */
    var countLbl = document.createElement("span");
    countLbl.id = "wl-export-count";
    countLbl.textContent = "0 selected";
    countLbl.style.cssText = "color:#aaa;font-size:12px;text-align:center;";
    /* --- Export Selected button --- */
    var btnSelected = makeButton(
      "Export Selected",
      "#ff0000",
      "#cc0000",
      runExportSelected,
    );
    /* --- Export All button --- */
    var btnAll = makeButton("Export All", "#444", "#333", runExportAll);
    panel.appendChild(toggleLabel);
    panel.appendChild(countLbl);
    panel.appendChild(btnSelected);
    panel.appendChild(btnAll);
    /* --- CSV comparison section --- */
    var sep = document.createElement("hr");
    sep.style.cssText = "border:none;border-top:1px solid #333;margin:4px 0;";
    /* Hidden file input appended to body (not panel) to avoid fixed-position quirks */
    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.id = "wl-csv-file-input";
    fileInput.style.cssText = "display:none;";
    document.body.appendChild(fileInput);
    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      csvFilename = file.name;
      var reader = new FileReader();
      reader.onload = function (e) {
        var text = e.target.result;
        var ids = parseCsvToIdSet(text);
        if (ids === null) {
          alert('[WL Export] Could not find a "video_url" column.\nMake sure you are loading a CSV exported by this script or the webapp.');
          fileInput.value = "";
          return;
        }
        if (ids.size === 0) {
          alert("[WL Export] The loaded CSV contained no recognizable YouTube video URLs.");
          fileInput.value = "";
          return;
        }
        csvVideoIds = ids;
        console.log("[WL Export] CSV loaded: " + ids.size + ' video IDs from "' + csvFilename + '"');
        clearHighlights();
        applyHighlights();
        updateCsvLabel();
        fileInput.value = "";
      };
      reader.readAsText(file);
    });
    var btnLoadCsv = makeButton("Load CSV", "#1a6b3a", "#145530", function () {
      fileInput.click();
    });
    var csvCountLbl = document.createElement("span");
    csvCountLbl.id = "wl-csv-count";
    csvCountLbl.style.cssText = "color:#ff9999;font-size:12px;text-align:center;display:none;";
    var btnClearCsv = makeButton("Clear CSV", "#555", "#444", runClearCsv);
    btnClearCsv.id = "wl-csv-clear-btn";
    btnClearCsv.style.display = "none";
    panel.appendChild(sep);
    panel.appendChild(btnLoadCsv);
    panel.appendChild(csvCountLbl);
    panel.appendChild(btnClearCsv);
    document.body.appendChild(panel);
  }
  function makeButton(text, bg, bgHover, handler) {
    var btn = document.createElement("button");
    btn.textContent = text;
    btn.style.cssText = [
      "padding:8px 14px",
      "background:" + bg,
      "color:#fff",
      "border:none",
      "border-radius:5px",
      "font-size:13px",
      "font-weight:bold",
      "cursor:pointer",
      "text-align:center",
    ].join(";");
    btn.addEventListener("mouseenter", function () {
      btn.style.background = bgHover;
    });
    btn.addEventListener("mouseleave", function () {
      btn.style.background = bg;
    });
    btn.addEventListener("click", handler);
    return btn;
  }
  /* ── mutation observer ───────────────────────────────────────────── */
  var observerTimer = null;
  var observer = new MutationObserver(function () {
    if (observerTimer) clearTimeout(observerTimer);
    observerTimer = setTimeout(function () {
      if (document.querySelector("ytd-playlist-video-renderer")) {
        injectUI();
        injectCheckboxes();
        applyHighlights();
        updateCsvLabel();
      }
    }, 150);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.querySelector("ytd-playlist-video-renderer")) {
    injectUI();
    injectCheckboxes();
    applyHighlights();
    updateCsvLabel();
  }
})();
