"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  LogOut, Zap, Link2, BarChart2, Clock, Globe,
  ExternalLink, Share2, Check, Copy, RefreshCw,
  ArrowRight, AlertCircle, History, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, clearAuthTokens } from "@/lib/api";
import type { HistoryItem, User } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

type MeResponse = {
  user: User;
};

type HistoryResponse = {
  history: HistoryItem[];
};

function buildChartData(history: HistoryItem[]) {
  const map = new Map<string, number>();
  // Last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    map.set(label, 0);
  }

  for (const item of history) {
    const day = new Date(item.createdAt).toLocaleDateString(undefined, { weekday: "short" });
    if (map.has(day)) {
      map.set(day, (map.get(day) ?? 0) + 1);
    }
  }
  return Array.from(map.entries()).map(([day, v]) => ({ day, v }));
}

const SPIN = (
  <svg style={{ animation: "vd-spin .7s linear infinite" }} width="14" height="14"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
  </svg>
);

const TICKER_ITEMS = [
  "Fact Check", "Beat Bias", "Verify Claims", "Read Smarter", "Detect Spin", "Stay Informed"
];

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [url, setUrl] = useState("");
  const [urlErr, setUrlErr] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/auth/me"),
    retry: false,
  });

  const historyQuery = useQuery({
    queryKey: ["history"],
    queryFn: () => apiFetch<HistoryResponse>("/dashboard/history"),
    enabled: meQuery.isSuccess,
  });

  const createAnalysisMutation = useMutation({
    mutationFn: (inputUrl: string) =>
      apiFetch<{ item: HistoryItem }>("/dashboard/analysis", {
        method: "POST",
        body: { inputUrl },
      }),
    onSuccess: (data) => {
      setUrl("");
      void queryClient.invalidateQueries({ queryKey: ["history"] });
      router.push(`/dashboard/${data.item.id}`);
    },
  });

  const shareMutation = useMutation({
    mutationFn: (analysisId: string) =>
      apiFetch<{ shareId: string }>(`/dashboard/analysis/${analysisId}/share`, { method: "POST" }),
    onSuccess: ({ shareId }, analysisId) => {
      const shareUrl = `${window.location.origin}/share/${shareId}`;
      void navigator.clipboard.writeText(shareUrl);
      setCopiedShareId(analysisId);
      setTimeout(() => setCopiedShareId(null), 2000);
    },
  });

  const linkCodeMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ code: string; expiresAt: string }>("/auth/extension/link-code", {
        method: "POST",
      }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      setUser(null);
      clearAuth();
      clearAuthTokens();
      router.replace("/login");
    },
  });

  useEffect(() => {
    if (meQuery.isSuccess) {
      setUser(meQuery.data.user);
    }
  }, [meQuery.isSuccess, meQuery.data, setUser]);

  useEffect(() => {
    if (meQuery.isError) {
      router.replace("/login");
    }
  }, [meQuery.isError, router]);

  if (meQuery.isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fef2f2", border: "1px solid #fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
            {SPIN}
          </div>
          <p style={{ color: "#9ca3af", fontWeight: 800, fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Initializing Layer...</p>
        </div>
      </div>
    );
  }

  const history = historyQuery.data?.history ?? [];
  const chartData = buildChartData(history);
  const totalRuns = history.length;
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "??";

  const doAnalyze = () => {
    if (!url.trim()) { setUrlErr("Please enter an article URL."); return; }
    setUrlErr("");
    createAnalysisMutation.mutate(url);
  };

  const copyCode = () => {
    if (linkCodeMutation.data?.code) {
      navigator.clipboard.writeText(linkCodeMutation.data.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="dashboard-page" style={{ minHeight: "100vh", fontFamily: "'Cabinet Grotesk', sans-serif", background: "#ffffff", overflowX: "hidden", maxWidth: "100%" }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500,400&display=swap');
        @keyframes vd-spin  { to { transform: rotate(360deg) } }
        @keyframes vd-up    { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes vd-pulse { 0%,100%{ opacity:1; transform:scale(1) } 50%{ opacity:.3; transform:scale(.6) } }
        @keyframes vd-tick  { 0%{ transform:translateX(0) } 100%{ transform:translateX(-50%) } }

        .vd-a1{ animation:vd-up .4s ease forwards .04s; opacity:0 }
        .vd-a2{ animation:vd-up .4s ease forwards .10s; opacity:0 }
        .vd-a3{ animation:vd-up .4s ease forwards .17s; opacity:0 }
        .vd-a4{ animation:vd-up .4s ease forwards .24s; opacity:0 }
        .vd-a5{ animation:vd-up .4s ease forwards .31s; opacity:0 }

        .vd-pulse{ animation:vd-pulse 2s ease-in-out infinite }
        .vd-ticker{ animation:vd-tick 24s linear infinite; display:flex; width:max-content }
        .vd-ticker:hover{ animation-play-state:paused }

        .vd-nb{ transition:all .15s; cursor:pointer; font-family:'Cabinet Grotesk',sans-serif; border:none }
        .vd-nb:hover{ color:#dc2626!important; background:#fef2f2!important }

        .vd-gb{ transition:all .15s; cursor:pointer; font-family:'Cabinet Grotesk',sans-serif }
        .vd-gb:hover{ background:#f3f4f6!important; border-color:#d1d5db!important }

        .vd-gc{ transition:all .18s cubic-bezier(.4,0,.2,1); cursor:pointer; font-family:'Cabinet Grotesk',sans-serif }
        .vd-gc:hover:not(:disabled){ background:#fff!important; color:#dc2626!important; transform:translateY(-1px)!important }
        .vd-gc:active:not(:disabled){ transform:translateY(0)!important }

        .vd-rc{ transition:all .18s cubic-bezier(.4,0,.2,1); cursor:pointer; font-family:'Cabinet Grotesk',sans-serif }
        .vd-rc:hover:not(:disabled){ background:#b91c1c!important; transform:translateY(-1px)!important; box-shadow:0 10px 28px rgba(220,38,38,.22)!important }
        .vd-rc:active:not(:disabled){ transform:translateY(0)!important }

        .vd-dk{ transition:all .18s; cursor:pointer; font-family:'Cabinet Grotesk',sans-serif }
        .vd-dk:hover:not(:disabled){ opacity:.82!important; transform:translateY(-1px) }

        .vd-ri{ transition:border-color .18s, box-shadow .18s; outline:none; font-family:'Cabinet Grotesk',sans-serif }
        .vd-ri:focus{ border-color:rgba(255,255,255,.55)!important; box-shadow:0 0 0 3px rgba(255,255,255,.1)!important }
        .vd-ri::placeholder{ color:rgba(255,255,255,.35) }

        .vd-wi{ transition:border-color .18s, box-shadow .18s; outline:none; font-family:'Cabinet Grotesk',sans-serif }
        .vd-wi:focus{ border-color:#dc2626!important; box-shadow:0 0 0 3px rgba(220,38,38,.1)!important }
        .vd-wi::placeholder{ color:#9ca3af }

        .vd-hr{ transition:background .12s }
        .vd-hr:hover{ background:#fef2f2!important }

        .vd-sc{ transition:transform .15s, box-shadow .15s }
        .vd-sc:hover{ transform:translateY(-2px); box-shadow:0 6px 22px rgba(0,0,0,.07)!important }

        .vd-dg{ transition:transform .15s, background .15s }
        .vd-dg:hover{ transform:scale(1.06); background:#fce7e7!important }
      `}</style>

      {/* ════ NAV ════ */}
      <nav className="dashboard-nav" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,.94)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f3f4f6", height: "58px", padding: "0 32px",
        display: "flex", alignItems: "center", gap: "16px", flexWrap: "nowrap"
      }}>
        <div className="dashboard-nav-brand" style={{ display: "flex", alignItems: "center", gap: "9px", flexShrink: 0 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{ width: "33px", height: "33px", borderRadius: "9px", background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: "14px", letterSpacing: "-0.05em" }}>V</span>
            </div>
            <span className="dashboard-nav-title" style={{ fontWeight: 800, fontSize: "17px", letterSpacing: "-0.04em", color: "#111827" }}>Vouch</span>
          </Link>
          <span className="dashboard-nav-beta" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "9px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: "100px", padding: "2px 8px" }}>Beta</span>
        </div>

        <div className="dashboard-nav-divider" style={{ width: "1px", height: "18px", background: "#f0f0f0", flexShrink: 0 }} />

        <div className="dashboard-nav-live" style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span className="vd-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          <span className="dashboard-nav-live-text" style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>Live</span>
        </div>

        <div style={{ flex: 1 }} />

        <div className="dashboard-nav-stats" style={{ display: "flex", gap: "26px", marginRight: "12px" }}>
          {[["Week", `${totalRuns} runs`], ["Streak", "3 days"], ["Accuracy", "98%"]].map(([lbl, val]) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <div style={{ color: "#9ca3af", fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" }}>{lbl}</div>
              <div style={{ color: "#111827", fontSize: "13.5px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{val}</div>
            </div>
          ))}
        </div>

        <div className="dashboard-nav-divider dashboard-nav-divider--user" style={{ width: "1px", height: "18px", background: "#f0f0f0", flexShrink: 0 }} />

        <div className="dashboard-nav-user" style={{ display: "flex", alignItems: "center", gap: "9px", flexShrink: 0, marginLeft: "auto" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: "11px", fontWeight: 800 }}>{initials}</span>
          </div>
          <span className="dashboard-nav-email" style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{user?.email}</span>
          <button onClick={() => logoutMutation.mutate()} className="vd-nb dashboard-nav-logout" style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "1px solid #e5e7eb", borderRadius: "9px", padding: "7px 12px", color: "#6b7280", fontSize: "12.5px", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
            <LogOut size={13} />
            <span className="dashboard-nav-logout-text">Logout</span>
          </button>
        </div>
      </nav>

      {/* ════ CONTENT ════ */}
      <div className="dashboard-content" style={{ maxWidth: "1600px", margin: "0 auto", padding: "28px 28px 64px" }}>

        {/* Welcome — no card, just text */}
        <div className="vd-a1" style={{ marginBottom: "26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "7px" }}>
            <Sparkles size={13} color="#dc2626" />
            <span style={{ color: "#dc2626", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Dashboard</span>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(26px, 3vw, 38px)", letterSpacing: "-0.045em", color: "#111827", margin: 0, lineHeight: 1.05 }}>
            Welcome back, <span style={{ color: "#dc2626" }}>{user?.name?.split(" ")[0] || "User"}.</span>
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "14px", fontWeight: 500, margin: "7px 0 0" }}>
            Your reading intelligence layer — live and ready.
          </p>
        </div>

        {/* ════ BENTO GRID ════ */}
        <div className="dashboard-bento" style={{
          display: "grid",
          gridTemplateColumns: "42% 1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: "16px",
          marginBottom: "16px",
        }}>

          {/* RED ANALYSIS PANEL — col1, rows 1+2 */}
          <div className="vd-a2 dashboard-bento-red" style={{
            gridColumn: "1", gridRow: "1 / 3",
            background: "#dc2626", borderRadius: "20px",
            position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column", minHeight: "540px",
          }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents:"none", backgroundImage: "radial-gradient(circle, rgba(0,0,0,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
            <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "280px", height: "280px", borderRadius: "50%", background: "rgba(0,0,0,.1)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-140px", left: "-100px", width: "380px", height: "380px", borderRadius: "50%", border: "1px solid rgba(255,255,255,.07)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 2, flex: 1, padding: "30px 28px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "rgba(0,0,0,.15)", border: "1px solid rgba(255,255,255,.17)", borderRadius: "100px", padding: "4px 13px", width: "fit-content", marginBottom: "22px" }}>
                <Zap size={10} color="rgba(255,255,255,.85)" fill="rgba(255,255,255,.5)" />
                <span style={{ color: "rgba(255,255,255,.85)", fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>New Analysis</span>
              </div>

              <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(30px, 3vw, 48px)", letterSpacing: "-0.045em", lineHeight: "0.92", margin: "0 0 14px" }}>
                Read every<br />article.<br />
                <span style={{ color: "rgba(255,255,255,.35)", fontStyle: "italic" }}>like a journalist.</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,.65)", fontSize: "13px", fontWeight: 500, lineHeight: "1.72", margin: "0 0 28px", maxWidth: "300px" }}>
                Paste any article URL — Vouch fact-checks claims, surfaces bias, and lets you chat with the content in real time.
              </p>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", color: "rgba(255,255,255,.5)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "7px" }}>Article URL</label>
                <div style={{ position: "relative", marginBottom: urlErr ? "8px" : "12px" }}>
                  <div style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.35)" }}>
                    <Globe size={14} />
                  </div>
                  <input className="vd-ri" type="url" value={url} onChange={e => { setUrl(e.target.value); setUrlErr(""); }} placeholder="https://article-url.com" style={{ width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,.2)", border: "1.5px solid rgba(255,255,255,.2)", borderRadius: "12px", padding: "13px 14px 13px 38px", color: "#fff", fontSize: "14px", fontWeight: 500 }} />
                </div>
                {urlErr && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <AlertCircle size={12} color="rgba(255,255,255,.75)" />
                    <span style={{ color: "rgba(255,255,255,.75)", fontSize: "12px", fontWeight: 600 }}>{urlErr}</span>
                  </div>
                )}
                <button className="vd-gc" onClick={doAnalyze} disabled={createAnalysisMutation.isPending} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.28)", borderRadius: "12px", padding: "13px", color: "#fff", fontWeight: 800, fontSize: "14px", cursor: createAnalysisMutation.isPending ? "not-allowed" : "pointer", opacity: createAnalysisMutation.isPending ? .75 : 1 }}>
                  {createAnalysisMutation.isPending ? <>{SPIN} Analyzing…</> : <>Analyze Article <ArrowRight size={15} /></>}
                </button>
              </div>

              <div style={{ marginTop: "auto", display: "flex", gap: "7px", flexWrap: "wrap", paddingTop: "18px" }}>
                {["✓ Fact Check", "✓ Bias Detect", "✓ Chat Mode", "✓ Source Trace"].map(t => (
                  <span key={t} style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "100px", padding: "4px 11px", color: "rgba(255,255,255,.6)", fontSize: "9.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Ticker at bottom of red panel */}
            <div style={{ position: "relative", zIndex: 2, borderTop: "1px solid rgba(0,0,0,.12)", padding: "9px 0", overflow: "hidden" }}>
              <div className="vd-ticker">
                {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((p, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "0 16px", color: i % 3 === 0 ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.3)", fontSize: "9.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                    {p}<span style={{ color: "rgba(255,255,255,.2)" }}>·</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* LINK EXTENSION — col2, row1 */}
          <div className="vd-a3" style={{ gridColumn: "2", gridRow: "1", background: "#fff", borderRadius: "20px", border: "1px solid #f0f0ef", padding: "24px", display: "flex", flexDirection: "column", boxShadow: "0 1px 6px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "14px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Link2 size={15} color="#dc2626" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "14px", color: "#111827", letterSpacing: "-0.02em" }}>Link Extension</div>
                <div style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 500 }}>Browser pairing</div>
              </div>
            </div>

            <p style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, lineHeight: "1.65", margin: "0 0 18px" }}>
              Generate a <strong style={{ color: "#111827" }}>6-digit code</strong> and enter it in your extension settings to connect Vouch.
            </p>

            {linkCodeMutation.data ? (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                  {linkCodeMutation.data.code.split("").map((d, i) => (
                    <div key={i} className="vd-dg" style={{ flex: 1, height: "50px", borderRadius: "10px", background: "#fef2f2", border: "1.5px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "20px", color: "#dc2626" }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={10} color="#9ca3af" />
                    <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 600 }}>Expires {new Date(linkCodeMutation.data.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button className="vd-gb" onClick={copyCode} style={{ display: "flex", alignItems: "center", gap: "4px", background: copiedCode ? "#f0fdf4" : "#f9fafb", border: `1px solid ${copiedCode ? "#86efac" : "#e5e7eb"}`, borderRadius: "7px", padding: "4px 9px", color: copiedCode ? "#16a34a" : "#6b7280", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                    {copiedCode ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "5px", justifyContent: "center", background: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ width: "32px", height: "42px", borderRadius: "8px", background: "#f0f0ee", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "8px", height: "2px", background: "#d1d5db", borderRadius: "1px" }} />
                  </div>
                ))}
              </div>
            )}

            <button className="vd-dk" onClick={() => linkCodeMutation.mutate()} disabled={linkCodeMutation.isPending} style={{ marginTop: "auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", background: "#111827", border: "none", borderRadius: "12px", padding: "12px", color: "#fff", fontWeight: 800, fontSize: "13px", cursor: linkCodeMutation.isPending ? "not-allowed" : "pointer", opacity: linkCodeMutation.isPending ? .7 : 1 }}>
              {linkCodeMutation.isPending ? <>{SPIN} Generating…</> : <><RefreshCw size={12} />{linkCodeMutation.data ? "Regenerate Code" : "Generate Link Code"}</>}
            </button>
          </div>

          {/* STAT CELLS — col3, row1 */}
          <div className="vd-a3" style={{ gridColumn: "3", gridRow: "1", display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { lbl: "This Week", val: `${totalRuns}`, sub: "analyses",    bg: "#ffffff", brd: "#f0f0ef", vc: "#111827", sc: "#9ca3af", dot: false },
              { lbl: "Streak",    val: "3",         sub: "days active", bg: "#dc2626", brd: "#dc2626", vc: "#fff",    sc: "rgba(255,255,255,.55)", dot: true },
              { lbl: "Accuracy",  val: "98%",        sub: "fact checks", bg: "#fef2f2", brd: "#fecaca", vc: "#dc2626", sc: "#f87171", dot: false },
            ].map(({ lbl, val, sub, bg, brd, vc, sc, dot }) => (
              <div key={lbl} className="vd-sc" style={{ background: bg, border: `1px solid ${brd}`, borderRadius: "16px", padding: "16px 18px", flex: 1, position: "relative", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.03)" }}>
                {dot && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(0,0,0,.06) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ color: sc, fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "5px" }}>{lbl}</div>
                  <div style={{ color: vc, fontWeight: 800, fontSize: "32px", letterSpacing: "-0.055em", lineHeight: 1 }}>{val}</div>
                  <div style={{ color: sc, fontSize: "10.5px", fontWeight: 500, marginTop: "3px" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ACTIVITY CHART — col2+3, row2 */}
          <div className="vd-a4" style={{ gridColumn: "2 / 4", gridRow: "2", background: "#fff", borderRadius: "20px", border: "1px solid #f0f0ef", padding: "22px 22px 14px", boxShadow: "0 1px 6px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BarChart2 size={13} color="#dc2626" />
                  <span style={{ fontWeight: 800, fontSize: "14px", color: "#111827", letterSpacing: "-0.02em" }}>Analysis Activity</span>
                </div>
                <p style={{ color: "#9ca3af", fontSize: "11.5px", fontWeight: 500, margin: "3px 0 0" }}>Last 7 days</p>
              </div>
              <div style={{ background: "#f9fafb", border: "1px solid #f0f0ef", borderRadius: "9px", padding: "5px 12px", display: "flex", alignItems: "baseline", gap: "5px" }}>
                <span style={{ color: "#111827", fontWeight: 800, fontSize: "18px", letterSpacing: "-0.04em" }}>{totalRuns}</span>
                <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 600 }}>total</span>
              </div>
            </div>
            <div style={{ width: "100%", height: 140 }}>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData} barCategoryGap="38%">
                  <CartesianGrid vertical={false} stroke="#f5f5f3" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 700, fontFamily: "'Cabinet Grotesk',sans-serif" }} />
                  <Tooltip cursor={{ fill: "rgba(220,38,38,.05)", radius: 6 }}
                    content={({ active, payload, label }) => active && payload?.length ? (
                      <div style={{ background: "#fff", border: "1.5px solid #f0f0ef", borderRadius: "100px", padding: "8px 12px", boxShadow: "0 4px 16px rgba(0,0,0,.07)", fontFamily: "'Cabinet Grotesk',sans-serif" }}>
                        <div style={{ color: "#9ca3af", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
                        <div style={{ color: "#111827", fontWeight: 800, fontSize: "22px", letterSpacing: "-0.04em" }}>{payload[0].value}</div>
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="v" fill="#dc2626" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* HISTORY — full width */}
        <div className="vd-a5" style={{ background: "#fff", borderRadius: "20px", border: "1px solid #f0f0ef", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,.04)" }}>
          <div style={{ padding: "18px 26px", borderBottom: "1px solid #f9f9f8", display: "flex", alignItems: "center", gap: "10px" }}>
            <History size={14} color="#dc2626" />
            <span style={{ fontWeight: 800, fontSize: "14px", color: "#111827", letterSpacing: "-0.02em" }}>Analysis History</span>
            <span style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.06em", borderRadius: "100px", padding: "2px 8px" }}>{history.length}</span>
          </div>
          {history.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <p style={{ color: "#d1d5db", fontWeight: 700, fontSize: "14px", margin: 0 }}>No analyses yet. Create your first one.</p>
            </div>
          ) : history.map((item, i) => (
            <div key={item.id} className="vd-hr dashboard-history-row" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 26px", borderBottom: i < history.length - 1 ? "1px solid #f9f9f8" : "none" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#f9fafb", border: "1px solid #f0f0ef", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#9ca3af", fontSize: "10px", fontWeight: 800 }}>#{history.length - i}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#111827", fontSize: "13.5px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.inputUrl}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                  <Clock size={10} color="#9ca3af" />
                  <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 500 }}>{new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="dashboard-history-actions" style={{ display: "flex", gap: "7px", flexShrink: 0 }}>
                <Link href={`/dashboard/${item.id}`} style={{ textDecoration: "none" }}>
                  <button className="vd-gb" style={{ display: "flex", alignItems: "center", gap: "5px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "9px", padding: "7px 13px", color: "#374151", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                    <ExternalLink size={11} /> View
                  </button>
                </Link>
                <button className="vd-gb" onClick={() => shareMutation.mutate(item.id)} style={{ display: "flex", alignItems: "center", gap: "5px", background: copiedShareId === item.id ? "#f0fdf4" : "#f9fafb", border: `1px solid ${copiedShareId === item.id ? "#86efac" : "#e5e7eb"}`, borderRadius: "9px", padding: "7px 13px", color: copiedShareId === item.id ? "#16a34a" : "#374151", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  {copiedShareId === item.id ? <><Check size={11} /> Copied</> : <><Share2 size={11} /> Share</>}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}