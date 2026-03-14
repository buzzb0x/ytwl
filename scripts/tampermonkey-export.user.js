// ==UserScript==
// @name         YouTube Watch Later - Export to CSV
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Exports your YouTube Watch Later playlist to a CSV file
// @author       You
// @match        https://www.youtube.com/playlist?list=WL*
// @grant        none
// ==/UserScript==
(function () {
  'use strict';
  var CRLF = String.fromCharCode(13, 10);
  var BOM  = String.fromCharCode(0xFEFF);
  function estimateAbsoluteDate(relative) {
    var now = new Date();
    var re = new RegExp('([0-9]+)[ ]+(second|minute|hour|day|week|month|year)s?[ ]+ago', 'i');
    var match = relative.match(re);
    if (!match) return '';
    var num = parseInt(match[1], 10);
    var unit = match[2].toLowerCase();
    var result = new Date(now);
    if      (unit === 'second') result.setSeconds(result.getSeconds() - num);
    else if (unit === 'minute') result.setMinutes(result.getMinutes() - num);
    else if (unit === 'hour')   result.setHours(result.getHours() - num);
    else if (unit === 'day')    result.setDate(result.getDate() - num);
    else if (unit === 'week')   result.setDate(result.getDate() - num * 7);
    else if (unit === 'month')  result.setMonth(result.getMonth() - num);
    else if (unit === 'year')   result.setFullYear(result.getFullYear() - num);
    return result.toISOString().split('T')[0];
  }
  function csvEscape(value) {
    var str = (value == null ? '' : String(value)).replace(/"/g, '""');
    return '"' + str + '"';
  }
  function extractRow(el) {
    var d = el.data || el.__data;
    if (!d || !d.videoId) return null;
    var videoId      = d.videoId;
    var videoUrl     = 'https://www.youtube.com/watch?v=' + videoId;
    var title        = (d.title && d.title.runs && d.title.runs[0] && d.title.runs[0].text) || (d.title && d.title.simpleText) || '';
    var duration     = (d.lengthText && d.lengthText.simpleText) || '';
    var thumbs       = (d.thumbnail && d.thumbnail.thumbnails) || [];
    var thumbnailUrl = thumbs.length ? (thumbs[thumbs.length - 1].url || '').split('?')[0] : '';
    var channelRun   = d.shortBylineText && d.shortBylineText.runs && d.shortBylineText.runs[0];
    var channelName  = channelRun ? channelRun.text : '';
    var channelPath  = (channelRun && channelRun.navigationEndpoint && channelRun.navigationEndpoint.browseEndpoint && channelRun.navigationEndpoint.browseEndpoint.canonicalBaseUrl)
                    || (channelRun && channelRun.navigationEndpoint && channelRun.navigationEndpoint.commandMetadata && channelRun.navigationEndpoint.commandMetadata.webCommandMetadata && channelRun.navigationEndpoint.commandMetadata.webCommandMetadata.url)
                    || '';
    var channelUrl   = channelPath ? 'https://www.youtube.com' + channelPath : '';
    var infoRuns     = (d.videoInfo && d.videoInfo.runs) || [];
    var relativeDate = (infoRuns[2] && infoRuns[2].text) || '';
    var estimatedDate = estimateAbsoluteDate(relativeDate);
    return [title, videoUrl, duration, thumbnailUrl, channelName, channelUrl, relativeDate, estimatedDate]
      .map(csvEscape).join(',');
  }
  function downloadCSV(content, filename) {
    var blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function getFilename() {
    var now = new Date();
    var pad = function(n) { return String(n).padStart(2, '0'); };
    var datePart = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    var timePart = pad(now.getHours()) + '-' + pad(now.getMinutes()) + '-' + pad(now.getSeconds());
    return 'youtube-watch-later_' + datePart + '_' + timePart + '.csv';
  }
  function runExport() {
    var items = document.querySelectorAll('ytd-playlist-video-renderer');
    if (items.length === 0) {
      alert('No Watch Later items found. Make sure the playlist has fully loaded.');
      return;
    }
    var header = ['title', 'video_url', 'duration', 'thumbnail_url', 'channel_name', 'channel_url', 'relative_date', 'estimated_date']
      .map(csvEscape).join(',');
    var rows = [];
    for (var i = 0; i < items.length; i++) {
      var row = extractRow(items[i]);
      if (row) rows.push(row);
    }
    var csv = [header].concat(rows).join(CRLF);
    downloadCSV(csv, getFilename());
    console.log('[WL Export] Done - ' + rows.length + ' videos exported.');
  }
  function injectButton() {
    if (document.getElementById('wl-export-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'wl-export-btn';
    btn.textContent = 'Export CSV';
    btn.style.position   = 'fixed';
    btn.style.bottom     = '24px';
    btn.style.right      = '24px';
    btn.style.zIndex     = '9999';
    btn.style.padding    = '10px 18px';
    btn.style.background = '#ff0000';
    btn.style.color      = '#fff';
    btn.style.border     = 'none';
    btn.style.borderRadius = '6px';
    btn.style.fontSize   = '14px';
    btn.style.fontWeight = 'bold';
    btn.style.cursor     = 'pointer';
    btn.addEventListener('mouseenter', function() { btn.style.background = '#cc0000'; });
    btn.addEventListener('mouseleave', function() { btn.style.background = '#ff0000'; });
    btn.addEventListener('click', runExport);
    document.body.appendChild(btn);
  }
  var observer = new MutationObserver(function() {
    if (document.querySelector('ytd-playlist-video-renderer')) injectButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.querySelector('ytd-playlist-video-renderer')) injectButton();
})();