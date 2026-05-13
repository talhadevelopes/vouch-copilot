chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "vouch-this",
    title: "Vouch this",
    contexts: ["selection"]
  });
});

let currentActiveTabId: number | null = null;

function autoOpenSidePanel(tabId?: number) {
  // sidePanel.open() can only be called from user gesture (click/context menu).
  // Auto-opening on tab activation/update is not supported by Chrome and causes errors.
  return;
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
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