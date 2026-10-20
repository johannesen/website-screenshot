// editor/editor.js - Fabric.js vector image editor with zoom, advanced blur options, CleanShot & source URL export

let canvas;
let currentTool = "select";
let currentColor = "#ef4444";
let currentStrokeWidth = 4;
let stepCounter = 1;
let bgImageObject = null;
let rawOriginalImage = null; // Pure underlying HTMLImageElement for sampling
let sourcePageUrl = ""; // Saved source url

// Zoom Level
let zoomLevel = 1.0;

// History stacks for Undo / Redo
let canvasHistory = [];
let historyIndex = -1;
let isUpdatingHistory = false;

// CleanShot styling variables
let currentPadding = 0;
let currentRadius = 0;
let currentShadow = 0;
let currentBackground = "transparent";

// Initialize Fabric Canvas, i18n, and Controls
window.addEventListener("DOMContentLoaded", async () => {
  initI18n();

  canvas = new fabric.Canvas("main-canvas", {
    selection: true,
    preserveObjectStacking: true
  });

  // Load screenshot from storage
  chrome.storage.local.get(["pendingScreenshot", "pendingSourceUrl"], (result) => {
    if (result.pendingSourceUrl) {
      sourcePageUrl = result.pendingSourceUrl;
    }
    if (result.pendingScreenshot) {
      loadImage(result.pendingScreenshot);
    } else {
      console.warn("No screenshot provided in storage.");
    }
  });

  setupToolbar();
  setupZoomControls();
  setupCanvasEvents();
  setupCleanShotControls();
  setupExport();
});

function loadImage(dataUrl) {
  const htmlImg = new Image();
  htmlImg.crossOrigin = "anonymous";
  htmlImg.onload = () => {
    rawOriginalImage = htmlImg;

    fabric.Image.fromURL(dataUrl, (img) => {
      bgImageObject = img;
      img.set({
        selectable: false,
        evented: false
      });

      canvas.setWidth(img.width);
      canvas.setHeight(img.height);
      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();

      saveState();
    });
  };
  htmlImg.src = dataUrl;
}

// History Management
function saveState() {
  if (isUpdatingHistory) return;
  const json = JSON.stringify(canvas.toJSON(["isBlurBlock", "blurLeft", "blurTop", "blurWidth", "blurHeight"]));
  if (historyIndex < canvasHistory.length - 1) {
    canvasHistory = canvasHistory.slice(0, historyIndex + 1);
  }
  canvasHistory.push(json);
  historyIndex = canvasHistory.length - 1;
  updateHistoryButtons();
}

function updateHistoryButtons() {
  const undoBtn = document.getElementById("btn-undo");
  const redoBtn = document.getElementById("btn-redo");
  if (undoBtn) undoBtn.disabled = historyIndex <= 0;
  if (redoBtn) redoBtn.disabled = historyIndex >= canvasHistory.length - 1;
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    isUpdatingHistory = true;
    canvas.loadFromJSON(canvasHistory[historyIndex], () => {
      canvas.renderAll();
      isUpdatingHistory = false;
      updateHistoryButtons();
    });
  }
}

function redo() {
  if (historyIndex < canvasHistory.length - 1) {
    historyIndex++;
    isUpdatingHistory = true;
    canvas.loadFromJSON(canvasHistory[historyIndex], () => {
      canvas.renderAll();
      isUpdatingHistory = false;
      updateHistoryButtons();
    });
  }
}

// Zoom Controls
function setupZoomControls() {
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnZoomReset = document.getElementById("btn-zoom-reset");
  const zoomText = document.getElementById("zoom-level-text");
  const containerOuter = document.getElementById("canvas-container-outer");

  function applyZoom(newZoom) {
    zoomLevel = Math.min(3.0, Math.max(0.2, newZoom));
    zoomText.textContent = `${Math.round(zoomLevel * 100)}%`;
    containerOuter.style.transform = `scale(${zoomLevel})`;
  }

  btnZoomIn.addEventListener("click", () => applyZoom(zoomLevel + 0.15));
  btnZoomOut.addEventListener("click", () => applyZoom(zoomLevel - 0.15));
  btnZoomReset.addEventListener("click", () => applyZoom(1.0));

  // Mouse wheel zoom when holding Ctrl or over viewport
  const viewport = document.getElementById("canvas-viewport");
  viewport.addEventListener("wheel", (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      applyZoom(zoomLevel + delta);
    }
  }, { passive: false });
}

// Toolbar Setup
function setupToolbar() {
  const toolButtons = document.querySelectorAll(".tool-btn[data-tool]");
  toolButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      toolButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTool = btn.getAttribute("data-tool");
      updateDrawingMode();
    });
  });

  const colorInput = document.getElementById("tool-color");
  colorInput.addEventListener("input", (e) => {
    currentColor = e.target.value;
    const active = canvas.getActiveObject();
    if (active) {
      if (active.type === "i-text" || active.type === "text") {
        active.set("fill", currentColor);
      } else if (!active.isBlurBlock) {
        active.set("stroke", currentColor);
      }
      canvas.renderAll();
      saveState();
    }
  });

  const strokeSelect = document.getElementById("tool-stroke-width");
  strokeSelect.addEventListener("change", (e) => {
    currentStrokeWidth = parseInt(e.target.value, 10);
    const active = canvas.getActiveObject();
    if (active && active.stroke && !active.isBlurBlock) {
      active.set("strokeWidth", currentStrokeWidth);
      canvas.renderAll();
      saveState();
    }
  });

  document.getElementById("btn-undo").addEventListener("click", undo);
  document.getElementById("btn-redo").addEventListener("click", redo);

  // Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || (canvas.getActiveObject() && canvas.getActiveObject().isEditing)) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      const active = canvas.getActiveObjects();
      if (active && active.length) {
        active.forEach((obj) => {
          if (obj !== bgImageObject) canvas.remove(obj);
        });
        canvas.discardActiveObject();
        canvas.renderAll();
        saveState();
      }
    } else if (e.key === "+" || e.key === "=") {
      document.getElementById("btn-zoom-in").click();
    } else if (e.key === "-") {
      document.getElementById("btn-zoom-out").click();
    } else {
      const keyMap = {
        v: "select",
        a: "arrow",
        r: "rect",
        c: "circle",
        t: "text",
        h: "highlighter",
        b: "blur",
        s: "step"
      };
      if (keyMap[e.key.toLowerCase()]) {
        const tool = keyMap[e.key.toLowerCase()];
        const btn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
        if (btn) btn.click();
      }
    }
  });
}

function updateDrawingMode() {
  canvas.isDrawingMode = false;
  canvas.selection = currentTool === "select";
  canvas.forEachObject((obj) => {
    if (obj !== bgImageObject) {
      obj.selectable = currentTool === "select";
      obj.evented = currentTool === "select";
    }
  });
}

// Generate Anonymization / Blur Element based on Type and Strength
function createBlurDataUrl(x, y, width, height, blurType, blurStrength) {
  if (!rawOriginalImage || width <= 0 || height <= 0) return null;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d");

  // Solid blackout
  if (blurType === "blackout") {
    tempCtx.fillStyle = "#0f172a";
    tempCtx.fillRect(0, 0, width, height);
    return tempCanvas.toDataURL();
  }

  // Smooth Gaussian-like blur
  if (blurType === "smooth") {
    let blurPx = 8;
    if (blurStrength === "low") blurPx = 5;
    if (blurStrength === "high") blurPx = 18;

    tempCtx.filter = `blur(${blurPx}px)`;
    // Draw enlarged to prevent clear edges
    tempCtx.drawImage(
      rawOriginalImage,
      Math.max(0, x - blurPx), Math.max(0, y - blurPx), width + blurPx * 2, height + blurPx * 2,
      -blurPx, -blurPx, width + blurPx * 2, height + blurPx * 2
    );
    return tempCanvas.toDataURL();
  }

  // Pixelate (Default)
  let scale = 0.08;
  if (blurStrength === "low") scale = 0.16;
  if (blurStrength === "high") scale = 0.04;

  const miniCanvas = document.createElement("canvas");
  const miniW = Math.max(2, Math.floor(width * scale));
  const miniH = Math.max(2, Math.floor(height * scale));
  miniCanvas.width = miniW;
  miniCanvas.height = miniH;
  const miniCtx = miniCanvas.getContext("2d");

  miniCtx.drawImage(
    rawOriginalImage,
    x, y, width, height,
    0, 0, miniW, miniH
  );

  tempCtx.imageSmoothingEnabled = false;
  tempCtx.drawImage(miniCanvas, 0, 0, miniW, miniH, 0, 0, width, height);

  return tempCanvas.toDataURL();
}

// Canvas Drawing Events
let isDrawing = false;
let origX = 0;
let origY = 0;
let activeShape = null;

function setupCanvasEvents() {
  canvas.on("mouse:down", (o) => {
    if (currentTool === "select") return;

    const pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    isDrawing = true;

    if (currentTool === "rect") {
      activeShape = new fabric.Rect({
        left: origX,
        top: origY,
        width: 0,
        height: 0,
        fill: "transparent",
        stroke: currentColor,
        strokeWidth: currentStrokeWidth,
        cornerColor: "#3b82f6",
        transparentCorners: false
      });
      canvas.add(activeShape);
    } else if (currentTool === "circle") {
      activeShape = new fabric.Ellipse({
        left: origX,
        top: origY,
        originX: "left",
        originY: "top",
        rx: 0,
        ry: 0,
        fill: "transparent",
        stroke: currentColor,
        strokeWidth: currentStrokeWidth
      });
      canvas.add(activeShape);
    } else if (currentTool === "arrow") {
      const points = [origX, origY, origX, origY];
      activeShape = new fabric.Line(points, {
        strokeWidth: currentStrokeWidth,
        fill: currentColor,
        stroke: currentColor,
        originX: "center",
        originY: "center"
      });
      canvas.add(activeShape);
    } else if (currentTool === "highlighter") {
      activeShape = new fabric.Rect({
        left: origX,
        top: origY,
        width: 0,
        height: 0,
        fill: "rgba(250, 204, 21, 0.45)",
        stroke: "transparent"
      });
      canvas.add(activeShape);
    } else if (currentTool === "blur") {
      activeShape = new fabric.Rect({
        left: origX,
        top: origY,
        width: 0,
        height: 0,
        fill: "rgba(59, 130, 246, 0.2)",
        stroke: "#3b82f6",
        strokeDashArray: [4, 4],
        strokeWidth: 1.5
      });
      canvas.add(activeShape);
    } else if (currentTool === "text") {
      isDrawing = false;
      const text = new fabric.IText(t("shortcut_text"), {
        left: origX,
        top: origY,
        fontSize: 22,
        fill: currentColor,
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 6
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      saveState();
      document.querySelector('.tool-btn[data-tool="select"]').click();
    } else if (currentTool === "step") {
      isDrawing = false;
      createStepBubble(origX, origY, stepCounter++);
      saveState();
    }
  });

  canvas.on("mouse:move", (o) => {
    if (!isDrawing || !activeShape) return;
    const pointer = canvas.getPointer(o.e);

    if (currentTool === "rect" || currentTool === "highlighter" || currentTool === "blur") {
      const width = Math.abs(origX - pointer.x);
      const height = Math.abs(origY - pointer.y);
      activeShape.set({
        left: Math.min(origX, pointer.x),
        top: Math.min(origY, pointer.y),
        width: width,
        height: height
      });
    } else if (currentTool === "circle") {
      const rx = Math.abs(origX - pointer.x) / 2;
      const ry = Math.abs(origY - pointer.y) / 2;
      activeShape.set({
        left: Math.min(origX, pointer.x),
        top: Math.min(origY, pointer.y),
        rx: rx,
        ry: ry
      });
    } else if (currentTool === "arrow") {
      activeShape.set({ x2: pointer.x, y2: pointer.y });
    }
    canvas.renderAll();
  });

  canvas.on("mouse:up", () => {
    if (!isDrawing) return;
    isDrawing = false;

    if (currentTool === "blur" && activeShape) {
      const blurLeft = Math.round(activeShape.left);
      const blurTop = Math.round(activeShape.top);
      const blurWidth = Math.round(activeShape.width);
      const blurHeight = Math.round(activeShape.height);
      canvas.remove(activeShape);

      const blurType = document.getElementById("sel-blur-type").value;
      const blurStrength = document.getElementById("sel-blur-strength").value;

      if (blurWidth > 4 && blurHeight > 4) {
        const blurDataUrl = createBlurDataUrl(blurLeft, blurTop, blurWidth, blurHeight, blurType, blurStrength);
        if (blurDataUrl) {
          fabric.Image.fromURL(blurDataUrl, (blurImg) => {
            blurImg.set({
              left: blurLeft,
              top: blurTop,
              selectable: true,
              evented: true,
              isBlurBlock: true,
              cornerColor: "#3b82f6",
              transparentCorners: false,
              stroke: "rgba(0,0,0,0.2)",
              strokeWidth: 1
            });
            canvas.add(blurImg);
            canvas.setActiveObject(blurImg);
            canvas.renderAll();
            saveState();
          });
        }
      }
      activeShape = null;
      document.querySelector('.tool-btn[data-tool="select"]').click();
      return;
    }

    if (currentTool === "arrow" && activeShape) {
      const x1 = activeShape.x1;
      const y1 = activeShape.y1;
      const x2 = activeShape.x2;
      const y2 = activeShape.y2;
      canvas.remove(activeShape);

      const dx = x2 - x1;
      const dy = y2 - y1;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      const line = new fabric.Line([x1, y1, x2, y2], {
        stroke: currentColor,
        strokeWidth: currentStrokeWidth
      });

      const headLength = 16 + currentStrokeWidth * 1.5;
      const arrowHead = new fabric.Triangle({
        left: x2,
        top: y2,
        originX: "center",
        originY: "center",
        pointType: "arrow_head",
        angle: angle + 90,
        width: headLength,
        height: headLength,
        fill: currentColor
      });

      const arrowGroup = new fabric.Group([line, arrowHead]);
      canvas.add(arrowGroup);
    }

    activeShape = null;
    saveState();
  });

  canvas.on("object:modified", saveState);
}

function createStepBubble(x, y, number) {
  const radius = 16;
  const circle = new fabric.Circle({
    radius: radius,
    fill: currentColor,
    originX: "center",
    originY: "center"
  });

  const text = new fabric.Text(number.toString(), {
    fontSize: 16,
    fontWeight: "bold",
    fill: "#ffffff",
    originX: "center",
    originY: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
  });

  const group = new fabric.Group([circle, text], {
    left: x - radius,
    top: y - radius
  });

  canvas.add(group);
}

// CleanShot X Canvas Styling
function setupCleanShotControls() {
  const outer = document.getElementById("canvas-container-outer");
  const padSlider = document.getElementById("backdrop-padding");
  const padVal = document.getElementById("backdrop-padding-val");
  const radSlider = document.getElementById("backdrop-radius");
  const radVal = document.getElementById("backdrop-radius-val");
  const shadowSlider = document.getElementById("backdrop-shadow");
  const shadowVal = document.getElementById("backdrop-shadow-val");
  const presets = document.querySelectorAll(".grad-preset");

  padSlider.addEventListener("input", (e) => {
    currentPadding = parseInt(e.target.value, 10);
    padVal.textContent = `${currentPadding}px`;
    outer.style.padding = `${currentPadding}px`;
  });

  radSlider.addEventListener("input", (e) => {
    currentRadius = parseInt(e.target.value, 10);
    radVal.textContent = `${currentRadius}px`;
    outer.style.borderRadius = `${currentRadius}px`;
    const canvasEl = document.querySelector(".canvas-container");
    if (canvasEl) canvasEl.style.borderRadius = `${currentRadius}px`;
  });

  shadowSlider.addEventListener("input", (e) => {
    currentShadow = parseInt(e.target.value, 10);
    shadowVal.textContent = currentShadow > 0 ? `${currentShadow}px` : t("shadow_none");
    outer.style.boxShadow = currentShadow > 0 ? `0 ${currentShadow / 2}px ${currentShadow}px rgba(0,0,0,0.6)` : "none";
  });

  presets.forEach((p) => {
    p.addEventListener("click", () => {
      presets.forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      currentBackground = p.getAttribute("data-bg");
      outer.style.background = currentBackground;
    });
  });
}

// Export to Rendered Canvas (including CleanShot backdrop)
function generateExportCanvas() {
  const exportCanvas = document.createElement("canvas");
  const pad = currentPadding;

  exportCanvas.width = canvas.getWidth() + pad * 2;
  exportCanvas.height = canvas.getHeight() + pad * 2;
  const ctx = exportCanvas.getContext("2d");

  // 1. Draw CleanShot background
  if (currentBackground && currentBackground !== "transparent") {
    if (currentBackground.startsWith("linear-gradient")) {
      const grad = ctx.createLinearGradient(0, 0, exportCanvas.width, exportCanvas.height);
      if (currentBackground.includes("#667eea")) {
        grad.addColorStop(0, "#667eea");
        grad.addColorStop(1, "#764ba2");
      } else if (currentBackground.includes("#f093fb")) {
        grad.addColorStop(0, "#f093fb");
        grad.addColorStop(1, "#f5576c");
      } else if (currentBackground.includes("#4facfe")) {
        grad.addColorStop(0, "#4facfe");
        grad.addColorStop(1, "#00f2fe");
      } else if (currentBackground.includes("#43e97b")) {
        grad.addColorStop(0, "#43e97b");
        grad.addColorStop(1, "#38f9d7");
      } else if (currentBackground.includes("#fa709a")) {
        grad.addColorStop(0, "#fa709a");
        grad.addColorStop(1, "#fee140");
      }
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = currentBackground;
    }
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  }

  // 2. Draw fabric canvas
  const fabricDataUrl = canvas.toDataURL({ format: "png" });
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (currentShadow > 0) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = currentShadow;
        ctx.shadowOffsetY = currentShadow / 4;
      }
      ctx.drawImage(img, pad, pad);
      resolve(exportCanvas);
    };
    img.src = fabricDataUrl;
  });
}

// Export Setup
function setupExport() {
  const btnDownload = document.getElementById("btn-download-canvas");
  const selFormat = document.getElementById("export-format");
  const btnCopy = document.getElementById("btn-copy-canvas");

  btnDownload.addEventListener("click", async () => {
    const exportCanvas = await generateExportCanvas();
    const format = selFormat.value;
    const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const dataUrl = exportCanvas.toDataURL(mime, 0.95);

    let domain = "website";
    try {
      if (sourcePageUrl) {
        domain = new URL(sourcePageUrl).hostname.replace(/^www\./, "");
      }
    } catch(e){}
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    chrome.runtime.sendMessage({
      action: "downloadImage",
      dataUrl: dataUrl,
      filename: `screenshot_${domain}_${timestamp}.${format}`,
      sourceUrl: sourcePageUrl
    });
  });

  btnCopy.addEventListener("click", async () => {
    const exportCanvas = await generateExportCanvas();
    exportCanvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        const orig = btnCopy.textContent;
        btnCopy.textContent = t("copied");
        setTimeout(() => { btnCopy.textContent = orig; }, 1500);
      } catch (err) {
        console.error("Clipboard write error:", err);
      }
    }, "image/png");
  });
}
