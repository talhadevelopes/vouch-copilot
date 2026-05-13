import type { ChatMessage, VerificationResult, AnalysisResult } from '../utils/types';

export const HISTORY_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export type HistoryEntry = {
  url: string;
  title: string;
  savedAt: number;
  remoteId?: string; // The database ID
  // chat
  messages: ChatMessage[];
  // scan results
  claims?: VerificationResult[];
  analysis?: AnalysisResult | null;
  // vouch this history
  vouchEntries?: { claim: string; result: string; savedAt: number }[];
};

function historyKey(url: string): string {
  return `vouch_history_${url}`;
}

export function saveHistory(url: string, title: string, messages: ChatMessage[]): void {
  if (!url) return;
  chrome.storage.local.get(historyKey(url), (result) => {
    const existing: HistoryEntry = result[historyKey(url)] ?? { url, title, messages: [], savedAt: Date.now() };
    const updated: HistoryEntry = { ...existing, title: title || existing.title, messages, savedAt: Date.now() };
    chrome.storage.local.set({ [historyKey(url)]: updated });
  });
}

export function saveScanToHistory(url: string, title: string, claims: VerificationResult[], analysis: AnalysisResult | null, remoteId?: string): void {
  if (!url) return;
  chrome.storage.local.get(historyKey(url), (result) => {
    const existing: HistoryEntry = result[historyKey(url)] ?? { url, title, messages: [], savedAt: Date.now() };
    const updated: HistoryEntry = { ...existing, title: title || existing.title, claims, analysis, remoteId: remoteId || existing.remoteId, savedAt: Date.now() };
    chrome.storage.local.set({ [historyKey(url)]: updated });
  });
}

export function saveVouchToHistory(url: string, title: string, claim: string, result: string): void {
  if (!url) return;
  chrome.storage.local.get(historyKey(url), (existing_result) => {
    const existing: HistoryEntry = existing_result[historyKey(url)] ?? { url, title, messages: [], savedAt: Date.now() };
    const vouchEntries = existing.vouchEntries ?? [];
    vouchEntries.push({ claim, result, savedAt: Date.now() });
    const updated: HistoryEntry = { ...existing, title: title || existing.title, vouchEntries, savedAt: Date.now() };
    chrome.storage.local.set({ [historyKey(url)]: updated });
  });
}

export function loadHistory(url: string): Promise<ChatMessage[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(historyKey(url), (result) => {
      const entry = result[historyKey(url)] as HistoryEntry | undefined;
      if (!entry) return resolve([]);
      if (Date.now() - entry.savedAt > HISTORY_TTL_MS) {
        chrome.storage.local.remove(historyKey(url));
        return resolve([]);
      }
      resolve(entry.messages ?? []);
    });
  });
}
