import { useState } from 'react';
import { authFetch, updateAnalysis } from '../../lib/api';
import type { StreamEvent } from '../utils/types';
import { saveVouchToHistory } from './useHistory';

export function useClaimStream() {
  const [selectedClaimText, setSelectedClaimText] = useState('');
  const [selectedClaimStreamText, setSelectedClaimStreamText] = useState('');
  const [isVerifyingSelected, setIsVerifyingSelected] = useState(false);

  const vouchSelectedClaim = async (text: string, url?: string, title?: string, remoteId?: string) => {

    setIsVerifyingSelected(true);
    setSelectedClaimText(text);
    setSelectedClaimStreamText('');
    try {
      const res = await authFetch('/verify', {
        method: 'POST',
        body: JSON.stringify({ claim: text, streamResponse: true }),
      });

      if (!res.ok || !res.body) throw new Error(`Verify failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let eventEnd = buffer.indexOf('\n\n');
        while (eventEnd !== -1) {
          const rawEvent = buffer.slice(0, eventEnd).trim();
          buffer = buffer.slice(eventEnd + 2);
          eventEnd = buffer.indexOf('\n\n');
          if (!rawEvent) continue;

          for (const line of rawEvent.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const dataStr = line.slice('data:'.length).trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr) as StreamEvent;
              if (parsed?.type === 'token' && typeof parsed.text === 'string') {
                fullText += parsed.text;
                setSelectedClaimStreamText(fullText);
              }
              if (parsed?.type === 'final' && typeof parsed.text === 'string') {
                fullText = parsed.text;
                setSelectedClaimStreamText(fullText);
              }
            } catch { }
          }
        }
      }
    } catch (error) {
      console.error('Selected claim verification failed:', error);
      setSelectedClaimStreamText('Verification failed. Please try again.');
    } finally {
      setIsVerifyingSelected(false);
      // Save to local history after stream completes
      if (url && selectedClaimStreamText) {
        saveVouchToHistory(url, title || url, text, selectedClaimStreamText);
        
        // Sync to remote if we have a remoteId
        if (remoteId) {
          chrome.storage.local.get(`vouch_history_${url}`, (result) => {
            const entry = result[`vouch_history_${url}`];
            if (entry?.vouchEntries) {
              updateAnalysis(remoteId, {
                vouchHistory: entry.vouchEntries
              }).catch(err => console.error('Failed to sync vouch to dashboard:', err));
            }
          });
        }
      }
    }
  };

  const reset = () => {
    setSelectedClaimText('');
    setSelectedClaimStreamText('');
    setIsVerifyingSelected(false);
  };

  return {
    selectedClaimText,
    setSelectedClaimText,
    selectedClaimStreamText,
    setSelectedClaimStreamText,
    isVerifyingSelected,
    vouchSelectedClaim,
    reset,
  };
}