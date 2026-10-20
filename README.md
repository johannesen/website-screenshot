# Website Screenshot - Chrome Extension (Manifest V3)

A modern, fast, and lightweight Google Chrome extension to capture screenshots of websites.

## Features
- 📸 **Visible Area**: Instantly captures the current browser viewport.
- ✂️ **Selected Area (Crop)**: Drag a selection box with your mouse to capture any custom region on the page (supports High-DPI / Retina displays).
- 📜 **Full Page**: Automatically scrolls through the entire webpage and stitches all viewport slices into a single high-resolution image without leaving UI overlays.
- 💾 **Export Options**:
  - Download directly as `.png`
  - Copy directly to clipboard
  - In-popup preview before saving
- 🛡️ **Safety & Error Handling**: Gracefully informs the user if attempting to capture restricted Chrome pages (e.g., Chrome Web Store, `chrome://` URLs) where browser security policies restrict script execution.

## Installation in Google Chrome
1. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
2. Enable **Developer mode** in the top-right corner.
3. Click on the **Load unpacked** button.
4. Select the project directory:
   ```text
   c:\dev\Chrome Extensions\website-screenshot
   ```
5. Pin the **Website Screenshot Capture** icon to your browser toolbar for quick access.

## Project Structure
```text
├── manifest.json         # Extension Manifest V3 configuration
├── background.js         # Service Worker handling capture API & downloads
├── popup.html            # Extension popup user interface
├── popup.css             # UI styling (dark/light mode compatible)
├── popup.js              # Popup actions, checks, and preview controls
├── content/
│   ├── crop.js           # Interactive mouse drag selection and canvas cropping
│   ├── crop.css          # Selection box and overlay styles
│   └── fullpage.js       # Scrolling page stitcher via HTML5 Canvas
└── icons/                # Extension icons (16x16, 48x48, 128x128)
```

## Permissions
- `activeTab`: Accesses the current active tab only when explicitly clicked by the user.
- `scripting`: Injects crop and full-page capture scripts into the active page.
- `downloads`: Saves captured screenshots to your local downloads folder.
