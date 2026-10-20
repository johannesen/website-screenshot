// content/crop.js - Handles mouse selection on the webpage for custom crop

(function () {
  // If overlay already exists, remove it
  const existing = document.getElementById("screenshot-crop-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "screenshot-crop-overlay";

  const box = document.createElement("div");
  box.id = "screenshot-crop-box";
  overlay.appendChild(box);

  const tooltip = document.createElement("div");
  tooltip.id = "screenshot-crop-tooltip";
  tooltip.textContent = "Træk musen for at markere et område (Tryk ESC for at annullere)";
  overlay.appendChild(tooltip);

  document.body.appendChild(overlay);

  let startX = 0;
  let startY = 0;
  let isDragging = false;

  function onMouseDown(e) {
    if (e.button !== 0) return; // Only primary mouse button
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    box.style.left = `${startX}px`;
    box.style.top = `${startY}px`;
    box.style.width = "0px";
    box.style.height = "0px";
    box.style.display = "block";
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
  }

  async function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;

    const rect = {
      x: parseInt(box.style.left, 10),
      y: parseInt(box.style.top, 10),
      width: parseInt(box.style.width, 10),
      height: parseInt(box.style.height, 10)
    };

    // Remove overlay before capturing
    cleanup();

    // Only capture if meaningful area was selected
    if (rect.width > 5 && rect.height > 5) {
      // Small pause to allow DOM repaint after removing overlay
      setTimeout(() => {
        captureAndCrop(rect);
      }, 60);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      cleanup();
    }
  }

  function cleanup() {
    window.removeEventListener("keydown", onKeyDown);
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  overlay.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("keydown", onKeyDown);

  function captureAndCrop(rect) {
    chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (response) => {
      if (!response || !response.success || !response.dataUrl) {
        console.error("Fejl ved optagelse:", response ? response.error : "Ukendt");
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Adjust for devicePixelRatio (e.g. retina / high-DPI screens)
        const dpr = window.devicePixelRatio || 1;
        const cropX = rect.x * dpr;
        const cropY = rect.y * dpr;
        const cropWidth = rect.width * dpr;
        const cropHeight = rect.height * dpr;

        const canvas = document.createElement("canvas");
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );

        const croppedDataUrl = canvas.toDataURL("image/png");

        // Respect user's default flow setting (editor vs direct download)
        chrome.storage.local.get(["defaultFlow"], (res) => {
          if (res.defaultFlow === "preview") {
            chrome.runtime.sendMessage({
              action: "downloadImage",
              dataUrl: croppedDataUrl,
              filename: `screenshot-crop-${Date.now()}.png`
            });
          } else {
            chrome.runtime.sendMessage({
              action: "openEditor",
              dataUrl: croppedDataUrl
            });
          }
        });
      };
      img.src = response.dataUrl;
    });
  }
})();
