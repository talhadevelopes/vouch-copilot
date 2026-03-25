import { useEffect, useRef, useState } from "react";
import { CredibilityPanel } from "./components/CredibilityPanel";
import { BiasPanel } from "./components/BiasPanel";
import { ChatPanel } from "./components/ChatPanel";
import { SelectedClaimResult } from "./components/SelectedClaimResult";
import type { VerificationResult, AnalysisResult } from "./types";
import { verifyPage, analyzePage } from "../lib/api";

interface PageData {
  title: string;
  textContent: string;
  url: string;
  wordCount: number;
  isArticle: boolean;
}

type Tab = "facts" | "bias" | "chat" | "claim";

export default function App() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [verifyEnabled, setVerifyEnabled] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const pageLoadIdRef = useRef(0);
  const [showSettings, setShowSettings] = useState(false);

  const [claims, setClaims] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const verifyEnabledRef = useRef(false);

  const [selectedClaimText, setSelectedClaimText] = useState("");
  const [selectedClaimResult, setSelectedClaimResult] =
    useState<VerificationResult | null>(null);
  const [isVerifyingSelected, setIsVerifyingSelected] = useState(false);

  useEffect(() => {
    verifyEnabledRef.current = verifyEnabled;
  }, [verifyEnabled]);

  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === "VOUCH_SELECTED_CLAIM") {
        setSelectedClaimText(message.text);
        setSelectedClaimResult(null);
        setIsVerifyingSelected(false);
        setShowSettings(false);
        setActiveTab("claim");
        vouchSelectedClaim(message.text);
      }

      if (message.type === "DATA_READY") {
        const payload = (message as any).payload as PageData | undefined;
        if (!payload?.textContent) return;

        pageLoadIdRef.current++;

        // Reset everything related to the previous page.
        setClaims([]);
        setIsVerifying(false);
        setAnalysis(null);
        setIsAnalyzing(false);
        setSelectedClaimText("");
        setSelectedClaimResult(null);
        setIsVerifyingSelected(false);
        setShowSettings(false);

        setData(payload);
        setLoading(false);
        setChatKey((k) => k + 1);

        // No automatic scanning on sidebar open.
        // Default to Chat; user can manually click Scan in Verify tab.
        setActiveTab("chat");
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    chrome.storage.sync.get({ verifyEnabled: false }, (result) => {
      setVerifyEnabled(!!result.verifyEnabled);
    });

    const fetchData = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) {
        setLoading(false);
        return;
      }

      let attempts = 0;
      const maxAttempts = 10;

      const tryFetch = () => {
        chrome.runtime.sendMessage(
          { type: "GET_PAGE_DATA", tabId: tab.id },
          (response: PageData | null) => {
            if (response?.textContent) {
              pageLoadIdRef.current++;
              setData(response);
              // No automatic scanning on sidebar open.
              setActiveTab("chat");
              setClaims([]);
              setAnalysis(null);
              setLoading(false);
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(tryFetch, 500);
            } else {
              setLoading(false);
            }
          },
        );
      };

      tryFetch();
    };

    fetchData();
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  // Hard reset when the user activates a different browser tab.
  // Background script will re-inject content script and send DATA_READY.
  useEffect(() => {
    const onTabActivated = () => {
      pageLoadIdRef.current++;
      setData(null);
      setLoading(true);

      setClaims([]);
      setIsVerifying(false);
      setAnalysis(null);
      setIsAnalyzing(false);

      setSelectedClaimText("");
      setSelectedClaimResult(null);
      setIsVerifyingSelected(false);

      setChatKey((k) => k + 1);
      setActiveTab("chat");
      setShowSettings(false);
    };

    chrome.tabs.onActivated.addListener(onTabActivated);
    return () => chrome.tabs.onActivated.removeListener(onTabActivated);
  }, []);

  const vouchSelectedClaim = async (text: string) => {
    setIsVerifyingSelected(true);
    setSelectedClaimText(text);
    setSelectedClaimResult(null);
    try {
      // Use fetch streaming so this does not feel “stuck”.
      const API_URL = import.meta.env.VITE_API_URL || "https://vouch-server.fly.dev";
      const res = await fetch(`${API_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: text }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Selected claim verify failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buf = "";
      let parsedOnce = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // We expect a newline-delimited JSON object.
        const line = buf.split("\n").map((l) => l.trim()).find((l) => l.startsWith("{") && l.endsWith("}"));
        if (line && !parsedOnce) {
          parsedOnce = true;
          const obj = JSON.parse(line) as VerificationResult;
          if (obj?.verdict) setSelectedClaimResult(obj);
        }
      }

      // If stream didn't deliver a newline-delimited object, attempt final parse.
      if (!parsedOnce) {
        const json = buf.trim().match(/\{[\s\S]*\}/)?.[0];
        if (json) {
          const obj = JSON.parse(json) as VerificationResult;
          if (obj?.verdict) setSelectedClaimResult(obj);
        }
      }
    } catch (error) {
      console.error("Selected claim verification failed:", error);
      setSelectedClaimResult({
        claim: text,
        verdict: "unverified",
        explanation:
          "Verification is temporarily unavailable (rate limit/quota). Please try again after a short while.",
        sources: [],
      });
    } finally {
      setIsVerifyingSelected(false);
    }
  };

  const startVerification = async (content: string, url: string, loadId: number) => {
    setIsVerifying(true);
    setClaims([]);
    try {
      const { data } = await verifyPage(content, url);

      let parsedResults: VerificationResult[] = [];
      if (typeof data === "string") {
        const lines = data.split("\n").filter((l) => l.trim());
        parsedResults = lines.map((l) => JSON.parse(l) as VerificationResult);
      } else if (Array.isArray(data)) {
        parsedResults = data;
      }

      if (pageLoadIdRef.current !== loadId) return;
      setClaims(parsedResults.filter((r) => r.claim));
    } catch (error) {
      console.error("Verification failed:", error);
    } finally {
      if (pageLoadIdRef.current === loadId) {
        setIsVerifying(false);
      }
    }
  };

  const startAnalysis = async (content: string, url: string, loadId: number) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const { data } = await analyzePage(content, url);
      if (pageLoadIdRef.current !== loadId) return;
      setAnalysis(data as AnalysisResult);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      if (pageLoadIdRef.current === loadId) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleVerifyToggle = () => {
    const newValue = !verifyEnabled;
    // Invalidate in-flight verification/analysis work.
    pageLoadIdRef.current++;

    setVerifyEnabled(newValue);
    chrome.storage.sync.set({ verifyEnabled: newValue });
    setShowSettings(false);
    // If disabling verification, jump back to chat so only Chat + Vouch are visible.
    if (!newValue) {
      setActiveTab("chat");
    }
  };

  const refreshVerification = async () => {
    if (!data?.textContent || !data?.isArticle || !verifyEnabled) return;
    const loadId = ++pageLoadIdRef.current;
    setActiveTab("facts");
    await Promise.all([
      startVerification(data.textContent, data.url, loadId),
      startAnalysis(data.textContent, data.url, loadId),
    ]);
  };

  if (loading)
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#fff",
        }}
      >
        <img
          src="/logo.png"
          alt="Vouch"
          style={{ width: "80px", margin: "0 auto 20px" }}
        />
        <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
          Analyzing article...
        </div>
      </div>
    );

  if (!data)
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          background: "#fff",
          height: "100vh",
        }}
      >
        <img
          src="/logo.png"
          alt="Vouch"
          style={{ width: "80px", margin: "20px auto" }}
        />
        <p style={{ color: "#666" }}>
          No article data found. Make sure you are on a news article page.
        </p>
      </div>
    );

  const styles = {
    container: {
      width: "400px",
      height: "100vh",
      fontFamily: "Cabinet Grotesk, sans-serif",
      backgroundColor: "#ffffff",
      borderLeft: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column" as const,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      color: "#111827",
      overflowX: "hidden",
    },
    header: {
      padding: "16px",
      borderBottom: "1px solid #f3f4f6",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#ffffff",
      position: "sticky" as const,
      top: 0,
      zIndex: 10,
    },
    logoContainer: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    logoBox: {
      width: "32px",
      height: "32px",
      backgroundColor: "#dc2626",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#ffffff",
      fontWeight: "bold",
      overflow: "hidden",
    },
    logoText: {
      fontWeight: 800,
      fontSize: "16px",
      lineHeight: 1,
    },
    logoSubtext: {
      fontSize: "10px",
      color: "#dc2626",
      fontWeight: 800,
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    },
    settingsButton: {
      background: "none",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px",
      borderRadius: "10px",
      transition: "background 0.2s",
    },
    nav: {
      display: "flex",
      borderBottom: "1px solid #f3f4f6",
    },
    navButton: (active: boolean) => ({
      flex: 1,
      padding: "12px 0",
      fontSize: "12px",
      fontWeight: 900,
      textTransform: "uppercase" as const,
      letterSpacing: "0.025em",
      backgroundColor: "transparent",
      border: "none",
      borderBottom: active ? "2px solid #dc2626" : "2px solid transparent",
      color: active ? "#dc2626" : "#9ca3af",
      cursor: "pointer",
      transition: "all 0.2s",
    }),
    content: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto" as const,
      padding: "16px",
      display: "flex",
      flexDirection: "column" as const,
      gap: "16px",
    },
    contentNoScroll: {
      ...({
        flex: 1,
        minHeight: 0,
        overflowY: "hidden",
        padding: "16px",
        display: "flex",
        flexDirection: "column" as const,
        gap: "16px",
      } as const),
    },
    analyzingCard: {
      background: "#ffffff",
      padding: "15px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      border: "1px solid #E0E0E0",
    },
  };

  const contentStyle =
    showSettings || activeTab !== "chat" ? styles.content : styles.contentNoScroll;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <div style={styles.logoBox}>
            <img
              src="/logo.png"
              alt="Vouch"
              style={{ height: 18, width: 18, objectFit: "contain" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setShowSettings((v) => !v)}
            title="Settings"
            style={styles.settingsButton}
          >
            <span style={{ fontSize: 18, fontWeight: 900 }}>⚙</span>
          </button>
        </div>
      </header>

      {!showSettings && (
        <div style={styles.nav}>
          {(data?.isArticle && verifyEnabled
            ? (["chat", "facts", "bias", "claim"] as Tab[])
            : (["chat", "claim"] as Tab[])
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setShowSettings(false);
              }}
              style={styles.navButton(activeTab === tab)}
            >
              {tab === "facts" ? "Verify" : tab === "bias" ? "Bias" : tab === "claim" ? "Vouch" : "Chat"}
            </button>
          ))}
        </div>
      )}

      <div style={contentStyle}>
        <div style={styles.analyzingCard}>
          <h3
            style={{
              fontSize: "0.75rem",
              margin: "0 0 8px 0",
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Analyzing
          </h3>
          <p
            style={{
              margin: "0 0 10px 0",
              fontWeight: 900,
              fontSize: "1rem",
              lineHeight: "1.3",
              color: "#1A1A1A",
            }}
          >
            {data.title}
          </p>
          <div
            style={{
              display: "flex",
              gap: "15px",
              fontSize: "0.75rem",
              color: "#555",
              fontWeight: 700,
            }}
          >
            <span>📏 {data.wordCount} words</span>
            <span style={{ color: "#dc2626", wordBreak: "break-all", overflow: "hidden", maxWidth: "100%" }}>
              🔗 {new URL(data.url).hostname}
            </span>
          </div>
        </div>

        {showSettings ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Preferences
              </h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, background: "#F9FAFB", border: "1px solid #F3F4F6", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Verification
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, marginTop: 2 }}>
                    Enable to run Verify + Bias.
                  </div>
                </div>
                <button
                  onClick={handleVerifyToggle}
                  style={{
                    width: "52px",
                    height: "18px",
                    borderRadius: "9px",
                    background: verifyEnabled ? "#dc2626" : "#E5E7EB",
                    border: "none",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.3s",
                  }}
                  title="Toggle verification to save API quota"
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: "2px",
                      left: verifyEnabled ? "34px" : "2px",
                      transition: "left 0.3s",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                    }}
                  />
                </button>
              </div>
              <div style={{ padding: 16, borderRadius: 12, background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                <p style={{ color: "#9ca3af", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  About Vouch
                </p>
                <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                  Vouch Web Copilot uses Gemini AI to provide real-time insights. Verification results are cached locally to minimize API usage.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSettings(false);
                setActiveTab("chat");
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Back to Chat
            </button>
          </div>
        ) : (
          <>
            {data.isArticle && verifyEnabled && activeTab === "facts" && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 12px",
                    borderRadius: 14,
                    border: "1px solid #f3f4f6",
                    background: "#fff",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Scan this page
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, marginTop: 2 }}>
                      This runs Verify (facts) + Bias together.
                    </div>
                  </div>
                  <button
                    onClick={() => refreshVerification()}
                    disabled={isVerifying || isAnalyzing}
                    style={{
                      background: "#dc2626",
                      border: "none",
                      color: "#fff",
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontWeight: 900,
                      cursor: isVerifying || isAnalyzing ? "not-allowed" : "pointer",
                      opacity: isVerifying || isAnalyzing ? 0.7 : 1,
                      transition: "opacity 0.2s",
                      whiteSpace: "nowrap",
                    }}
                    title="Scan page"
                  >
                    {isVerifying || isAnalyzing ? "Scanning..." : "Scan"}
                  </button>
                </div>

                <CredibilityPanel claims={claims} isVerifying={isVerifying} />
              </>
            )}
            {data.isArticle && verifyEnabled && activeTab === "bias" && (
              <BiasPanel analysis={analysis} isAnalyzing={isAnalyzing} />
            )}
            {activeTab === "claim" && (
              selectedClaimText ? (
                <SelectedClaimResult
                  selectedText={selectedClaimText}
                  result={selectedClaimResult}
                  isVerifying={isVerifyingSelected}
                  onDismiss={() => {
                    setSelectedClaimText("");
                    setSelectedClaimResult(null);
                    setActiveTab("chat");
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: 20,
                    background: "#fff",
                    border: "1px solid #E0E0E0",
                    borderRadius: 12,
                    color: "#6b7280",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Select some text on the page and use <span style={{ color: "#dc2626", fontWeight: 900 }}>Vouch this</span>.
                </div>
              )
            )}
            {activeTab === "chat" && data && (
              <ChatPanel
                key={chatKey}
                pageContent={data.textContent}
                computeSourceSentence={verifyEnabled}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
