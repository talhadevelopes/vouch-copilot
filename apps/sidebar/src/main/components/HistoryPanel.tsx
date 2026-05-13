import React from 'react';
import type { ChatMessage } from '../utils/types';
import { HISTORY_TTL_MS, type HistoryEntry } from '../hooks/useHistory';

interface HistoryPanelProps {
  onSelectEntry: (entry: HistoryEntry) => void;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (hours >= 1) return `${hours}h ago`;
  if (minutes >= 1) return `${minutes}m ago`;
  return 'just now';
}

function getBiasColor(score: number | undefined): string {
  if (!score) return '#9ca3af';
  if (score > 60) return '#ef4444';
  if (score > 30) return '#f59e0b';
  return '#22c55e';
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onSelectEntry }) => {
  const [entries, setEntries] = React.useState<HistoryEntry[]>([]);

  React.useEffect(() => {
    chrome.storage.local.get(null, (items) => {
      const now = Date.now();
      const toDelete: string[] = [];
      const valid: HistoryEntry[] = [];

      for (const [key, value] of Object.entries(items)) {
        if (!key.startsWith('vouch_history_')) continue;
        const entry = value as HistoryEntry;
        if (now - entry.savedAt > HISTORY_TTL_MS) {
          toDelete.push(key);
        } else {
          valid.push(entry);
        }
      }

      if (toDelete.length > 0) chrome.storage.local.remove(toDelete);
      valid.sort((a, b) => b.savedAt - a.savedAt);
      setEntries(valid);
    });
  }, []);

  if (entries.length === 0) {
    return (
      <div className="v-history-empty">
        <p style={{ marginBottom: 8 }}>No history yet.</p>
        <p style={{ margin: 0, fontSize: 11 }}>
          Chat, scan, or use "Vouch this" on any page and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="v-history-list">
        {entries.map((entry) => {
          const chatCount = entry.messages?.filter((m: ChatMessage) => m.sender === 'user').length ?? 0;
          const claimsCount = entry.claims?.length ?? 0;
          const vouchCount = entry.vouchEntries?.length ?? 0;
          const biasScore = entry.analysis?.biasScore;

          return (
            <div
              key={entry.url}
              className="v-history-item"
              onClick={() => onSelectEntry(entry)}
            >
              <div className="v-history-item-url" title={entry.url}>
                {entry.title || new URL(entry.url).hostname}
              </div>

              {/* Activity badges */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                {claimsCount > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, background: '#fef2f2', color: '#dc2626', borderRadius: 4, padding: '1px 5px' }}>
                    {claimsCount} claims
                  </span>
                )}
                {biasScore !== undefined && (
                  <span style={{ fontSize: 9, fontWeight: 700, background: '#f3f4f6', color: getBiasColor(biasScore), borderRadius: 4, padding: '1px 5px' }}>
                    bias {biasScore}
                  </span>
                )}
                {vouchCount > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, background: '#eff6ff', color: '#3b82f6', borderRadius: 4, padding: '1px 5px' }}>
                    {vouchCount} vouched
                  </span>
                )}
                {chatCount > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', borderRadius: 4, padding: '1px 5px' }}>
                    {chatCount} msgs
                  </span>
                )}
              </div>

              <div className="v-history-item-meta">
                <span>{timeAgo(entry.savedAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="v-history-notice">⏱ History is kept for 48 hours.</p>
    </div>
  );
};
