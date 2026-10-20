// popup.js - Upgraded popup with timer, element picker, and direct editor integration

let currentDataUrl = null;

const btnVisible = document.getElementById("btn-visible");
const btnCrop = document.getElementById("btn-crop");
const btnElement = document.getElementById("btn-element");
const btnFullPage = document.getElementById("btn-fullpage");
const chkTimer = document.getElementById("chk-timer");
const selFlow = document.getElementById("sel-flow");

const statusMessage = document.getElementById("status-message");
const statusText = document.getElementById("status-text");
const previewSection = document.getElementById("preview-section");
const previewImage = document.getElementById("preview-image");
const btnClosePreview = document.getElementById("btn-close-preview");
const btnOpenEditor = document.getElementById("btn-open-editor");
const btnDownload = document.getElementById("btn-download");
const btnCopy = document.getElementById("btn-copy");

// Load flow preference
chrome.storage.local.get(["defaultFlow"], (res) => {
  if (res.defaultFlow) selFlow.value = res.defaultFlow;
});

selFlow.addEventListener("change", () => {
  chrome.storage.local.set({ defaultFlow: selFlow.value });
});

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

async function handleCapturedImage(dataUrl) {
  const flow = selFlow.value;
  if (flow === "editor") {
    chrome.runtime.sendMessage({ action: "openEditor", dataUrl });
    window.close();
  } else {
    showPreview(dataUrl);
  }
}

// 1. Capture Visible Area
btnVisible.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && isRestrictedUrl(tab.url)) {
    alert("Chrome tillader ikke udvidelser at tage screenshots af Chrome Web Store eller interne browsersider (chrome://) af sikkerhedsmæssige årsager. Prøv venligst på en almindelig webside.");
    return;
  }

  hidePreview();

  if (chkTimer.checked) {
    showStatus("Optager om 3 sekunder...");
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        showStatus(`Optager om ${count} sekunder...`);
      } else {
        clearInterval(interval);
        showStatus("Tager screenshot...");
        triggerCaptureVisible();
      }
    }, 1000);
  } else {
    showStatus("Tager screenshot...");
    triggerCaptureVisible();
  }
});

function triggerCaptureVisible() {
  chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (response) => {
    hideStatus();
    if (response && response.success) {
      handleCapturedImage(response.dataUrl);
    } else {
      alert("Fejl ved optagelse: " + (response ? response.error : "Ukendt fejl"));
    }
  });
}

// 2. Capture Selected Area (Crop)
btnCrop.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (isRestrictedUrl(tab.url)) {
    alert("Chrome tillader ikke udvidelser at køre scripts på Chrome Web Store eller interne browsersider af sikkerhedsmæssige årsager. Prøv venligst på en almindelig webside.");
    return;
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content/crop.css"]
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/crop.js"]
    });

    window.close();
  } catch (err) {
    console.error("Kunne ikke starte områdevalg:", err);
    alert("Kunne ikke starte på denne side: " + err.message);
  }
});

// 3. DOM Element Picker
btnElement.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (isRestrictedUrl(tab.url)) {
    alert("Chrome tillader ikke scripts på Chrome Web Store eller interne browsersider.");
    return;
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content/element_picker.css"]
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/element_picker.js"]
    });

    window.close();
  } catch (err) {
    console.error("Kunne ikke starte element-vælger:", err);
    alert("Fejl: " + err.message);
  }
});

// 4. Capture Full Page
btnFullPage.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (isRestrictedUrl(tab.url)) {
    alert("Chrome tillader ikke udvidelser at køre scripts på Chrome Web Store eller interne browsersider af sikkerhedsmæssige årsager.");
    return;
  }

  showStatus("Forbereder fuld side optagelse...");

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/fullpage.js"]
    });

    window.close();
  } catch (err) {
    hideStatus();
    console.error("Kunne ikke starte fuld side:", err);
    alert("Kunne ikke køre på denne side: " + err.message);
  }
});

// Open in Editor
btnOpenEditor.addEventListener("click", () => {
  if (!currentDataUrl) return;
  chrome.runtime.sendMessage({ action: "openEditor", dataUrl: currentDataUrl });
  window.close();
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
    console.error("Fejl ved kopiering:", err);
    alert("Kunne ikke kopiere til udklipsholder.");
  }
});

btnClosePreview.addEventListener("click", hidePreview);
