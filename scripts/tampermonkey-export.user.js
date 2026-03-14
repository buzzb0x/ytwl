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
  function updateCountLabel() {
    var lbl = document.getElementById("wl-export-count");
    if (lbl) lbl.textContent = selectedIds.size + " selected";
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
  var observer = new MutationObserver(function () {
    if (document.querySelector("ytd-playlist-video-renderer")) {
      injectUI();
      injectCheckboxes();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.querySelector("ytd-playlist-video-renderer")) {
    injectUI();
    injectCheckboxes();
  }
})();
