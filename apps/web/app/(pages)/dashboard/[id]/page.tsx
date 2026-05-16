"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  Globe, 
  AlertCircle, 
  Zap,
  ShieldCheck,
  ExternalLink,
  MessageCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  LayoutGrid,
  Fingerprint,
  Target,
  Sparkles,
  ShieldAlert,
  Microscope,
  ScrollText,
  MousePointer2,
  Cpu,
  Quote,
  Search
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { HistoryItem, ClaimResult, BiasData, ChatMessage, VouchEntry } from "@vouch/types";

type DetailResponse = {
  item: HistoryItem;
};

// --- Compact Markdown Renderer ---
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const fontSizes = ["text-base", "text-sm", "text-[12px]"];
      elements.push(
        <div key={i} className={`font-black ${fontSizes[level-1] || "text-[12px]"} mt-3 mb-1 text-gray-900 flex items-center gap-2`}>
          <div className="w-1 h-3 bg-[#dc2626] rounded-full" />
          {inlineFormat(headingMatch[2])}
        </div>
      );
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 mb-1 text-[12px]">
          <span className="text-[#dc2626] font-black mt-0.5">•</span>
          <span className="text-gray-600 leading-relaxed font-medium">{inlineFormat(bulletMatch[1])}</span>
        </div>
      );
      continue;
    }

    elements.push(
      <div key={i} className="mb-1 text-[12px] text-gray-600 leading-relaxed font-medium">
        {inlineFormat(trimmed)}
      </div>
    );
  }
  return <>{elements}</>;
}

function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index} className="font-black text-gray-900">{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={match.index} className="italic text-gray-800 font-bold">{match[4]}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

// --- Compact Dashboard Components ---

const VerdictBadge = ({ verdict }: { verdict: ClaimResult['verdict'] }) => {
  const styles = {
    supported: "bg-green-50 text-green-700 border-green-200",
    contradicted: "bg-red-50 text-red-700 border-red-200",
    unverified: "bg-orange-50 text-orange-700 border-orange-200"
  };
  const Icon = verdict === 'supported' ? CheckCircle2 : verdict === 'contradicted' ? XCircle : HelpCircle;
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${styles[verdict]}`}>
      <Icon size={10} strokeWidth={3} />
      {verdict}
    </div>
  );
};

const BentoCard = ({ children, title, icon: Icon, color = "gray", className = "" }: { children: React.ReactNode, title: string, icon: any, color?: string, className?: string }) => {
  const themes: Record<string, string> = {
    red: "bg-red-50/30 border-red-100",
    blue: "bg-blue-50/30 border-blue-100",
    orange: "bg-orange-50/30 border-orange-100",
    purple: "bg-purple-50/30 border-purple-100",
    gray: "bg-white border-gray-100"
  };
  const iconColors: Record<string, string> = {
    red: "text-red-600 bg-red-100/50",
    blue: "text-blue-600 bg-blue-100/50",
    orange: "text-orange-600 bg-orange-100/50",
    purple: "text-purple-600 bg-purple-100/50",
    gray: "text-gray-600 bg-gray-100/50"
  };

  return (
    <div className={`rounded-3xl border p-5 lg:p-7 flex flex-col shadow-sm hover:shadow-md transition-all ${themes[color]} ${className}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`p-1.5 rounded-lg ${iconColors[color]}`}>
          <Icon size={14} strokeWidth={2.5} />
        </div>
        <h3 className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">{title}</h3>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

function AuditChatPanel({ messages }: { messages: ChatMessage[] }) {
  if (!messages?.length) {
    return (
      <div className="py-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-200 bg-gradient-to-b from-red-50/50 to-white">
        <MessageCircle size={28} className="mb-3 text-red-300" />
        <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-red-400">No chat history yet</p>
      </div>
    );
  }

  return (
    <motion.div className="rounded-2xl overflow-hidden border border-red-200/70 shadow-lg shadow-red-100/50 bg-gradient-to-b from-red-50/60 via-white to-white">
      <motion.div className="bg-gradient-to-r from-[#dc2626] to-[#b91c1c] px-4 py-3.5 lg:px-5 lg:py-4 flex items-center gap-3">
        <motion.div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-white/20 flex items-center justify-center ring-2 ring-white/30">
          <Sparkles size={18} className="text-white" />
        </motion.div>
        <motion.div>
          <p className="text-white font-black text-sm lg:text-base">Vouch Assistant</p>
          <p className="text-white/75 text-[10px] lg:text-[11px] font-bold uppercase tracking-wider">Powered by your audit session</p>
        </motion.div>
      </motion.div>
      <motion.div className="p-4 lg:p-5 space-y-4 max-h-[480px] lg:max-h-[560px] overflow-y-auto">
        {messages.map((msg, i) => (
          <motion.div key={i} className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <motion.div
              className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === "user" ? "bg-[#dc2626] text-white" : "bg-red-100 text-[#dc2626] border border-red-200"
              }`}
            >
              {msg.sender === "user" ? <MousePointer2 size={14} /> : <Sparkles size={14} />}
            </motion.div>
            <motion.div className={`flex flex-col max-w-[88%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-1 ${msg.sender === "user" ? "text-white/70" : "text-gray-400"}`}>
                {msg.sender === "user" ? "You" : "Vouch AI"}
              </span>
              <motion.div
                className={`px-4 py-3 rounded-2xl text-[12px] lg:text-[14px] font-semibold leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white rounded-tr-md shadow-md shadow-red-300/40 [&_*]:!text-white [&_strong]:!text-white [&_em]:!text-white/90"
                    : "bg-white text-gray-800 rounded-tl-md border border-red-100 shadow-sm ring-1 ring-red-50/80"
                }`}
              >
                {renderMarkdown(msg.text)}
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

type MobileTab = "analysis" | "chat" | "bias";

export default function DashboardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<MobileTab>("analysis");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["analysis", params.id],
    queryFn: () => apiFetch<DetailResponse>(`/dashboard/analysis/${params.id}`),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white font-cabinet">
        <div className="w-6 h-6 border-2 border-gray-100 border-t-[#dc2626] rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-black text-[9px] uppercase tracking-[0.4em]">Establishing Neural Link...</p>
      </div>
    );
  }

  if (isError || !data?.item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-cabinet p-6">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
            <ShieldAlert size={24} className="text-[#dc2626]" />
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-2 uppercase">Record Not Found</h2>
          <button 
            onClick={() => router.replace("/dashboard")}
            className="w-full bg-[#dc2626] text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl flex items-center justify-center gap-3"
          >
            <ArrowLeft size={14} /> Back to Grid
          </button>
        </div>
      </div>
    );
  }

  const item = data.item;

  return (
    <div className="min-h-screen bg-[#fafafa] font-cabinet text-[#111827] selection:bg-red-100 selection:text-[#dc2626]">
      <style jsx global>{`
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500,400&display=swap');
        .font-cabinet { font-family: 'Cabinet Grotesk', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #dc2626; }
      `}</style>

      {/* --- Header --- */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-gray-100 h-14 px-6 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 bg-[#dc2626] rounded-lg flex items-center justify-center shadow-lg shadow-red-100">
            <span className="text-white font-black text-lg italic">V</span>
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 leading-none">Audit Engine</span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status: Verified</span>
          </div>
        </div>
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 text-[9px] font-black text-gray-500 hover:text-white hover:bg-[#dc2626] transition-all bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm"
        >
          <ArrowLeft size={12} /> BACK
        </Link>
      </nav>

      <main className="w-full max-w-[1400px] lg:max-w-[1520px] mx-auto p-6 md:p-8 lg:p-10">
        
        {/* --- Hero --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-9 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-[#dc2626] font-black text-[9px] uppercase tracking-[0.4em] mb-3 bg-red-50 w-fit px-2 py-0.5 rounded-lg border border-red-100">
              <Fingerprint size={10} /> Neural Session: {item.id.slice(0, 12).toUpperCase()}
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-[1.1] text-gray-900 mb-4 italic uppercase">
              {item.pageTitle || "Unidentified Stream"}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href={item.inputUrl} target="_blank" className="flex items-center gap-2 group">
                <Globe size={12} className="text-gray-400 group-hover:text-[#dc2626]" />
                <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-900 truncate max-w-[400px] underline underline-offset-4 decoration-gray-200">
                  {item.inputUrl.replace(/^https?:\/\//, '')}
                </span>
              </a>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-[#dc2626] rounded-3xl p-5 text-white shadow-xl shadow-red-100 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 opacity-10 group-hover:scale-110 transition-transform"><Zap size={80} /></div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Bias Score</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-5xl font-black tracking-tighter leading-none">{item.biasScore !== null ? Math.round(item.biasScore) : (item.biasData?.biasScore ?? 0)}</span>
                <span className="text-lg font-black opacity-40">%</span>
              </div>
              <div className="bg-black/10 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest w-fit">
                {item.biasData?.biasDirection || 'NEUTRAL'} LEANING
              </div>
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden flex gap-2 mb-5 p-1.5 bg-gray-100 rounded-2xl">
          {([
            { id: "analysis" as const, label: "Analysis" },
            { id: "chat" as const, label: "AI Chat" },
            { id: "bias" as const, label: "Bias" },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all ${
                mobileTab === tab.id ? "bg-[#dc2626] text-white shadow-md shadow-red-200" : "text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- Bento Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column (8/12) */}
          <div className={`lg:col-span-8 space-y-6 ${mobileTab !== "analysis" ? "hidden lg:block" : ""}`}>
            
            <BentoCard title="Executive Verdict" icon={ShieldCheck} color="red">
              <div className="bg-white rounded-2xl p-5 border border-red-50 shadow-sm relative overflow-hidden group">
                <div className="absolute -top-1 -right-1 opacity-[0.02] group-hover:scale-110 transition-transform"><ScrollText size={80} /></div>
                <div className="relative z-10">
                  {renderMarkdown(item.aiResponse || item.biasData?.overallTone || "Decoding analysis...")}
                </div>
              </div>
            </BentoCard>

            <BentoCard title="Claims Verification" icon={FileText} color="blue">
              {item.claimsData && item.claimsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.claimsData.map((claim, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-blue-200 transition-all flex flex-col justify-between">
                      <div className="mb-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-[12px] lg:text-sm font-black leading-tight text-gray-900 italic">"{claim.claim}"</h4>
                          <VerdictBadge verdict={claim.verdict} />
                        </div>
                        <p className="text-[10px] lg:text-xs text-gray-500 font-medium leading-relaxed">{claim.explanation}</p>
                      </div>
                      {claim.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-50">
                          {claim.sources.map((source, si) => (
                            <a key={si} href={source} target="_blank" className="flex items-center gap-1 bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-100 text-[8px] font-black text-blue-600">
                              <ExternalLink size={8} /> {source.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-gray-300 border border-dashed border-gray-200 rounded-2xl">
                  <Search size={24} className="mb-2 opacity-20" />
                  <p className="text-[9px] font-black uppercase tracking-widest">No claims found</p>
                </div>
              )}
            </BentoCard>

            <BentoCard title="Deep Vouch History" icon={Zap} color="orange">
              {item.vouchHistory && item.vouchHistory.length > 0 ? (
                <div className="space-y-4">
                  {item.vouchHistory.map((vouch, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-orange-50/50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-orange-600 uppercase italic flex items-center gap-2">
                          <Microscope size={12} /> {vouch.claim}
                        </h3>
                        <span className="text-[8px] font-black text-gray-400 uppercase">{new Date(vouch.savedAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="p-4 text-gray-700 bg-white">
                        {renderMarkdown(vouch.result)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-gray-300 border border-dashed border-gray-200 rounded-2xl">
                  <Target size={24} className="mb-2 opacity-20" />
                  <p className="text-[9px] font-black uppercase tracking-widest">No vouches requested</p>
                </div>
              )}
            </BentoCard>
          </div>

          {/* Right Column (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className={mobileTab !== "chat" ? "hidden lg:block" : ""}>
                <AuditChatPanel messages={item.chatHistory ?? []} />
            </div>

            <div className={mobileTab !== "bias" ? "hidden lg:block" : ""}>
            <BentoCard title="Linguistic Patterns" icon={AlertTriangle} color="orange">
              <div className="space-y-4">
                <div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-[#dc2626]" /> Manipulative Language
                  </div>
                  <div className="space-y-2">
                    {item.biasData?.manipulativeLanguage && item.biasData.manipulativeLanguage.length > 0 ? item.biasData.manipulativeLanguage.map((ml, i) => (
                      <div key={i} className="bg-red-50/50 border border-red-100/50 p-2.5 rounded-xl">
                        <p className="text-[11px] font-black text-gray-900 italic mb-1 leading-tight">"{ml.sentence}"</p>
                        <p className="text-[9px] font-bold text-red-600 uppercase tracking-tight flex items-center gap-1">
                          <Sparkles size={10} /> {ml.reason}
                        </p>
                      </div>
                    )) : <p className="text-[9px] text-gray-300 italic font-bold">None detected.</p>}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-orange-500" /> Opinion Frames
                  </div>
                  <div className="space-y-2">
                    {item.biasData?.opinionAsFact && item.biasData.opinionAsFact.length > 0 ? item.biasData.opinionAsFact.map((of, i) => (
                      <div key={i} className="bg-orange-50/50 border border-orange-100/50 p-2.5 rounded-xl">
                        <p className="text-[11px] font-black text-gray-900 italic mb-1 leading-tight">"{of.sentence}"</p>
                        <p className="text-[9px] font-bold text-orange-600 uppercase tracking-tight flex items-center gap-1">
                          <Target size={10} /> {of.reason}
                        </p>
                      </div>
                    )) : <p className="text-[9px] text-gray-300 italic font-bold">None detected.</p>}
                  </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard title="System Meta" icon={LayoutGrid} color="gray">
              <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                {[
                  { label: "Audit Hash", val: item.id.slice(0, 10).toUpperCase(), icon: Fingerprint },
                  { label: "Security", val: "AES-256", icon: ShieldCheck },
                  { label: "Visibility", val: "Private", icon: MousePointer2 }
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
                    <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                      <m.icon size={8} /> {m.label}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-gray-700">{m.val}</span>
                  </div>
                ))}
              </div>
            </BentoCard>
            </div>

          </div>
        </div>

        {/* --- Footer --- */}
        <footer className="py-20 flex flex-col items-center justify-center opacity-[0.03] select-none pointer-events-none grayscale">
          <div className="text-[12vw] font-black tracking-tighter italic leading-none">VOUCH</div>
          <div className="text-[0.8vw] font-black tracking-[1em] uppercase -mt-4">Intelligence Audit Grid</div>
        </footer>
      </main>
    </div>
  );
}
