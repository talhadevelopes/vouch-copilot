import { useCallback, useEffect, useState } from 'react';
import { CredibilityPanel } from './components/CredibilityPanel';
import { BiasPanel } from './components/BiasPanel';
import { ChatPanel } from './components/ChatPanel';
import { SelectedClaimResult } from './components/SelectedClaimResult';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { usePageData } from './hooks/usePageData';
import { useVerification } from './hooks/useVerification';
import { useClaimStream } from './hooks/useClaimStream';
import { saveHistory, saveScanToHistory, type HistoryEntry } from './hooks/useHistory';
import type { Tab, ChatMessage } from './utils/types';
import { DEFAULT_TAB, TAB_LABEL } from './utils/constants';
import { useSidebarUiState } from './hooks/useSidebarUiState';
import { useRuntimeMessages } from './hooks/useRuntimeMessages';
import { useExtensionAuth } from './hooks/useExtensionAuth';
import { updateAnalysis } from '../lib/api';

export default function App() {
  const { authState } = useExtensionAuth();
  const isConnected = authState === "Connected";

  const {
    data, loading, restoredMessages, setRestoredMessages,
    remoteId, setRemoteId, chatKey, setChatKey, pageLoadIdRef, applyPageData,
  } = usePageData();

  const {
    claims, isVerifying, analysis, isAnalyzing,
    verifyEnabled, setVerifyEnabled, startVerification,
    startAnalysis, startFullScan, handleVerifyToggle, reset: resetVerification,
  } = useVerification();

  const {
    selectedClaimText, setSelectedClaimText,
    selectedClaimStreamText, isVerifyingSelected,
    vouchSelectedClaim, reset: resetClaim,
  } = useClaimStream();

  const {
    activeTab,
    setActiveTab,
    showSettings,
    closeSettings,
    toggleSettings,
    switchTab,
  } = useSidebarUiState();

  // Load verify preference
  useEffect(() => {
    chrome.storage.sync.get({ verifyEnabled: false }, (result) => {
      setVerifyEnabled(!!result.verifyEnabled);
    });
  }, []);

  const handleSelectedClaim = useCallback(
    (text: string) => {
      resetClaim();
      setSelectedClaimText(text);
      closeSettings();
      setActiveTab('claim');
      vouchSelectedClaim(text, data?.url, data?.title, remoteId);
    },
    [closeSettings, data, remoteId, resetClaim, setActiveTab, setSelectedClaimText, vouchSelectedClaim],
  );

  const handleDataReady = useCallback(
    (payload: { textContent: string; title: string; url: string; wordCount: number; isArticle: boolean }) => {
      if (!payload?.textContent) return;
      pageLoadIdRef.current++;
      resetVerification();
      resetClaim();
      closeSettings();
      setRestoredMessages([]);
      applyPageData(payload);
      setActiveTab(DEFAULT_TAB);
    },
    [applyPageData, closeSettings, pageLoadIdRef, resetClaim, resetVerification, setActiveTab, setRestoredMessages],
  );

  useRuntimeMessages({
    onSelectedClaim: handleSelectedClaim,
    onDataReady: handleDataReady,
  });

  // Save chat history on message changes
  const handleMessagesChange = (messages: ChatMessage[]) => {
    if (data?.url) {
      saveHistory(data.url, data.title ?? '', messages);
      if (remoteId) {
        updateAnalysis(remoteId, {
          chatHistory: messages.map(m => ({ sender: m.sender === 'vouch' ? 'assistant' : m.sender, text: m.text }))
        }).catch(err => console.error('Failed to sync chat to dashboard:', err));
      }
    }
  };

  // Scan page: One click, one single request to the backend
  const refreshVerification = async () => {
    if (!data?.textContent || !verifyEnabled) return;
    const loadId = ++pageLoadIdRef.current;
    setActiveTab('facts');

    // The backend now handles both verification and bias in a single call
    const result = await startFullScan(data.textContent, data.url, data.title, loadId, pageLoadIdRef, restoredMessages);

    // Save scan result to local sidebar history
    if (result && data.url) {
      saveScanToHistory(data.url, data.title, result.claims || [], result.analysis ?? null, result.remoteId);
      if (result.remoteId) setRemoteId(result.remoteId);
    }
  };

  // Toggle verification and close settings
  const onVerifyToggle = () => {
    handleVerifyToggle();
    closeSettings();
    if (verifyEnabled) setActiveTab(DEFAULT_TAB);
  };

  // History entry restore
  const handleHistorySelect = (entry: HistoryEntry) => {
    setRestoredMessages(entry.messages);
    setRemoteId(entry.remoteId);
    setChatKey((k) => k + 1);
    setActiveTab(DEFAULT_TAB);
    closeSettings();
  };

  if (loading) {
    return (
      <div className="v-screen-center">
        <img src="/logo.png" alt="Vouch" className="v-screen-logo" />
        <div className="v-screen-title">Analyzing article...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="v-screen-top">
        <img src="/logo.png" alt="Vouch" className="v-screen-logo-top" />
        <p className="v-screen-muted-text">
          No article data found. Make sure you are on a news article page.
        </p>
      </div>
    );
  }

  const visibleTabs: Tab[] = verifyEnabled
    ? ['chat', 'facts', 'bias', 'claim', 'history']
    : ['chat', 'claim', 'history'];

  const contentClass = showSettings || activeTab !== DEFAULT_TAB ? 'v-content' : 'v-content-noscroll';

  const ConnectionRequired = ({ feature }: { feature: string }) => (
    <div className="v-connection-required">
      <div className="v-connection-required-icon"><img src="/logo.png" alt="Vouch" className="v-header-logo" /></div>
      <h3 className="v-connection-required-title">{feature} is locked</h3>
      <p className="v-connection-required-text">
        Please connect your account in settings to use this feature.
      </p>
      <button onClick={toggleSettings} className="v-btn-primary">
        Go to Settings
      </button>
    </div>
  );

  return (
    <div className="v-container">
      {/* Header */}
      <header className="v-header">
        <div className="v-header-logo-container">
          <img
            src="/logo.png"
            alt="Vouch"
            className="v-header-logo"
          />
        </div>
        <div className="v-header-actions">
          <button
            onClick={toggleSettings}
            title="Settings"
            className="v-settings-btn"
          >
            <span className="v-settings-icon">⚙</span>
          </button>
        </div>
      </header>

      {/* Nav */}
      {!showSettings && (
        <div className="v-nav">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`v-nav-btn${activeTab === tab ? ' active' : ''}`}
            >
              {TAB_LABEL[tab]}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className={contentClass}>
        {/* Page info card */}
        <div className="v-page-card">
          <h3 className="v-page-card-label">Analyzing</h3>
          <p className="v-page-card-title">{data.title}</p>
          <div className="v-page-card-meta">
            <span>{data.wordCount} words</span>
            <span className="v-page-card-url">{new URL(data.url).hostname}</span>
          </div>
        </div>

        {showSettings ? (
          <SettingsPanel
            verifyEnabled={verifyEnabled}
            onVerifyToggle={onVerifyToggle}
            onBack={() => {
              closeSettings();
              setActiveTab(DEFAULT_TAB);
            }}
          />
        ) : !isConnected ? (
          <ConnectionRequired feature="Vouch Copilot" />
        ) : (
          <>
            {/* Facts tab */}
            {verifyEnabled && activeTab === 'facts' && (
              <>
                <div className="v-scan-bar">
                  <div>
                    <div className="v-scan-bar-title">Scan this page</div>
                    <div className="v-scan-bar-sub">Runs Verify (facts) + Bias together.</div>
                  </div>
                  <button
                    onClick={refreshVerification}
                    disabled={isVerifying || isAnalyzing}
                    className="v-scan-btn"
                    title="Scan page"
                  >
                    {isVerifying || isAnalyzing ? 'Scanning...' : 'Scan'}
                  </button>
                </div>
                <CredibilityPanel claims={claims} isVerifying={isVerifying} />
              </>
            )}

            {/* Bias tab */}
            {verifyEnabled && activeTab === 'bias' && (
              <BiasPanel analysis={analysis} isAnalyzing={isAnalyzing} />
            )}

            {/* Vouch (claim) tab */}
            {activeTab === 'claim' && (
              selectedClaimText ? (
                <SelectedClaimResult
                  selectedText={selectedClaimText}
                  streamText={selectedClaimStreamText}
                  isVerifying={isVerifyingSelected}
                  onDismiss={() => {
                    resetClaim();
                    setActiveTab(DEFAULT_TAB);
                  }}
                />
              ) : (
                <div className="v-card-outlined">
                  Select some text on the page and use{' '}
                  <span className="v-inline-emphasis">Vouch this</span>.
                </div>
              )
            )}

            {/* History tab */}
            {activeTab === 'history' && (
              <HistoryPanel onSelectEntry={handleHistorySelect} />
            )}

            {/* Chat tab */}
            {activeTab === DEFAULT_TAB && data && (
              <ChatPanel
                key={chatKey}
                pageContent={data.textContent}
                computeSourceSentence={verifyEnabled}
                initialMessages={restoredMessages}
                onMessagesChange={handleMessagesChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}