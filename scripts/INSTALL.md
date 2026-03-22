# Installing the YouTube Watch Later Export Script

This userscript adds an **Export to CSV** button to your YouTube Watch Later playlist page, letting you download your queue so you can manage it with the [YTWL web app](https://github.com/buzzb0x/ytwl).

---

## Step 1 — Install Tampermonkey

Tampermonkey is a browser extension that lets you run custom scripts on websites.

1. Open the [Tampermonkey page on the Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. Click **Add to Chrome**
3. Confirm by clicking **Add extension** in the popup

> **Note:** If you're on Firefox, use the [Firefox Add-ons page](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) instead.

---

## Step 2 — Allow Tampermonkey to run on sites

Chrome may show a warning that the extension needs permission to run on websites. To enable it:

1. Click the **Extensions** puzzle-piece icon in the Chrome toolbar (top-right)
2. Find **Tampermonkey** and click the **⋮** menu next to it
3. Select **Manage extension**
4. Under **Site access**, choose **On all sites** (or at minimum allow `youtube.com`)
5. Make sure the toggle at the top of the extension page is **on** (blue)

> On newer Chrome versions you need to explicitly allow Tampermonkey to run userscripts. Go to `chrome://extensions`, find Tampermonkey, click **Details**, and turn on **Allow access to file URLs** — or look for the **"Allow user scripts"** toggle that appears in some Chrome builds.

---

## Step 3 — Add the userscript

### Option A — Install directly from GitHub (recommended)

1. Open the raw script URL:
   [`https://github.com/buzzb0x/ytwl/raw/main/scripts/tampermonkey-export.user.js`](https://github.com/buzzb0x/ytwl/raw/main/scripts/tampermonkey-export.user.js)
2. Tampermonkey will automatically detect the `.user.js` file and show an install prompt
3. Click **Install**

### Option B — Add manually

1. Click the Tampermonkey icon in your toolbar
2. Select **Create a new script…**
3. Delete all the placeholder text in the editor
4. Copy the full contents of [`tampermonkey-export.user.js`](./tampermonkey-export.user.js) and paste it in
5. Press **Ctrl+S** (or **Cmd+S**) to save

---

## Step 4 — Use it

1. Go to [youtube.com/playlist?list=WL](https://www.youtube.com/playlist?list=WL) (your Watch Later playlist)
2. Scroll down to load videos — YouTube loads them lazily, so scroll until you've loaded all the ones you want to export
3. Click **Export All** or select individual videos and click **Export Selected**
4. A CSV file will download automatically

---

## Bonus: compare exports & auto-delete

The script has a **Load CSV** button that lets you import a previously-exported CSV back into the page. Once loaded:

- Any video that was in your old CSV but is **no longer in your YouTube Watch Later** is highlighted with a red ribbon — these are videos you've deleted from the YTWL app since your last export.
- **Auto-delete mode** will automatically remove all highlighted videos from your YouTube Watch Later playlist in one pass, keeping YouTube in sync with your app.

**Typical workflow:**

1. Open your Watch Later playlist and scroll to load everything
2. Click **Load CSV** and pick your most recent export
3. The script highlights videos you've culled in the app
4. Click **Auto-delete** to remove them from YouTube too

---

## Troubleshooting

| Problem                            | Fix                                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| No Export button appears           | Make sure the script is enabled in Tampermonkey and you're on the Watch Later URL (`?list=WL`) |
| Some videos are missing            | Scroll further down the playlist before exporting — YouTube loads videos lazily                |
| "Developer mode" warning in Chrome | Go to `chrome://extensions`, enable **Developer mode**, then re-install the script             |
| CSV file is empty                  | Your playlist may not have loaded yet — wait a moment and try again                            |
