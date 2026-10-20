// popup.js - Upgraded popup with i18n language support, timer, element picker, and editor flow

let currentDataUrl = null;

const btnVisible = document.getElementById("btn-visible");
const btnCrop = document.getElementById("btn-crop");
const btnElement = document.getElementById("btn-element");
const btnFullPage = document.getElementById("btn-fullpage");
const chkTimer = document.getElementById("chk-timer");
const selFlow = document.getElementById("sel-flow");
const selLang = document.getElementById("sel-lang");

const statusMessage = document.getElementById("status-message");
const statusText = document.getElementById("status-text");
const previewSection = document.getElementById("preview-section");
const previewImage = document.getElementById("preview-image");
const btnClosePreview = document.getElementById("btn-close-preview");
const btnOpenEditor = document.getElementById("btn-open-editor");
const btnDownload = document.getElementById("btn-download");
const btnCopy = document.getElementById("btn-copy");

// Initialize translations
initI18n((lang) => {
  selLang.value = lang;
});

selLang.addEventListener("change", () => {
  setLanguage(selLang.value);
});

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

let currentSourceUrl = "";

async function handleCapturedImage(dataUrl, sourceUrl) {
  currentSourceUrl = sourceUrl || "";
  const flow = selFlow.value;
  if (flow === "editor") {
    chrome.runtime.sendMessage({ action: "openEditor", dataUrl, sourceUrl: currentSourceUrl });
    window.close();
  } else {
    showPreview(dataUrl);
  }
}

// 1. Capture Visible Area
btnVisible.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && isRestrictedUrl(tab.url)) {
    alert(t("restricted_warning"));
    return;
  }

  currentSourceUrl = tab ? tab.url : "";
  hidePreview();

  if (chkTimer.checked) {
    showStatus(`${t("countdown_prefix")} 3 ${t("countdown_seconds")}`);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        showStatus(`${t("countdown_prefix")} ${count} ${t("countdown_seconds")}`);
      } else {
        clearInterval(interval);
        showStatus(t("working"));
        triggerCaptureVisible();
      }
    }, 1000);
  } else {
    showStatus(t("working"));
    triggerCaptureVisible();
  }
});

function triggerCaptureVisible() {
  chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (response) => {
    hideStatus();
    if (response && response.success) {
      handleCapturedImage(response.dataUrl, currentSourceUrl);
    } else {
      alert(t("capture_error") + (response ? response.error : "Unknown error"));
    }
  });
}

// 2. Capture Selected Area (Crop)
btnCrop.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (isRestrictedUrl(tab.url)) {
    alert(t("restricted_warning"));
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
    console.error("Could not start area crop:", err);
    alert(t("capture_error") + err.message);
  }
});

// 3. DOM Element Picker
btnElement.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (isRestrictedUrl(tab.url)) {
    alert(t("restricted_warning"));
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
    console.error("Could not start element picker:", err);
    alert(t("capture_error") + err.message);
  }
});

// 4. Capture Full Page
btnFullPage.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (isRestrictedUrl(tab.url)) {
    alert(t("restricted_warning"));
    return;
  }

  showStatus(t("working"));

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/fullpage.js"]
    });

    window.close();
  } catch (err) {
    hideStatus();
    console.error("Could not start fullpage capture:", err);
    alert(t("capture_error") + err.message);
  }
});

// Open in Editor
btnOpenEditor.addEventListener("click", () => {
  if (!currentDataUrl) return;
  chrome.runtime.sendMessage({ action: "openEditor", dataUrl: currentDataUrl, sourceUrl: currentSourceUrl });
  window.close();
});

// Download button action
btnDownload.addEventListener("click", () => {
  if (!currentDataUrl) return;
  let domain = "website";
  try {
    if (currentSourceUrl) {
      domain = new URL(currentSourceUrl).hostname.replace(/^www\./, "");
    }
  } catch(e){}
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  chrome.runtime.sendMessage({
    action: "downloadImage",
    dataUrl: currentDataUrl,
    filename: `screenshot_${domain}_${timestamp}.png`,
    sourceUrl: currentSourceUrl
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
    btnCopy.textContent = t("copied");
    setTimeout(() => {
      btnCopy.textContent = origText;
    }, 1500);
  } catch (err) {
    console.error("Clipboard error:", err);
  }
});

btnClosePreview.addEventListener("click", hidePreview);
