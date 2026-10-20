// background.js - Service Worker handling captures, editor opening, downloads & shortcuts

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true;
  }

  if (message.action === "openEditor") {
    // Save image data to local storage and open editor tab
    chrome.storage.local.set({ pendingScreenshot: message.dataUrl }, () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("editor/editor.html") });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === "downloadImage") {
    const filename = message.filename || `screenshot-${Date.now()}.png`;
    chrome.downloads.download({
      url: message.dataUrl,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });
    return true;
  }
});

// Helper to check for restricted URLs
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

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (isRestrictedUrl(tab.url)) return;

  if (command === "capture-visible") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (dataUrl) {
        chrome.storage.local.set({ pendingScreenshot: dataUrl }, () => {
          chrome.tabs.create({ url: chrome.runtime.getURL("editor/editor.html") });
        });
      }
    });
  } else if (command === "capture-crop") {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["content/crop.css"] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/crop.js"] });
  } else if (command === "capture-fullpage") {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/fullpage.js"] });
  }
});
