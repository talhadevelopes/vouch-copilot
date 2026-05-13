/**
 * Shared highlight utility — sends HIGHLIGHT_REQUEST to service worker.
 * Used by BiasPanel, ClaimCard, and any component that needs page highlighting.
 */
export async function highlightOnPage(text: string): Promise<void> {
  if (!text) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    chrome.runtime.sendMessage({
      type: 'HIGHLIGHT_REQUEST',
      tabId: tab.id,
      text,
    });
  } catch (e) {
    console.error('Highlight failed:', e);
  }
}
