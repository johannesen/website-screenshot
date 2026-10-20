// content/element_picker.js - Highlights DOM elements under mouse and captures clicked element

(function () {
  const existingHighlight = document.getElementById("screenshot-element-highlight");
  if (existingHighlight) existingHighlight.remove();

  const highlight = document.createElement("div");
  highlight.id = "screenshot-element-highlight";
  document.body.appendChild(highlight);

  const tooltip = document.createElement("div");
  tooltip.id = "screenshot-element-tooltip";
  tooltip.textContent = "Hold musen over et element og klik for at fange det (ESC for at annullere)";
  document.body.appendChild(tooltip);

  let currentTarget = null;

  function onMouseMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === highlight || el === tooltip) return;

    currentTarget = el;
    const rect = el.getBoundingClientRect();

    highlight.style.left = `${rect.left}px`;
    highlight.style.top = `${rect.top}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    highlight.style.display = "block";
  }

  function onClick(e) {
    if (!currentTarget) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = currentTarget.getBoundingClientRect();
    const bounds = {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };

    cleanup();

    setTimeout(() => {
      captureElement(bounds);
    }, 60);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      cleanup();
    }
  }

  function cleanup() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("click", onClick, true);
    window.removeEventListener("keydown", onKeyDown);
    if (highlight.parentNode) highlight.remove();
    if (tooltip.parentNode) tooltip.remove();
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onClick, true);
  window.addEventListener("keydown", onKeyDown);

  function captureElement(rect) {
    chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (response) => {
      if (!response || !response.success || !response.dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        const cropX = rect.x * dpr;
        const cropY = rect.y * dpr;
        const cropWidth = rect.width * dpr;
        const cropHeight = rect.height * dpr;

        const canvas = document.createElement("canvas");
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        const croppedDataUrl = canvas.toDataURL("image/png");

        const sourceUrl = window.location.href;
        let domain = "element";
        try { domain = window.location.hostname.replace(/^www\./, ""); } catch(e){}
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

        chrome.storage.local.get(["defaultFlow"], (res) => {
          if (res.defaultFlow === "preview") {
            chrome.runtime.sendMessage({
              action: "downloadImage",
              dataUrl: croppedDataUrl,
              filename: `screenshot_${domain}_${timestamp}.png`,
              sourceUrl: sourceUrl
            });
          } else {
            chrome.runtime.sendMessage({
              action: "openEditor",
              dataUrl: croppedDataUrl,
              sourceUrl: sourceUrl
            });
          }
        });
      };
      img.src = response.dataUrl;
    });
  }
})();
