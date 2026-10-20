# Website Screenshot Pro - Chrome Extension (Manifest V3)

A modern, fast, and feature-rich Google Chrome extension designed to be the ultimate website screenshot tool. It pairs versatile page capture modes with a powerful vector-based editor in a dedicated tab, CleanShot X-style backdrops, comprehensive censorship tools, and multi-language support.

---

## ✨ Features

### 📸 Capture Modes
- **Visible Area**: Instantly captures the currently visible viewport.
- **Selected Area (Crop)**: Drag a box with your mouse to crop any custom section on the page (supports High-DPI / Retina screens).
- **DOM Element Picker**: Hover over page elements to see a live highlight box, then click to capture that exact component.
- **Full Page**: Automatically scrolls through the entire webpage and stitches all viewport slices into a single high-resolution image without leaving UI badges or labels.
- **3-Second Delay Timer**: Toggle a 3s countdown before capturing—perfect for opening dropdown menus, modals, and hover states.

### 🎨 Dedicated Vector Editor (`editor/editor.html`)
- **Fabric.js Vector Canvas**: All annotations are vector objects. Move, resize, recolor, or delete (`Del`) any added shape at any time.
- **Annotation Tools**:
  - 🏹 **Arrows**: Crisp directional arrows with heads.
  - 🔲 **Rectangles & Circles**: Outline or filled framing.
  - 🔤 **Text**: Formattable text boxes with high-contrast backdrops for readability on any background.
  - 🖍️ **Highlighter**: Semi-transparent yellow highlighter for emphasizing text and numbers.
  - 🔢 **Step Bubbles**: One-click numbered badges (`1`, `2`, `3`...) with auto-incrementation for tutorials.
  - ↩️ **Undo / Redo**: Full history support (`Ctrl+Z` / `Ctrl+Y`).
- **🔍 Canvas Zoom Controls**:
  - Zoom In (`+`), Zoom Out (`-`), and Reset to 100%.
  - Pinch / `Ctrl + Mouse Wheel` zooming directly over the canvas.
- **🔒 Advanced Blur & Censorship (Options & Types)**:
  - Designed specifically for faces, passwords, credit cards, and confidential data.
  - **Blur Types**:
    - **Pixelate**: Classic censorship pixel blocks.
    - **Smooth Blur**: Soft Gaussian-style blur.
    - **Solid Blackout**: Total blackout of sensitive regions.
  - **Strength**: Choose between **Low**, **Medium**, and **High (Maximum Anonymity)**.
  - Blur regions remain fully selectable, resizable, and removable.
- **✨ CleanShot X-Style Backdrop & Canvas**:
  - Adjustable **Padding** (`0 - 100px`) around the screenshot.
  - Soft **Corner Radius** (`0 - 32px`).
  - Realistic 3D **Drop Shadow**.
  - **6 Preset Gradients**, as well as solid dark, white, and transparent backdrops.

### 💾 Smart Export & Naming
- **Source URL in Filename**: Saved files automatically include the origin website domain and timestamp:
  ```text
  screenshot_en.wikipedia.org_2026-10-20T14-25-30.png
  screenshot_github.com_2026-10-20T14-25-30.png
  ```
- **Export Formats**: PNG (lossless), JPEG, and WebP.
- **One-Click Clipboard Copy**: Directly paste screenshots into Slack, Discord, email, or documents.

### 🌐 Internationalization (i18n)
- **English by default**.
- Switch language on the fly between **English** and **Danish** via popup settings. Preference is persisted in `chrome.storage.local`.

### ⌨️ Keyboard Shortcuts
- `Alt + Shift + V`: Capture visible area
- `Alt + Shift + S`: Capture selected crop
- `Alt + Shift + F`: Capture full page
- In Editor: `V` (Select), `A` (Arrow), `R` (Rect), `C` (Circle), `T` (Text), `H` (Highlighter), `B` (Blur), `S` (Step), `+` / `-` (Zoom), `Del` (Delete), `Ctrl+Z` (Undo).

---

## 🚀 Installation in Google Chrome

1. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
2. Enable **Developer mode** in the top-right corner.
3. Click on **Load unpacked**.
4. Select the project directory:
   ```text
   c:\dev\Chrome Extensions\website-screenshot
   ```
5. Pin **Website Screenshot Pro** to your Chrome toolbar for quick access.

---

## 📁 Project Structure

```text
├── manifest.json            # Extension Manifest V3 configuration & shortcuts
├── background.js            # Service worker for captures, tab management & downloads
├── i18n.js                  # Internationalization dictionary & language switcher
├── popup.html               # Main popup user interface
├── popup.css                # Popup styling (dark/light mode compatible)
├── popup.js                 # Popup logic, timers, and workflow router
├── content/
│   ├── crop.js              # Mouse drag selection script
│   ├── crop.css             # Drag box styling
│   ├── element_picker.js    # DOM element hover & click detector
│   ├── element_picker.css   # Live element highlight border
│   └── fullpage.js          # Scrolling stitcher via HTML5 Canvas
├── editor/
│   ├── editor.html          # Full-page vector editor
│   ├── editor.css           # Editor layout, toolbar & inspector panel
│   └── editor.js            # Fabric.js canvas logic, zoom, blur & export
├── lib/
│   └── fabric.min.js        # Vector graphics engine
└── icons/                   # Extension icons (16x16, 48x48, 128x128)
```

---

## 🛡️ Permissions

- `activeTab`: Grants access to the active webpage only upon explicit user action.
- `scripting`: Executes area selection and DOM element inspection on active tabs.
- `downloads`: Saves screenshot files directly to your local downloads folder.
- `storage`: Persists language and default workflow preferences.
