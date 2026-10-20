// content/fullpage.js - Handles stitching visible captures into a full-page screenshot

(function () {
  async function captureFullPage() {
    // Save initial scroll position
    const origScrollX = window.scrollX;
    const origScrollY = window.scrollY;

    const fullWidth = Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    );

    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    );

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // Create target canvas
    const canvas = document.createElement("canvas");
    canvas.width = fullWidth * dpr;
    canvas.height = fullHeight * dpr;
    const ctx = canvas.getContext("2d");

    let currentY = 0;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      while (currentY < fullHeight) {
        window.scrollTo(0, currentY);
        // Wait for rendering and sticky element transitions
        await sleep(250);

        const actualY = window.scrollY;

        // Capture current viewport
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: "captureVisibleTab" }, resolve);
        });

        if (!response || !response.success || !response.dataUrl) {
          throw new Error(response ? response.error : "Fejl ved capture af fane");
        }

        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            // Draw current slice onto the large canvas
            ctx.drawImage(img, 0, actualY * dpr);
            resolve();
          };
          img.onerror = reject;
          img.src = response.dataUrl;
        });

        // If we reached the bottom or can't scroll further
        if (actualY + viewportHeight >= fullHeight || (actualY === currentY && currentY > 0 && actualY + viewportHeight >= document.documentElement.scrollHeight)) {
          break;
        }

        currentY += viewportHeight;
        if (currentY >= fullHeight) {
          // One final capture for the bottom edge
          currentY = fullHeight - viewportHeight;
          if (currentY < 0) currentY = 0;
        }
      }

      // Restore scroll
      window.scrollTo(origScrollX, origScrollY);

      const fullDataUrl = canvas.toDataURL("image/png");

      chrome.storage.local.get(["defaultFlow"], (res) => {
        if (res.defaultFlow === "preview") {
          chrome.runtime.sendMessage({
            action: "downloadImage",
            dataUrl: fullDataUrl,
            filename: `screenshot-fullpage-${Date.now()}.png`
          });
        } else {
          chrome.runtime.sendMessage({
            action: "openEditor",
            dataUrl: fullDataUrl
          });
        }
      });

    } catch (err) {
      console.error("Fullpage capture error:", err);
      window.scrollTo(origScrollX, origScrollY);
    }
  }

  captureFullPage();
})();
