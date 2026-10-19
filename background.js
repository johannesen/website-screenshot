// background.js - Service Worker for handling captures and downloads

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureVisibleTab") {
    // Capture the visible tab in the current window
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true; // Keep channel open for async response
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
