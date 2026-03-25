chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "vouch-this",
    title: "Vouch this",
    contexts: ["selection"]
  });
});

let currentActiveTabId: number | null = null;
const lastSidePanelOpenAt = new Map<number, number>();

function shouldOpenSidePanel(tabId: number) {
  const now = Date.now();
  const last = lastSidePanelOpenAt.get(tabId) || 0;
  if (now - last < 2500) return false;
  lastSidePanelOpenAt.set(tabId, now);
  return true;
}

function autoOpenSidePanel(tabId?: number) {
  if (!tabId) return;
  if (!shouldOpenSidePanel(tabId)) return;
  // Try-catch because chrome.sidePanel APIs can be restricted depending on browser/user gesture.
  try {
    if (currentActiveTabId === tabId) {
      chrome.sidePanel.open({ tabId });
    }
  } catch (e) {
    // Avoid crashing the service worker.
    console.warn("Failed to auto-open side panel:", e);
  }
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  // Keep this in sync with what the sidebar represents.
  currentActiveTabId = tab.id;
  chrome.sidePanel.open({ tabId: tab.id });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

const lastInjectedAt = new Map<number, number>();

function shouldThrottle(tabId: number) {
  const now = Date.now();
  const last = lastInjectedAt.get(tabId) || 0;
  if (now - last < 1200) return true;
  lastInjectedAt.set(tabId, now);
  return false;
}

function reinjectContentScript(tabId?: number) {
  if (!tabId) return;
  if (shouldThrottle(tabId)) return;
  chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  currentActiveTabId = activeInfo.tabId;
  reinjectContentScript(activeInfo.tabId);

  autoOpenSidePanel(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    if (currentActiveTabId === tabId) {
      reinjectContentScript(tabId);
      autoOpenSidePanel(tabId);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGE_EXTRACTED') {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.storage.session.set({ [`page_data_${tabId}`]: message.payload });
      // Notify the side panel only when the extracted tab is the currently active one.
      if (currentActiveTabId === tabId || currentActiveTabId === null) {
        chrome.runtime.sendMessage({
          type: "DATA_READY",
          tabId,
          payload: message.payload,
        });
      }
    }
  }

  if (message.type === 'GET_PAGE_DATA') {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) { sendResponse(null); return; }
      chrome.storage.session.get(`page_data_${tabId}`, (result) => {
        sendResponse(result[`page_data_${tabId}`] || null);
      });
    });
    return true;
  }

  if (message.type === 'HIGHLIGHT_REQUEST') {
    chrome.tabs.sendMessage(message.tabId, {
      type: 'HIGHLIGHT_TEXT',
      text: message.text
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "vouch-this" && info.selectionText && tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id });
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'VOUCH_SELECTED_CLAIM',
        text: info.selectionText
      });
    }, 1000);
  }
});