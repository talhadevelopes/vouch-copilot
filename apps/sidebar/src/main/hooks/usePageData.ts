import { useState, useRef, useEffect } from 'react';
import { loadHistory } from './useHistory';
import type { PageData, ChatMessage } from '../utils/types';
import { requestPageData } from '../../utils/runtime-messages';

export function usePageData() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoredMessages, setRestoredMessages] = useState<ChatMessage[]>([]);
  const [remoteId, setRemoteId] = useState<string | undefined>(undefined);
  const [chatKey, setChatKey] = useState(0);
  const pageLoadIdRef = useRef(0);

  const loadPageData = async (tabId: number): Promise<PageData | null> => requestPageData(tabId);

  const applyPageData = async (payload: PageData): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(`vouch_history_${payload.url}`, (result) => {
        const entry = result[`vouch_history_${payload.url}`];
        const history = entry?.messages ?? [];
        setRestoredMessages(history);
        setRemoteId(entry?.remoteId);
        setData(payload);
        setLoading(false);
        resolve();
      });
    });
  };

  // Tab switch: re-fetch from session storage
  useEffect(() => {
    const onTabActivated = async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!tab?.id) { setLoading(false); return; }

      const response = await loadPageData(tab.id!);
      if (response) {
        // Only reset state if the URL actually changed
        setData((prev) => {
          if (prev?.url === response.url) {
            setLoading(false);
            return prev;
          }
          pageLoadIdRef.current++;
          setRestoredMessages([]);
          setChatKey((k) => k + 1);
          applyPageData(response); // We might need to handle the return value here or elsewhere
          return response;
        });
      } else {
        // If no data for this tab, show loading then fallback
        setData(null);
        setLoading(true);
        setRestoredMessages([]);
        setChatKey((k) => k + 1);
        
        let attempts = 0;
        const tryFetch = async () => {
          const res = await loadPageData(tab.id!);
          if (res) {
            await applyPageData(res);
          } else if (attempts < 8) {
            attempts++;
            setTimeout(tryFetch, 500);
          } else {
            setLoading(false);
          }
        };
        tryFetch();
      }
    };

    chrome.tabs.onActivated.addListener(onTabActivated);
    return () => chrome.tabs.onActivated.removeListener(onTabActivated);
  }, []);

  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) { setLoading(false); return; }

      let attempts = 0;
      const tryFetch = async () => {
        const response = await loadPageData(tab.id!);
        if (response) {
          pageLoadIdRef.current++;
          await applyPageData(response);
        } else if (attempts < 10) {
          attempts++;
          setTimeout(tryFetch, 500);
        } else {
          setLoading(false);
        }
      };
      tryFetch();
    };
    fetchData();
  }, []);

  return {
    data,
    loading,
    restoredMessages,
    setRestoredMessages,
    remoteId,
    setRemoteId,
    chatKey,
    setChatKey,
    pageLoadIdRef,
    setData,
    setLoading,
    applyPageData,
  };
}