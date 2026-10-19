// popup.js - Handles UI actions in extension popup

let currentDataUrl = null;

const btnVisible = document.getElementById("btn-visible");
const btnCrop = document.getElementById("btn-crop");
const btnFullPage = document.getElementById("btn-fullpage");
const statusMessage = document.getElementById("status-message");
const statusText = document.getElementById("status-text");
const previewSection = document.getElementById("preview-section");
const previewImage = document.getElementById("preview-image");
const btnClosePreview = document.getElementById("btn-close-preview");
const btnDownload = document.getElementById("btn-download");
const btnCopy = document.getElementById("btn-copy");

function showStatus(text) {
  statusText.textContent = text;
  statusMessage.classList.remove("hidden");
}

function hideStatus() {
  statusMessage.classList.add("hidden");
}

function showPreview(dataUrl) {
  currentDataUrl = dataUrl;
  previewImage.src = dataUrl;
  previewSection.classList.remove("hidden");
}

function hidePreview() {
  previewSection.classList.add("hidden");
  currentDataUrl = null;
}

// 1. Capture Visible Area
btnVisible.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && isRestrictedUrl(tab.url)) {
    alert("Chrome tillader ikke udvidelser at tage screenshots af Chrome Web Store eller interne browsersider (chrome://) af sikkerhedsmæssige årsager. Prøv venligst på en almindelig webside.");
    return;
  }

  showStatus("Tager screenshot...");
  hidePreview();

  chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (response) => {
    hideStatus();
    if (response && response.success) {
      showPreview(response.dataUrl);
    } else {
      alert("Fejl ved optagelse: " + (response ? response.error : "Ukendt fejl"));
    }
  });
});

function isRestrictedUrl(url) {
  if (!url) return true;
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("view-source:") ||
    url.includes("chromewebstore.google.com") ||
    url.includes("chrome.google.com/webstore")
  );
}

// 2. Capture Selected Area (Crop)
btnCrop.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (isRestrictedUrl(tab.url)) {
    alert("Chrome tillader ikke udvidelser at køre scripts på Chrome Web Store eller interne browsersider af sikkerhedsmæssige årsager. Prøv venligst på en almindelig webside (f.eks. google.com, wikipedia.org osv.).");
    return;
  }

  try {
    // Inject crop overlay script and CSS
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content/crop.css"]
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/crop.js"]
    });

    // Close popup so user can select the area
    window.close();
  } catch (err) {
    console.error("Kunne ikke starte områdevalg:", err);
    alert("Kunne ikke starte på denne side: " + err.message);
  }
});

// 3. Capture Full Page
btnFullPage.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (isRestrictedUrl(tab.url)) {
    alert("Chrome tillader ikke udvidelser at køre scripts på Chrome Web Store eller interne browsersider af sikkerhedsmæssige årsager. Prøv venligst på en almindelig webside (f.eks. google.com, wikipedia.org osv.).");
    return;
  }

  showStatus("Forbereder fuld side optagelse...");

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/fullpage.js"]
    });

    // Content script will handle scrolling and call captureVisibleTab, then trigger download or notify
    window.close();
  } catch (err) {
    hideStatus();
    console.error("Kunne ikke starte fuld side:", err);
    alert("Kunne ikke køre på denne side: " + err.message);
  }
});

// Download button action
btnDownload.addEventListener("click", () => {
  if (!currentDataUrl) return;
  chrome.runtime.sendMessage({
    action: "downloadImage",
    dataUrl: currentDataUrl,
    filename: `screenshot-visible-${Date.now()}.png`
  });
});

// Copy button action
btnCopy.addEventListener("click", async () => {
  if (!currentDataUrl) return;
  try {
    const res = await fetch(currentDataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
    const origText = btnCopy.textContent;
    btnCopy.textContent = "Kopieret!";
    setTimeout(() => {
      btnCopy.textContent = origText;
    }, 1500);
  } catch (err) {
    console.error("Fejl ved kopiering til udklipsholder:", err);
    alert("Kunne ikke kopiere til udklipsholder.");
  }
});

btnClosePreview.addEventListener("click", hidePreview);
